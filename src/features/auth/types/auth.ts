/** SignUpInput — fields collected by the sign-up form. */
export type SignUpInput = {
  name: string
  email: string
  password: string
}

/** SignUpRequest — body sent to POST /api/auth/sign-up. */
export type SignUpRequest = SignUpInput & { role: string }

/** SignUpResponse — body returned by POST /api/auth/sign-up. */
export type SignUpResponse = {
  message: string
}

/** SignInInput — fields collected by the sign-in form. */
export type SignInInput = {
  email: string
  password: string
}

/** SignInRequest — body sent to POST /api/auth/sign-in. */
export type SignInRequest = SignInInput & { role: string }

/** SignInResponse — body returned by POST /api/auth/sign-in. */
export type SignInResponse = {
  message: string
  accessToken: string
  role: string
}

/** RefreshTokenResponse — body returned by POST /api/auth/refresh-token. */
export type RefreshTokenResponse = {
  accessToken: string
}

/** LogoutResponse — body returned by POST /api/auth/logout. */
export type LogoutResponse = {
  message: string
}
