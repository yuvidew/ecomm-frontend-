import type { AuthUser } from '@/types/auth'

/**
 * decodeAccessToken — reads the `{ id, email, role }` payload out of a JWT
 * access token client-side (base64url decode only, no signature check --
 * that's the backend's job). Needed because sign-in's response only
 * contains the raw token string, not a user object.
 * @param token - raw JWT access token
 * @returns the decoded user, or `null` if the token is malformed
 */
export const decodeAccessToken = (token: string): AuthUser | null => {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const decoded = JSON.parse(json) as Partial<AuthUser>
    if (typeof decoded.id !== 'number' || typeof decoded.email !== 'string' || typeof decoded.role !== 'string') {
      return null
    }
    return { id: decoded.id, email: decoded.email, role: decoded.role }
  } catch {
    return null
  }
}
