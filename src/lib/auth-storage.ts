import { decodeAccessToken, isTokenExpired } from '@/lib/jwt'
import type { AuthSession } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const ROLE_KEY = 'role'

/**
 * readStoredSession — rebuilds a session from the access token saved in
 * localStorage, or null if there's none, it's malformed, or it has expired.
 */
export const readStoredSession = (): AuthSession | null => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken || isTokenExpired(accessToken)) return null
    const user = decodeAccessToken(accessToken)
    return user ? { accessToken, user } : null
  } catch {
    return null
  }
}

/**
 * persistAuthSession — write-through mirror of the auth session query cache
 * into localStorage. Storage can throw in private mode / blocked storage;
 * failures are swallowed since the in-memory session still works for this
 * tab either way.
 * @param session - current session, or `null` when signed out
 */
export const persistAuthSession = (session: AuthSession | null) => {
  try {
    if (session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
      localStorage.setItem(ROLE_KEY, session.user.role)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(ROLE_KEY)
    }
  } catch {
    // storage unavailable -- in-memory session still works for this tab
  }
}
