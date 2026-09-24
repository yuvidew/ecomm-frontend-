import { act, renderHook, waitFor } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { useSignIn } from '../hooks/use-sign-in'
import { authKeys } from '@/lib/query-keys'
import { createProvidersWrapper, createTestQueryClient } from '@/test/render'
import { makeTestToken } from '@/test/jwt'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

describe('useSignIn', () => {
  it('signs in and writes the decoded session into the authKeys.session cache on success', async () => {
    const token = makeTestToken({ id: 7, email: 'ada@example.com', role: 'customer' })
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Welcome to e-comm', accessToken: token, role: 'customer' }, { status: 201 }),
      ),
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignIn(), { wrapper: createProvidersWrapper(queryClient) })

    act(() => result.current.mutate({ email: 'ada@example.com', password: 'password1' }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(authKeys.session)).toEqual({
      accessToken: token,
      user: { id: 7, email: 'ada@example.com', role: 'customer' },
    })
  })

  it('surfaces "Invalid email or password" on a 401 and leaves the session cache untouched', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 401 }),
      ),
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignIn(), { wrapper: createProvidersWrapper(queryClient) })

    act(() => result.current.mutate({ email: 'ada@example.com', password: 'wrong' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Invalid email or password')
    expect(queryClient.getQueryData(authKeys.session)).toBeUndefined()
  })
})
