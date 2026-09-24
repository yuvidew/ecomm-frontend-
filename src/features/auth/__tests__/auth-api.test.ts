import { http as mswHttp, HttpResponse } from 'msw'
import { logout, refreshSession, signIn, signUp } from '../api/auth'
import { server } from '@/test/server'
import { makeTestToken } from '@/test/jwt'

const BASE_URL = 'http://localhost:5000'

describe('signUp', () => {
  it('POSTs { name, email, password, role: "customer" } to /api/auth/sign-up', async () => {
    let body: unknown
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ message: 'Account is creted successfully' }, { status: 201 })
      }),
    )

    const result = await signUp({ name: 'Ada', email: 'ada@example.com', password: 'password1' })

    expect(body).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'password1', role: 'customer' })
    expect(result).toEqual({ message: 'Account is creted successfully' })
  })

  it('rejects with the backend message on a 409 (email already registered)', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    )

    await expect(signUp({ name: 'Ada', email: 'ada@example.com', password: 'password1' })).rejects.toMatchObject({
      response: { status: 409, data: { message: 'Email already registered' } },
    })
  })
})

describe('signIn', () => {
  it('POSTs { email, password, role: "customer" } to /api/auth/sign-in', async () => {
    let body: unknown
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ message: 'Welcome to e-comm', accessToken: 'tok', role: 'customer' }, { status: 201 })
      }),
    )

    const result = await signIn({ email: 'ada@example.com', password: 'password1' })

    expect(body).toEqual({ email: 'ada@example.com', password: 'password1', role: 'customer' })
    expect(result).toEqual({ message: 'Welcome to e-comm', accessToken: 'tok', role: 'customer' })
  })

  it('rethrows a hardcoded "Invalid email or password" on any 401, ignoring the backend body', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 401 }),
      ),
    )

    await expect(signIn({ email: 'ada@example.com', password: 'wrong' })).rejects.toThrow('Invalid email or password')
  })

  it('propagates non-401 errors unchanged', async () => {
    server.use(mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () => HttpResponse.json({ message: 'Server error' }, { status: 500 })))

    await expect(signIn({ email: 'ada@example.com', password: 'password1' })).rejects.toMatchObject({
      response: { status: 500 },
    })
  })
})

describe('refreshSession', () => {
  it('decodes the access token returned by POST /api/auth/refresh-token into a session', async () => {
    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    server.use(mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => HttpResponse.json({ accessToken: token })))

    await expect(refreshSession()).resolves.toEqual({
      accessToken: token,
      user: { id: 1, email: 'ada@example.com', role: 'customer' },
    })
  })

  it('never throws -- resolves null when the refresh call fails', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () =>
        HttpResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 }),
      ),
    )

    await expect(refreshSession()).resolves.toBeNull()
  })
})

describe('logout', () => {
  it('POSTs to /api/auth/logout and returns the backend message', async () => {
    server.use(mswHttp.post(`${BASE_URL}/api/auth/logout`, () => HttpResponse.json({ message: 'Logged ou successfully' })))

    await expect(logout()).resolves.toEqual({ message: 'Logged ou successfully' })
  })
})
