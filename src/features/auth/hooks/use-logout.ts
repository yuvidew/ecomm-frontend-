import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { authKeys } from '@/lib/query-keys'
import { logout } from '../api/auth'

/**
 * useLogout — mutation hook for POST /api/auth/logout. Clears the local
 * session and redirects to sign-in even if the network call itself fails,
 * since ending the local session shouldn't depend on the backend succeeding.
 * @returns TanStack mutation result: call `mutate()` to log out.
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(authKeys.session, null)
      navigate('/sign-in')
    },
  })
}
