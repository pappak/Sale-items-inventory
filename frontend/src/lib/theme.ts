import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'system', setTheme: () => {} })

export const useTheme = () => useContext(ThemeContext)
