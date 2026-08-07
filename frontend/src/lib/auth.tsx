import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  getAuthToken,
  clearAuthToken,
  login as apiLogin,
} from './api'

interface AuthContextValue {
  authed: boolean
  login: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => !!getAuthToken())

  const login = useCallback(async (password: string) => {
    await apiLogin(password)
    setAuthed(true)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setAuthed(false)
  }, [])

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  // During HMR or lazy-load timing, context may briefly be null — return safe default
  if (!ctx) return { authed: false, login: async () => {}, logout: () => {} } as AuthContextValue
  return ctx
}