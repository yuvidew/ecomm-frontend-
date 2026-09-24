import { isAxiosError } from 'axios'
import { http } from '@/lib/http'
import { decodeAccessToken } from '@/lib/jwt'
import type { AuthSession } from '@/types/auth'
import type {
  LogoutResponse,
  RefreshTokenResponse,
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
} from '../types/auth'

// this storefront is customer-facing only -- no role picker in the UI
const CUSTOMER_ROLE = 'customer'

/** signUp — calls POST /api/auth/sign-up. */
export const signUp = async (input: SignUpInput): Promise<SignUpResponse> => {
  const { data } = await http.post<SignUpResponse>('/api/auth/sign-up', { ...input, role: CUSTOMER_ROLE })
  return data
}

/**
 * signIn — calls POST /api/auth/sign-in. Normalizes the backend's buggy
 * "Internal Server Error" 401 body (typo bug in the backend) into a
 * friendly, accurate message.
 */
export const signIn = async (input: SignInInput): Promise<SignInResponse> => {
  try {
    const { data } = await http.post<SignInResponse>('/api/auth/sign-in', { ...input, role: CUSTOMER_ROLE })
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('Invalid email or password', { cause: error })
    }
    throw error
  }
}

/**
 * refreshSession — calls POST /api/auth/refresh-token and decodes the
 * returned access token into a session. Never throws: no valid session is
 * a normal outcome, not an error.
 */
export const refreshSession = async (): Promise<AuthSession | null> => {
  try {
    const { data } = await http.post<RefreshTokenResponse>('/api/auth/refresh-token')
    const user = decodeAccessToken(data.accessToken)
    return user ? { accessToken: data.accessToken, user } : null
  } catch {
    return null
  }
}

/** logout — calls POST /api/auth/logout. */
export const logout = async (): Promise<LogoutResponse> => {
  const { data } = await http.post<LogoutResponse>('/api/auth/logout')
  return data
}
