import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../api/client'

const AuthContext = createContext(null)
const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const idleTimerRef = useRef(null)

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

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      return
    }

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      idleTimerRef.current = window.setTimeout(() => {
        logout()
      }, IDLE_TIMEOUT_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimer()
      }
    }

    activityEvents.forEach((eventName) => document.addEventListener(eventName, resetIdleTimer))
    document.addEventListener('visibilitychange', handleVisibilityChange)
    resetIdleTimer()

    return () => {
      activityEvents.forEach((eventName) => document.removeEventListener(eventName, resetIdleTimer))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }
  }, [user, logout])

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
