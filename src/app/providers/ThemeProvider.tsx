import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { APP_CONFIG } from '@/config/app'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(APP_CONFIG.themeKey)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* ignore */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(APP_CONFIG.themeKey, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const chooseTheme = useCallback((next: ThemeMode) => {
    setTheme(next)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme: chooseTheme,
    }),
    [theme, toggleTheme, chooseTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
