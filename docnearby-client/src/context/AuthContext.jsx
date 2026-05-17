import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dn_token') || '')
  const [user, setUser] = useState(() => safeJsonParse(localStorage.getItem('dn_user')) || null)
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem('dn_token')
    localStorage.removeItem('dn_user')
  }, [])

  const refreshMe = useCallback(async () => {
    if (!token) {
      setIsInitialized(true)
      return null
    }
    setLoading(true)
    try {
      const res = await authApi.me()
      if (res?.success) {
        setUser(res.data?.user || null)
      } else {
        logout()
      }
      return res
    } catch (e) {
      if (e.response?.status === 401) logout()
      return null
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }, [token, logout])

  // Persistence
  useEffect(() => {
    if (token) localStorage.setItem('dn_token', token)
    if (user) localStorage.setItem('dn_user', JSON.stringify(user))
  }, [token, user])

  // Initialization
  useEffect(() => {
    if (!isInitialized) {
      refreshMe()
    }
  }, [refreshMe, isInitialized])

  const isAuthenticated = !!token && !!user

  const value = useMemo(
    () => ({ 
      token, 
      setToken, 
      user, 
      setUser, 
      loading, 
      isInitialized, 
      isAuthenticated,
      logout, 
      refreshMe 
    }),
    [token, user, loading, isInitialized, isAuthenticated, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

