import { useMutation } from '@tanstack/react-query'
import { signUp } from '../api/auth'

/**
 * useSignUp — mutation hook for POST /api/auth/sign-up.
 * @returns TanStack mutation result: call `mutate({ name, email, password })` to sign up.
 */
export const useSignUp = () => {
  return useMutation({
    mutationFn: signUp,
  })
}
