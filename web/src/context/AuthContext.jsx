import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../api/client'

const AuthContext = createContext(null)
const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [impersonator, setImpersonator] = useState(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [loading, setLoading] = useState(true)
  const idleTimerRef = useRef(null)

  const applySession = useCallback((sessionData) => {
    if (sessionData && typeof sessionData === 'object') {
      setUser(sessionData.user ?? null)
      setImpersonator(sessionData.impersonator ?? null)
      setIsImpersonating(Boolean(sessionData.is_impersonating))
    } else {
      setUser(null)
      setImpersonator(null)
      setIsImpersonating(false)
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiFetch('/auth/me', { method: 'GET' })
      applySession(data)
    } catch (err) {
      if (err.status === 401) {
        setUser(null)
        setImpersonator(null)
        setIsImpersonating(false)
      } else {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    applySession(data)
    return data.user ?? null
  }, [applySession])

  const register = useCallback(async (name, email, password) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    applySession(data)
    return data.user ?? null
  }, [applySession])

  const impersonate = useCallback(async (userId) => {
    const data = await apiFetch('/auth/impersonate', {
      method: 'POST',
      body: { user_id: userId },
    })
    applySession(data)
    return data.user ?? null
  }, [applySession])

  const stopImpersonation = useCallback(async () => {
    const data = await apiFetch('/auth/impersonate/stop', {
      method: 'POST',
    })
    applySession(data)
    return data.user ?? null
  }, [applySession])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error(err)
    } finally {
      setUser(null)
      setImpersonator(null)
      setIsImpersonating(false)
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
      impersonator,
      isImpersonating,
      loading,
      login,
      register,
      logout,
      impersonate,
      stopImpersonation,
      refreshUser: fetchCurrentUser,
      hasPanel,
    }),
    [
      user,
      impersonator,
      isImpersonating,
      loading,
      login,
      register,
      logout,
      impersonate,
      stopImpersonation,
      fetchCurrentUser,
      hasPanel,
    ]
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
