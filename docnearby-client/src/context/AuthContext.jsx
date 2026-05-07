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

  useEffect(() => {
    if (token) localStorage.setItem('dn_token', token)
    else localStorage.removeItem('dn_token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('dn_user', JSON.stringify(user))
    else localStorage.removeItem('dn_user')
  }, [user])

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const res = await authApi.me()
      if (res?.success) setUser(res.data?.user || null)
      return res
    } finally {
      setLoading(false)
    }
  }, [token])

  const value = useMemo(
    () => ({ token, setToken, user, setUser, loading, logout, refreshMe }),
    [token, user, loading, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

