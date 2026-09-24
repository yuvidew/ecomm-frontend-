import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSession } from '@/features/auth/hooks/use-session'

/**
 * RedirectIfRole — renders children for everyone except a signed-in user
 * whose role matches `role`, who is redirected to `to` instead. The inverse
 * of `RequireAuth`: doesn't require a session, so anonymous visitors and
 * other roles pass straight through.
 * @param children - route content to render for everyone else
 * @param role - the one role that gets redirected away
 * @param to - where to send a matching user
 */
export const RedirectIfRole = ({ children, role, to }: { children: ReactNode; role: string; to: string }) => {
  const { session } = useSession()

  if (session?.user.role === role) {
    return <Navigate to={to} replace />
  }

  return children
}
