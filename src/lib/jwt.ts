import type { AuthUser } from '@/types/auth'

// base64url-decodes a JWT's payload segment; null if malformed
const decodePayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * isTokenExpired — true when the JWT's `exp` claim is in the past, or the token
 * has no readable `exp` at all.
 * @param token - raw JWT access token
 */
export const isTokenExpired = (token: string): boolean => {
  const exp = decodePayload(token)?.exp
  return typeof exp !== 'number' || exp * 1000 <= Date.now()
}

/**
 * decodeAccessToken — reads the `{ id, email, role }` payload out of a JWT
 * access token client-side (base64url decode only, no signature check --
 * that's the backend's job). Needed because sign-in's response only
 * contains the raw token string, not a user object.
 * @param token - raw JWT access token
 * @returns the decoded user, or `null` if the token is malformed
 */
export const decodeAccessToken = (token: string): AuthUser | null => {
  const decoded = decodePayload(token)
  if (!decoded || typeof decoded.id !== 'number' || typeof decoded.email !== 'string' || typeof decoded.role !== 'string') {
    return null
  }
  return { id: decoded.id, email: decoded.email, role: decoded.role }
}
