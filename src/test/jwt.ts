/**
 * makeTestToken — builds a JWT-shaped string (header.payload.signature, no
 * real signing) whose payload segment `src/lib/jwt.ts#decodeAccessToken` can
 * decode. Used to seed sessions and stub sign-in/refresh responses in tests.
 */
export const makeTestToken = (payload: { id: number; email: string; role: string }) => {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`
}
