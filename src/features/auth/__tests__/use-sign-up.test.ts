import { act, renderHook, waitFor } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { useSignUp } from '../hooks/use-sign-up'
import { getApiFieldErrors } from '@/lib/http'
import { authKeys } from '@/lib/query-keys'
import { createProvidersWrapper, createTestQueryClient } from '@/test/render'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

describe('useSignUp', () => {
  it('signs up without writing any session cache (backend returns no tokens, no auto-login)', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json({ message: 'Account is creted successfully' }, { status: 201 }),
      ),
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignUp(), { wrapper: createProvidersWrapper(queryClient) })

    act(() => result.current.mutate({ name: 'Ada', email: 'ada@example.com', password: 'password1' }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ message: 'Account is creted successfully' })
    expect(queryClient.getQueryData(authKeys.session)).toBeUndefined()
  })

  it('exposes the 400 { message, errors } payload for the caller to map onto form fields', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json(
          { message: 'Validation failed', errors: { email: ['Invalid email address'] } },
          { status: 400 },
        ),
      ),
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignUp(), { wrapper: createProvidersWrapper(queryClient) })

    act(() => result.current.mutate({ name: 'Ada', email: 'bad', password: 'password1' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getApiFieldErrors(result.current.error)).toEqual({ email: ['Invalid email address'] })
  })

  it('surfaces the 409 "Email already registered" message on a duplicate sign-up', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignUp(), { wrapper: createProvidersWrapper(queryClient) })

    act(() => result.current.mutate({ name: 'Ada', email: 'ada@example.com', password: 'password1' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ response: { status: 409, data: { message: 'Email already registered' } } })
  })
})
