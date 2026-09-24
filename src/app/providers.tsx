import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SessionBootstrap } from './session-bootstrap'

/**
 * AppProviders — wraps the app with all global context providers.
 * @param children - the rendered app tree (router output)
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>{children}</SessionBootstrap>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
