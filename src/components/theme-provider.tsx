import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/hooks/use-theme'

// reads the saved theme; localStorage can throw in private mode / blocked storage
const readStoredTheme = (storageKey: string): Theme | null => {
  try {
    return localStorage.getItem(storageKey) as Theme | null
  } catch {
    return null
  }
}

/**
 * ThemeProvider — holds the light/dark/system theme, persists it to
 * localStorage, and toggles the `light`/`dark` class on `<html>` that the
 * CSS variables in index.css key off.
 * @param children - app tree that can read the theme via `useTheme` (hooks/use-theme.ts)
 * @param defaultTheme - theme used when nothing is saved yet
 * @param storageKey - localStorage key the choice is saved under
 */
export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  storageKey = 'e-comm-ui-theme',
}: {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) => {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey) ?? defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    apply()
    // in "system" mode, follow OS theme changes live
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // storage unavailable -- theme still applies for this session
    }
    setThemeState(next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
