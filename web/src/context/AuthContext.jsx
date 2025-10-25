import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiFetch('/auth/me', { method: 'GET' })
      setUser(data)
    } catch (err) {
      if (err.status === 401) {
        setUser(null)
      } else {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error(err)
    } finally {
      setUser(null)
    }
  }, [])

  const hasPanel = useCallback(
    (panel, { includeAdmin = true } = {}) => {
      if (!user) return false
      if (includeAdmin && user.role === 'admin') return true
      return Array.isArray(user.panels) && user.panels.includes(panel)
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser,
      hasPanel,
    }),
    [user, loading, login, register, logout, fetchCurrentUser, hasPanel]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
