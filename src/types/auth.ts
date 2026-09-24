/** AuthUser — user identity decoded from the access token JWT payload. */
export type AuthUser = {
  id: number
  email: string
  role: string
}

/** AuthSession — the in-memory session held in the `["auth", "session"]` query cache. */
export type AuthSession = {
  accessToken: string
  user: AuthUser
}
