import { renderHook, waitFor } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { useSession } from '../hooks/use-session'
import { authKeys } from '@/lib/query-keys'
import { createProvidersWrapper, createTestQueryClient } from '@/test/render'
import { makeTestToken } from '@/test/jwt'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

describe('useSession', () => {
  it('starts loading, then bootstraps via POST /api/auth/refresh-token and exposes the decoded session', async () => {
    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    server.use(mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => HttpResponse.json({ accessToken: token })))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useSession(), { wrapper: createProvidersWrapper(queryClient) })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.session).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.session).toEqual({
      accessToken: token,
      user: { id: 1, email: 'ada@example.com', role: 'customer' },
    })
    expect(queryClient.getQueryData(authKeys.session)).toEqual(result.current.session)
  })

  it('resolves session to null when there is no valid refresh cookie', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () =>
        HttpResponse.json({ message: 'No refresh token required' }, { status: 401 }),
      ),
    )
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useSession(), { wrapper: createProvidersWrapper(queryClient) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.session).toBeNull()
  })

  it('never refetches after the initial bootstrap (staleTime: Infinity, no refetch on remount)', async () => {
    let calls = 0
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => {
        calls += 1
        return HttpResponse.json({ message: 'No refresh token required' }, { status: 401 })
      }),
    )
    const queryClient = createTestQueryClient()

    const first = renderHook(() => useSession(), { wrapper: createProvidersWrapper(queryClient) })
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    first.unmount()

    const second = renderHook(() => useSession(), { wrapper: createProvidersWrapper(queryClient) })
    expect(second.result.current.isLoading).toBe(false)
    expect(calls).toBe(1)
  })
})
