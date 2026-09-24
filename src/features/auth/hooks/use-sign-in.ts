import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/lib/query-keys'
import { decodeAccessToken } from '@/lib/jwt'
import { signIn } from '../api/auth'

/**
 * useSignIn — mutation hook for POST /api/auth/sign-in.
 * @returns TanStack mutation result: call `mutate({ email, password })` to sign in.
 */
export const useSignIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      const user = decodeAccessToken(data.accessToken)
      queryClient.setQueryData(authKeys.session, user ? { accessToken: data.accessToken, user } : null)
    },
  })
}
