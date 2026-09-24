import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// provided by ThemeProvider (components/theme-provider.tsx)
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/**
 * useTheme — current theme and setter from the nearest ThemeProvider.
 * @returns `{ theme, setTheme }`
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
