import { http as mswHttp, HttpResponse } from 'msw'
import { getApiErrorMessage, getApiFieldErrors, http } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { authKeys } from '@/lib/query-keys'
import { server } from '@/test/server'
import { makeTestToken } from '@/test/jwt'

const BASE_URL = 'http://localhost:5000'

const seedSession = (token: string) =>
  queryClient.setQueryData(authKeys.session, {
    accessToken: token,
    user: { id: 1, email: 'ada@example.com', role: 'customer' },
  })

describe('http request interceptor', () => {
  it('attaches Authorization: Bearer <token> when a session exists in the shared query client', async () => {
    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    seedSession(token)
    let capturedAuth: string | null = null
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await http.get('/api/protected')

    expect(capturedAuth).toBe(`Bearer ${token}`)
  })

  it('omits the Authorization header when no session exists', async () => {
    let capturedAuth: string | null = 'unset'
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await http.get('/api/protected')

    expect(capturedAuth).toBeNull()
  })
})

describe('http response interceptor', () => {
  it('refreshes the access token and retries the original request once on a 401 from a non-auth endpoint', async () => {
    const oldToken = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    const newToken = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    seedSession(oldToken)
    let calls = 0
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, ({ request }) => {
        calls += 1
        if (calls === 1) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        return HttpResponse.json({ auth: request.headers.get('authorization') })
      }),
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => HttpResponse.json({ accessToken: newToken })),
    )

    const { data } = await http.get<{ auth: string | null }>('/api/protected')

    expect(calls).toBe(2)
    expect(data.auth).toBe(`Bearer ${newToken}`)
    expect(queryClient.getQueryData(authKeys.session)).toEqual({
      accessToken: newToken,
      user: { id: 1, email: 'ada@example.com', role: 'customer' },
    })
  })

  it('dedupes concurrent 401s into a single refresh-token call', async () => {
    const oldToken = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    const newToken = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    seedSession(oldToken)
    let protectedCalls = 0
    let refreshCalls = 0
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => {
        protectedCalls += 1
        // only the first attempt of each of the two concurrent requests should 401
        if (protectedCalls <= 2) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        return HttpResponse.json({ ok: true })
      }),
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json({ accessToken: newToken })
      }),
    )

    await Promise.all([http.get('/api/protected'), http.get('/api/protected')])

    expect(refreshCalls).toBe(1)
  })

  it('clears the session, toasts, and hard-redirects to /sign-in when the refresh call itself fails', async () => {
    const originalLocation = window.location
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...originalLocation, assign: assignSpy }, writable: true })

    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    seedSession(token)
    server.use(
      mswHttp.get(`${BASE_URL}/api/protected`, () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () =>
        HttpResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 }),
      ),
    )

    await expect(http.get('/api/protected')).rejects.toBeTruthy()

    expect(queryClient.getQueryData(authKeys.session)).toBeNull()
    expect(assignSpy).toHaveBeenCalledWith('/sign-in')

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('does not attempt a refresh+retry for a 401 returned by an auth endpoint itself', async () => {
    let refreshCalls = 0
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 401 })),
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => {
        refreshCalls += 1
        return HttpResponse.json({ accessToken: 'x' })
      }),
    )

    await expect(
      http.post('/api/auth/sign-in', { email: 'ada@example.com', password: 'password1', role: 'customer' }),
    ).rejects.toBeTruthy()

    expect(refreshCalls).toBe(0)
  })
})

describe('getApiErrorMessage', () => {
  it('returns the backend { message } from an axios error response', async () => {
    server.use(mswHttp.get(`${BASE_URL}/api/fail`, () => HttpResponse.json({ message: 'Boom' }, { status: 400 })))

    const error = await http.get('/api/fail').catch((caught) => caught)

    expect(getApiErrorMessage(error)).toBe('Boom')
  })

  it('falls back to the provided default when the response has no usable message', async () => {
    server.use(mswHttp.get(`${BASE_URL}/api/fail`, () => HttpResponse.json({}, { status: 500 })))

    const error = await http.get('/api/fail').catch((caught) => caught)

    expect(getApiErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('returns a plain Error message when the error is not an axios error', () => {
    expect(getApiErrorMessage(new Error('Invalid email or password'))).toBe('Invalid email or password')
  })
})

describe('getApiFieldErrors', () => {
  it('extracts the zod fieldErrors map from a 400 { message, errors } response', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/fail`, () =>
        HttpResponse.json({ message: 'Validation failed', errors: { email: ['Invalid email address'] } }, { status: 400 }),
      ),
    )

    const error = await http.post('/api/fail', {}).catch((caught) => caught)

    expect(getApiFieldErrors(error)).toEqual({ email: ['Invalid email address'] })
  })

  it('returns undefined when the error carries no field errors', () => {
    expect(getApiFieldErrors(new Error('network down'))).toBeUndefined()
  })
})
