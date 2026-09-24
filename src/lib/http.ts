import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { authKeys } from '@/lib/query-keys'
import { decodeAccessToken } from '@/lib/jwt'
import type { AuthSession } from '@/types/auth'

// base URL of the e-comm backend (Express API), configurable per environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/**
 * http — shared axios instance for all backend calls.
 * `withCredentials` is required because the backend issues the refresh
 * token as an httpOnly cookie (see backend `refreshCookieOption`).
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// auth endpoints never go through the 401-refresh-retry flow, otherwise a
// failed sign-in/refresh-token call itself would trigger another refresh
const AUTH_ENDPOINTS = ['/api/auth/sign-in', '/api/auth/sign-up', '/api/auth/refresh-token', '/api/auth/logout']
const isAuthEndpoint = (url?: string) => AUTH_ENDPOINTS.some((path) => url?.includes(path))

http.interceptors.request.use((config) => {
  const token = queryClient.getQueryData<AuthSession | null>(authKeys.session)?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// shared in-flight refresh promise so concurrent 401s trigger one refresh call, not N
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = http
      .post<{ accessToken: string }>('/api/auth/refresh-token')
      .then(({ data }) => {
        const user = decodeAccessToken(data.accessToken)
        const session = user ? { accessToken: data.accessToken, user } : null
        queryClient.setQueryData(authKeys.session, session)
        return session?.accessToken ?? null
      })
      .catch(() => {
        queryClient.setQueryData(authKeys.session, null)
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && original && !isAuthEndpoint(original.url) && !original._retry) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      }
      toast.error('Session expired, please sign in again')
      window.location.assign('/sign-in')
    }

    return Promise.reject(error)
  },
)

/**
 * getApiErrorMessage — normalizes a caught error into a display string.
 * @param error - the caught error, typically an AxiosError
 * @param fallback - message to use when no usable message can be extracted
 */
export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

/**
 * getApiFieldErrors — extracts the per-field messages from a 400 response
 * produced by the backend's zod validate.middleware (`{ message, errors }`).
 * @param error - the caught error, typically an AxiosError
 * @returns field name → messages, or undefined when the error has none
 */
export const getApiFieldErrors = <TField extends string>(
  error: unknown,
): Partial<Record<TField, string[]>> | undefined => {
  if (isAxiosError<{ errors?: Partial<Record<TField, string[]>> }>(error)) {
    return error.response?.data?.errors
  }
  return undefined
}
