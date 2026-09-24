import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'

/**
 * SessionBootstrap — blocks rendering of the app tree until the one-time
 * refresh-on-load session check resolves, avoiding a flash of logged-out UI.
 * @param children - app tree to render once session state is known
 */
export const SessionBootstrap = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useSession()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return children
}
