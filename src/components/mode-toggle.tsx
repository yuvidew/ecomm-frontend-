import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

/**
 * ModeToggle — icon button (sun in light, moon in dark) that flips between
 * light and dark theme on click.
 */
export const ModeToggle = () => {
  const { setTheme } = useTheme()

  // read the applied class so "system" mode flips from what's actually on screen
  const handleToggle = () => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Button variant="outline" size="icon-sm" className="relative" onClick={handleToggle}>
      <SunIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
