import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'

/**
 * RequireAuth — renders children only when a session exists; otherwise
 * redirects to /sign-in, preserving the attempted location.
 * @param children - protected route content
 * @param role - optional role the user must have; signed-in users with another role are sent to "/"
 */
export const RequireAuth = ({ children, role }: { children: ReactNode; role?: string }) => {
  const { session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  if (role && session.user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
