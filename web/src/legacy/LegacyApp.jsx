import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, Outlet } from 'react-router-dom'

import '../theme.css'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { key: 'timesheets', label: 'Timesheets', to: '/' },
  { key: 'manage-data', label: 'Manage Data', to: '/manage' },
  { key: 'submitted', label: 'Submitted Timesheets', to: '/submitted' },
  { key: 'permissions', label: 'Permissions', to: '/permissions' },
]

function LoadingScreen() {
  return <div className="empty-state">Loading...</div>
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return children
}

function PanelRoute({ panel, children }) {
  const { loading, user, hasPanel } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!hasPanel(panel)) return <Navigate to="/" replace />
  return children
}

function AppLayout() {
  const { user, logout, hasPanel } = useAuth()
  const location = useLocation()

  const navItems = useMemo(() => {
    if (!user) return []
    return NAV_ITEMS.filter((item) => hasPanel(item.key))
  }, [user, hasPanel])

  return (
    <div className="app-shell">
      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Timesheet Manager</div>
            <div className="sidebar-user">{user?.name}</div>
            <button className="button button--outlined" onClick={logout}>
              Logout
            </button>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  ['sidebar-link', isActive ? 'sidebar-link--active' : '']
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="app-content">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        {error && <div className="banner banner--error">{error}</div>}
        <label className="input-field">
          <span>Email</span>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="input-field">
          <span>Password</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="button button--primary" type="submit">
          Sign In
        </button>
        <p className="helper-text">Don't have an account? <NavLink to="/register">Register</NavLink></p>
      </form>
    </div>
  )
}

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <div className="banner banner--error">{error}</div>}
        <label className="input-field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="input-field">
          <span>Email</span>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="input-field">
          <span>Password</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="button button--primary" type="submit">
          Register
        </button>
        <p className="helper-text">Already have an account? <NavLink to="/login">Sign in</NavLink></p>
      </form>
    </div>
  )
}

function useReferenceData(onError) {
  const [projects, setProjects] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [proj, acts] = await Promise.all([
          apiFetch('/projects'),
          apiFetch('/activities'),
        ])
        if (!cancelled) {
          setProjects(proj || [])
          setActivities(acts || [])
        }
      } catch (err) {
        if (!cancelled) onError?.(err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [onError])

  return { projects, activities }
}

function TimesheetPage() {
  const [error, setError] = useState('')
  const { projects, activities } = useReferenceData((err) => setError(err?.message || 'Failed to load data'))

  const [weekState, setWeekState] = useState({})
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const weeks = useMemo(() => getWeekStarts(currentYear), [currentYear])
  const currentWeekStart = useMemo(() => getCurrentWeekStartIso(), [])
  const [openWeek, setOpenWeek] = useState(() => weeks.find((w) => w === currentWeekStart) || weeks[0] || '')

  const mutateWeekState = useCallback((weekStart, producer) => {
    setWeekState((prev) => {
      const current = prev[weekStart] || {}
      const updates = producer(current) || {}
      return { ...prev, [weekStart]: { ...current, ...updates } }
    })
  }, [])

  const reloadEntries = useCallback(async (weekStart, tid) => {
    try {
      const list = await apiFetch(`/time-entries?tid=${tid}`)
      mutateWeekState(weekStart, () => ({
        entries: Array.isArray(list) ? list : [],
        loading: false,
      }))
    } catch (err) {
      mutateWeekState(weekStart, () => ({
        loading: false,
        error: err?.message || 'Unable to load time entries.',
      }))
    }
  }, [mutateWeekState])

  const ensureWeekData = useCallback(async (weekStart) => {
    if (!weekStart) return
    mutateWeekState(weekStart, (current) => ({
      loading: true,
      error: '',
      message: current.message || '',
      forms: current.forms || {},
    }))
    try {
      const ts = await apiFetch('/timesheets', {
        method: 'POST',
        body: { week_start: weekStart },
      })
      if (!ts?.id) throw new Error('Unable to open timesheet for that week.')
      mutateWeekState(weekStart, () => ({ timesheet: ts, initialized: true }))
      await reloadEntries(weekStart, ts.id)
    } catch (err) {
      mutateWeekState(weekStart, () => ({
        loading: false,
        error: err?.message || 'Unable to load timesheet for that week.',
      }))
    }
  }, [mutateWeekState, reloadEntries])

  useEffect(() => {
    if (!openWeek) return
    const state = weekState[openWeek]
    if (!state || !state.initialized) {
      ensureWeekData(openWeek)
    }
  }, [openWeek, weekState, ensureWeekData])

  const initialFormFor = useCallback((date) => ({
    project_id: '',
    activity_id: '',
    date,
    hours: '',
    notes: '',
    billable: true,
  }), [])

  const handleFormChange = useCallback((weekStart, date, field, value) => {
    mutateWeekState(weekStart, (current) => {
      const currentForms = current.forms || {}
      const base = currentForms[date] || initialFormFor(date)
      return {
        forms: {
          ...currentForms,
          [date]: {
            ...base,
            [field]: value,
          },
        },
      }
    })
  }, [mutateWeekState, initialFormFor])

  const handleAddEntry = useCallback(async (weekStart, date) => {
    const state = weekState[weekStart]
    if (!state?.timesheet?.id) {
      await ensureWeekData(weekStart)
      return
    }
    const forms = state.forms || {}
    const form = forms[date] || initialFormFor(date)
    if (!form.project_id || !form.activity_id || !form.hours) {
      mutateWeekState(weekStart, () => ({ error: 'Project, activity, and hours are required.' }))
      return
    }
    const payload = {
      timesheet_id: state.timesheet.id,
      project_id: Number(form.project_id),
      activity_id: Number(form.activity_id),
      date: form.date,
      hours: parseFloat(form.hours),
      notes: form.notes,
      billable: !!form.billable,
    }
    if (Number.isNaN(payload.hours) || payload.hours <= 0) {
      mutateWeekState(weekStart, () => ({ error: 'Hours must be a positive number.' }))
      return
    }
    try {
      mutateWeekState(weekStart, () => ({ error: '', message: '' }))
      await apiFetch('/time-entries', { method: 'POST', body: payload })
      mutateWeekState(weekStart, (current) => {
        const currentForms = current.forms || {}
        return {
          message: 'Entry added.',
          forms: {
            ...currentForms,
            [date]: initialFormFor(date),
          },
        }
      })
      await reloadEntries(weekStart, state.timesheet.id)
    } catch (err) {
      mutateWeekState(weekStart, () => ({ error: err?.message || 'Unable to add entry.' }))
    }
  }, [weekState, ensureWeekData, initialFormFor, mutateWeekState, reloadEntries])

  const handleSubmitTimesheet = useCallback(async (weekStart) => {
    const state = weekState[weekStart]
    if (!state?.timesheet?.id) return
    try {
      mutateWeekState(weekStart, (current) => ({ submitting: true, error: '', message: current.message }))
      const res = await apiFetch(`/timesheets/${state.timesheet.id}/submit`, { method: 'POST' })
      mutateWeekState(weekStart, (current) => ({
        submitting: false,
        timesheet: { ...current.timesheet, status: res?.status || 'submitted' },
        message: 'Timesheet submitted for approval.',
      }))
    } catch (err) {
      mutateWeekState(weekStart, (current) => ({
        submitting: false,
        error: err?.message || 'Unable to submit timesheet.',
        message: current.message,
      }))
    }
  }, [weekState, mutateWeekState])

  const handleToggleWeek = (weekStart) => {
    setError('')
    setOpenWeek((current) => (current === weekStart ? '' : weekStart))
  }

  return (
    <div className="content-stack">
      {error && <div className="banner banner--error">{error}</div>}

      <section className="content-stack">
        <h2 className="section-title">Timesheets for {currentYear}</h2>
        <div className="accordion">
          {weeks.map((weekStart) => {
            const state = weekState[weekStart] || {}
            const isOpen = openWeek === weekStart
            const timesheet = state.timesheet
            const entries = state.entries || []
            const totalHours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0)
            const rawStatus = timesheet?.status || (entries.length ? 'draft' : 'draft')
            const statusVariant = rawStatus === 'approved'
              ? 'approved'
              : rawStatus === 'rejected'
              ? 'rejected'
              : rawStatus === 'submitted'
              ? 'submitted'
              : 'draft'
            const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
            const days = getDaysForWeek(weekStart)
            const canSubmit = timesheet && ['draft', 'rejected'].includes(timesheet.status) && entries.length > 0

            return (
              <div key={weekStart} className="accordion__item">
                <button
                  type="button"
                  className={`accordion__trigger ${isOpen ? 'accordion__trigger--open' : ''}`}
                  onClick={() => handleToggleWeek(weekStart)}
                >
                  <div className="accordion__summary">
                    <span className="accordion__summary-title">{formatWeekLabel(weekStart)}</span>
                    <span className="accordion__summary-sub">Status: {statusLabel}</span>
                  </div>
                  <span className="accordion__meta" style={{ paddingInlineStart: 8 }}>{totalHours ? `${totalHours.toFixed(2)} hrs` : '0 hrs'}</span>
                </button>

                {isOpen && (
                  <div className="accordion__content">
                    {state.loading && <p className="loading-text">Loading week...</p>}
                    {!state.loading && !state.error && !timesheet && (
                      <div className="empty-state">No timesheet exists for this week yet.</div>
                    )}
                    {state.error && <div className="banner banner--error">{state.error}</div>}
                    {state.message && <div className="banner banner--success">{state.message}</div>}

                    {timesheet && (
                      <div className="week-header">
                        <div className="week-header__title">
                          <strong>Timesheet #{timesheet.id}</strong>
                          <span className={`status-chip status-chip--${statusVariant}`}>{statusLabel}</span>
                        </div>
                        <div className="submit-actions">
                          <span className="helper-text">Week total: <strong>{totalHours.toFixed(2)} hrs</strong></span>
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => handleSubmitTimesheet(weekStart)}
                            disabled={!canSubmit || state.submitting || state.loading}
                          >
                            {state.submitting ? 'Submitting…' : 'Submit for Approval'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="week-grid">
                      {!state.loading && entries.length === 0 && (
                        <div className="empty-state">No time has been recorded for this week yet.</div>
                      )}
                      {days.map((day) => {
                        const entriesForDay = entries.filter((entry) => entry.date === day.iso)
                        const dayHours = entriesForDay.reduce((sum, entry) => sum + Number(entry.hours || 0), 0)
                        const form = (state.forms && state.forms[day.iso]) || initialFormFor(day.iso)

                        return (
                          <div key={day.iso} className="day-card">
                            <div className="day-card__header">
                              <div>
                                <div className="day-card__title">{day.label}</div>
                                <div className="day-card__subtitle">{day.iso}</div>
                              </div>
                              <span className="pill"><strong>{dayHours.toFixed(2)}</strong> hrs</span>
                            </div>

                            {entriesForDay.length > 0 ? (
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th align="left">Project</th>
                                    <th align="left">Activity</th>
                                    <th align="left">Hours</th>
                                    <th align="left">Billable</th>
                                    <th align="left">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entriesForDay.map((entry) => {
                                    const project = projects.find((p) => p.id === entry.project_id)
                                    const activity = activities.find((a) => a.id === entry.activity_id)
                                    return (
                                      <tr key={entry.id}>
                                        <td>{project?.name || '—'}</td>
                                        <td>{activity?.code || '—'}</td>
                                        <td>{entry.hours}</td>
                                        <td>{entry.billable ? 'Yes' : 'No'}</td>
                                        <td>{entry.notes || '—'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            ) : (
                              <div className="empty-state">No entries yet.</div>
                            )}

                            <div className="form-grid form-grid--compact">
                              <div className="input-field">
                                <label>Project</label>
                                <select
                                  className="select"
                                  value={form.project_id}
                                  onChange={(e) => handleFormChange(weekStart, day.iso, 'project_id', e.target.value ? Number(e.target.value) : '')}
                                >
                                  <option value="">Select project</option>
                                  {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="input-field">
                                <label>Activity</label>
                                <select
                                  className="select"
                                  value={form.activity_id}
                                  onChange={(e) => handleFormChange(weekStart, day.iso, 'activity_id', e.target.value ? Number(e.target.value) : '')}
                                >
                                  <option value="">Select activity</option>
                                  {activities.map((activity) => (
                                    <option key={activity.id} value={activity.id}>{activity.code}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="input-field">
                                <label>Hours</label>
                                <input
                                  className="input"
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  placeholder="0.00"
                                  value={form.hours}
                                  onChange={(e) => handleFormChange(weekStart, day.iso, 'hours', e.target.value)}
                                />
                              </div>

                              <div className="input-field">
                                <label>Notes</label>
                                <input
                                  className="input"
                                  placeholder="Add notes"
                                  value={form.notes}
                                  onChange={(e) => handleFormChange(weekStart, day.iso, 'notes', e.target.value)}
                                />
                              </div>

                              <div className="input-field">
                                <label>Options</label>
                                <div className="checkbox">
                                  <input
                                    type="checkbox"
                                    checked={!!form.billable}
                                    onChange={(e) => handleFormChange(weekStart, day.iso, 'billable', e.target.checked)}
                                  />
                                  <span>Billable</span>
                                </div>
                              </div>
                            </div>
                            <div className="form-grid__actions">
                              <button
                                type="button"
                                className="button button--primary"
                                onClick={() => handleAddEntry(weekStart, day.iso)}
                                disabled={state.loading}
                              >
                                Add Entry
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ManageCatalogPage() {
  const [banner, setBanner] = useState({ kind: '', text: '' })
  const [projects, setProjects] = useState([])
  const [activities, setActivities] = useState([])
  const [approvers, setApprovers] = useState([])
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [savingProject, setSavingProject] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [savingApprover, setSavingApprover] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [savingTeamMember, setSavingTeamMember] = useState(false)

  const [projectForm, setProjectForm] = useState({ name: '', client: '', is_billable: true, team_id: '' })
  const [activityForm, setActivityForm] = useState({ code: '', description: '', project_id: '' })
  const [approverForm, setApproverForm] = useState({ name: '', email: '' })
  const [teamForm, setTeamForm] = useState({ name: '', leader_id: '', member_ids: [] })
  const [teamMemberForm, setTeamMemberForm] = useState({ team_id: '', user_id: '' })

  const showBanner = useCallback((kind, text) => setBanner({ kind, text }), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      showBanner('', '')
      const [proj, acts, apprs, usr, tms] = await Promise.all([
        apiFetch('/projects'),
        apiFetch('/activities'),
        apiFetch('/approvers'),
        apiFetch('/management/users'),
        apiFetch('/management/teams'),
      ])
      setProjects(Array.isArray(proj) ? proj : [])
      setActivities(Array.isArray(acts) ? acts : [])
      setApprovers(Array.isArray(apprs) ? apprs : [])
      setUsers(Array.isArray(usr) ? usr : [])
      setTeams(Array.isArray(tms) ? tms : [])
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Unable to load data')
    } finally {
      setLoading(false)
    }
  }, [showBanner])

  useEffect(() => {
    load()
  }, [load])

  const handleProjectSubmit = async (evt) => {
    evt.preventDefault()
    if (!projectForm.name.trim()) {
      showBanner('error', 'Project name is required.')
      return
    }
    try {
      setSavingProject(true)
      showBanner('', '')
      await apiFetch('/projects', {
        method: 'POST',
        body: {
          name: projectForm.name,
          client: projectForm.client,
          is_billable: projectForm.is_billable,
          team_id: projectForm.team_id ? Number(projectForm.team_id) : null,
        },
      })
      setProjectForm({ name: '', client: '', is_billable: true, team_id: '' })
      showBanner('success', 'Project added.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to add project.')
    } finally {
      setSavingProject(false)
    }
  }

  const handleActivitySubmit = async (evt) => {
    evt.preventDefault()
    if (!activityForm.code.trim() || !activityForm.project_id) {
      showBanner('error', 'Activity code and project are required.')
      return
    }
    try {
      setSavingActivity(true)
      showBanner('', '')
      await apiFetch('/activities', {
        method: 'POST',
        body: {
          code: activityForm.code,
          description: activityForm.description,
          project_id: Number(activityForm.project_id),
        },
      })
      setActivityForm({ code: '', description: '', project_id: '' })
      showBanner('success', 'Activity added.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to add activity.')
    } finally {
      setSavingActivity(false)
    }
  }

  const handleApproverSubmit = async (evt) => {
    evt.preventDefault()
    if (!approverForm.name.trim() || !approverForm.email.trim()) {
      showBanner('error', 'Approver name and email are required.')
      return
    }
    try {
      setSavingApprover(true)
      showBanner('', '')
      await apiFetch('/approvers', { method: 'POST', body: approverForm })
      setApproverForm({ name: '', email: '' })
      showBanner('success', 'Approver added.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to add approver.')
    } finally {
      setSavingApprover(false)
    }
  }

  const handleTeamSubmit = async (evt) => {
    evt.preventDefault()
    if (!teamForm.name.trim() || !teamForm.leader_id) {
      showBanner('error', 'Team name and leader are required.')
      return
    }
    try {
      setSavingTeam(true)
      showBanner('', '')
      const payload = {
        name: teamForm.name,
        leader_id: Number(teamForm.leader_id),
        member_ids: teamForm.member_ids.map(Number).filter(Boolean),
      }
      await apiFetch('/management/teams', { method: 'POST', body: payload })
      setTeamForm({ name: '', leader_id: '', member_ids: [] })
      showBanner('success', 'Team created.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to create team.')
    } finally {
      setSavingTeam(false)
    }
  }

  const handleAddTeamMember = async (evt) => {
    evt.preventDefault()
    if (!teamMemberForm.team_id || !teamMemberForm.user_id) {
      showBanner('error', 'Select a team and user to add.')
      return
    }
    try {
      setSavingTeamMember(true)
      showBanner('', '')
      await apiFetch(`/management/teams/${teamMemberForm.team_id}/members`, {
        method: 'POST',
        body: { user_id: Number(teamMemberForm.user_id) },
      })
      setTeamMemberForm({ team_id: '', user_id: '' })
      showBanner('success', 'Member added to team.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to add team member.')
    } finally {
      setSavingTeamMember(false)
    }
  }

  const handleRemoveTeamMember = async (teamId, userId) => {
    try {
      setSavingTeamMember(true)
      showBanner('', '')
      await apiFetch(`/management/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
      showBanner('success', 'Member removed from team.')
      await load()
    } catch (err) {
      console.error(err)
      showBanner('error', err?.message || 'Failed to remove team member.')
    } finally {
      setSavingTeamMember(false)
    }
  }

  return (
    <div className="content-stack">
      {banner.text && (
        <div className={`banner ${banner.kind === 'error' ? 'banner--error' : banner.kind === 'success' ? 'banner--success' : ''}`}>
          {banner.text}
        </div>
      )}

      <section className="content-stack">
        <h2 className="section-title">Project Catalog</h2>
        <div className="grid grid--md">
          <form className="card" onSubmit={handleProjectSubmit}>
            <div className="card__header"><h3>Add Project</h3></div>
            <div className="card__body content-stack">
              <div className="form-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input className="input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                </div>
                <div className="input-field">
                  <label>Client</label>
                  <input className="input" value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} />
                </div>
                <div className="input-field">
                  <label>Billable</label>
                  <div className="checkbox">
                    <input type="checkbox" checked={projectForm.is_billable} onChange={(e) => setProjectForm({ ...projectForm, is_billable: e.target.checked })} />
                    <span>Billable</span>
                  </div>
                </div>
                <div className="input-field">
                  <label>Team</label>
                  <select className="select" value={projectForm.team_id} onChange={(e) => setProjectForm({ ...projectForm, team_id: e.target.value })}>
                    <option value="">Unassigned</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="button button--primary" disabled={savingProject}>
                {savingProject ? 'Saving…' : 'Add Project'}
              </button>
            </div>
          </form>

          <form className="card" onSubmit={handleActivitySubmit}>
            <div className="card__header"><h3>Add Activity</h3></div>
            <div className="card__body content-stack">
              <div className="form-grid">
                <div className="input-field">
                  <label>Code</label>
                  <input className="input" value={activityForm.code} onChange={(e) => setActivityForm({ ...activityForm, code: e.target.value })} />
                </div>
                <div className="input-field">
                  <label>Project</label>
                  <select className="select" value={activityForm.project_id} onChange={(e) => setActivityForm({ ...activityForm, project_id: e.target.value })}>
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-field form-grid__full">
                  <label>Description</label>
                  <textarea className="textarea" rows={3} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="button button--primary" disabled={savingActivity}>
                {savingActivity ? 'Saving…' : 'Add Activity'}
              </button>
            </div>
          </form>

          <form className="card" onSubmit={handleApproverSubmit}>
            <div className="card__header"><h3>Add Approver</h3></div>
            <div className="card__body content-stack">
              <div className="form-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input className="input" value={approverForm.name} onChange={(e) => setApproverForm({ ...approverForm, name: e.target.value })} />
                </div>
                <div className="input-field">
                  <label>Email</label>
                  <input className="input" value={approverForm.email} onChange={(e) => setApproverForm({ ...approverForm, email: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="button button--primary" disabled={savingApprover}>
                {savingApprover ? 'Saving…' : 'Add Approver'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="content-stack">
        <h2 className="section-title">Teams</h2>
        <div className="grid grid--md">
          <form className="card" onSubmit={handleTeamSubmit}>
            <div className="card__header"><h3>Create Team</h3></div>
            <div className="card__body content-stack">
              <div className="form-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input className="input" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
                </div>
                <div className="input-field">
                  <label>Leader</label>
                  <select className="select" value={teamForm.leader_id} onChange={(e) => setTeamForm({ ...teamForm, leader_id: e.target.value })}>
                    <option value="">Select leader</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-field form-grid__full">
                  <label>Initial Members</label>
                  <select
                    multiple
                    className="select"
                    value={teamForm.member_ids}
                    onChange={(e) => setTeamForm({ ...teamForm, member_ids: Array.from(e.target.selectedOptions, (option) => option.value) })}
                    size={Math.min(Math.max(users.length, 3), 8)}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <span className="helper-text">Hold Ctrl/Cmd to select multiple members.</span>
                </div>
              </div>
              <button type="submit" className="button button--primary" disabled={savingTeam}>
                {savingTeam ? 'Saving…' : 'Create Team'}
              </button>
            </div>
          </form>

          <div className="table-card">
            <h3>Teams</h3>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : teams.length === 0 ? (
              <div className="empty-state">No teams yet.</div>
            ) : (
              <div className="content-stack">
                {teams.map((team) => (
                  <div key={team.id} className="card card--outlined" style={{ padding: 16 }}>
                    <div className="data-summary">
                      <strong>{team.name}</strong>
                      {team.leader ? <span className="pill">Leader: {team.leader.name}</span> : <span className="muted">No leader</span>}
                    </div>
                    <div className="content-stack" style={{ marginTop: 12 }}>
                      <div className="helper-text">Members</div>
                      {team.members.length === 0 ? (
                        <div className="empty-state" style={{ padding: 12 }}>No members yet.</div>
                      ) : (
                        <ul className="team-member-list">
                          {team.members.map((member) => {
                            const isLeader = team.leader && member.id === team.leader.id
                            return (
                              <li key={member.id} className="team-member-item">
                                <span>{member.name}</span>
                                {isLeader ? (
                                  <span className="pill">Leader</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="button button--text"
                                    onClick={() => handleRemoveTeamMember(team.id, member.id)}
                                    disabled={savingTeamMember}
                                  >
                                    Remove
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form className="content-stack" style={{ marginTop: 16 }} onSubmit={handleAddTeamMember}>
              <div className="form-grid form-grid--compact">
                <div className="input-field">
                  <label>Team</label>
                  <select className="select" value={teamMemberForm.team_id} onChange={(e) => setTeamMemberForm({ ...teamMemberForm, team_id: e.target.value })}>
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-field">
                  <label>User</label>
                  <select className="select" value={teamMemberForm.user_id} onChange={(e) => setTeamMemberForm({ ...teamMemberForm, user_id: e.target.value })}>
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="button button--outlined" disabled={savingTeamMember}>
                {savingTeamMember ? 'Updating…' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="content-stack">
        <h2 className="section-title">Current Catalog</h2>
        <div className="grid grid--md">
          <div className="table-card">
            <h3>Projects</h3>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="empty-state">No projects yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Name</th>
                    <th align="left">Client</th>
                    <th align="left">Team</th>
                    <th align="left">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.client || '—'}</td>
                      <td>{project.team ? project.team.name : '—'}</td>
                      <td>{project.is_billable ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="table-card">
            <h3>Activities</h3>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : activities.length === 0 ? (
              <div className="empty-state">No activities yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Code</th>
                    <th align="left">Project</th>
                    <th align="left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.code}</td>
                      <td>{activity.project ? activity.project.name : '—'}</td>
                      <td>{activity.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="table-card">
            <h3>Approvers</h3>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : approvers.length === 0 ? (
              <div className="empty-state">No approvers yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Name</th>
                    <th align="left">Email</th>
                    <th align="left">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {approvers.map((approver) => (
                    <tr key={approver.id}>
                      <td>{approver.name}</td>
                      <td>{approver.email}</td>
                      <td>{(approver.roles || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function SubmittedTimesheetsPage() {
  const { user, hasPanel } = useAuth()
  const [approvers, setApprovers] = useState([])
  const [selectedApprover, setSelectedApprover] = useState('')
  const [timesheets, setTimesheets] = useState([])
  const [error, setError] = useState('')
  const [loadingApprovers, setLoadingApprovers] = useState(true)
  const [loadingTimesheets, setLoadingTimesheets] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoadingApprovers(true)
        const data = await apiFetch('/approvers')
        if (!cancelled) {
          setApprovers(Array.isArray(data) ? data : [])
          if (data && user && !hasPanel('permissions')) {
            setSelectedApprover(String(user.id))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load approvers.')
        }
      } finally {
        if (!cancelled) setLoadingApprovers(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, hasPanel])

  useEffect(() => {
    let cancelled = false
    const loadTimesheets = async () => {
      if (!selectedApprover) {
        setTimesheets([])
        return
      }
      try {
        setLoadingTimesheets(true)
        setError('')
        const data = await apiFetch(`/approvers/${selectedApprover}/timesheets`)
        if (!cancelled) {
          setTimesheets(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load submitted timesheets.')
          setTimesheets([])
        }
      } finally {
        if (!cancelled) setLoadingTimesheets(false)
      }
    }
    loadTimesheets()
    return () => {
      cancelled = true
    }
  }, [selectedApprover])

  return (
    <div className="content-stack">
      <section className="content-stack">
        <h2 className="section-title">Submitted Timesheets</h2>
        <div className="submitted-filter">
          <label className="input-field">
            <span>Approver</span>
            <select
              className="select"
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
              disabled={loadingApprovers}
            >
              <option value="">-- Choose approver --</option>
              {approvers.map((approver) => (
                <option key={approver.id} value={approver.id}>{approver.name} ({approver.email})</option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="banner banner--error">{error}</div>}
        {loadingApprovers && <p className="loading-text">Loading approvers...</p>}
        {selectedApprover && loadingTimesheets && <p className="loading-text">Loading submitted timesheets...</p>}
        {selectedApprover && !loadingTimesheets && timesheets.length === 0 && !error && (
          <div className="empty-state">No submitted timesheets for this approver yet.</div>
        )}

        {!selectedApprover && !loadingApprovers && (
          <p className="muted">Select an approver to view their submitted timesheets.</p>
        )}

        {timesheets.length > 0 && !loadingTimesheets && (
          <div className="table-card">
            <table className="submitted-table">
              <thead>
                <tr>
                  <th align="left">Week Start</th>
                  <th align="left">Employee</th>
                  <th align="left">Status</th>
                  <th align="left">Total Hours</th>
                  <th align="left">Decision</th>
                  <th align="left">Comment</th>
                  <th align="left">Decided At</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((ts) => (
                  <tr key={ts.id}>
                    <td>{ts.week_start}</td>
                    <td>{ts.employee?.name || 'Unknown'}</td>
                    <td>{ts.status}</td>
                    <td>{typeof ts.total_hours === 'number' ? ts.total_hours.toFixed(2) : ts.total_hours}</td>
                    <td>{ts.approval?.decision || 'Pending'}</td>
                    <td>{ts.approval?.comment || '—'}</td>
                    <td>{ts.approval?.decided_at ? new Date(ts.approval.decided_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function PermissionsPage() {
  const [users, setUsers] = useState([])
  const [panels, setPanels] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState({})

  const load = useCallback(async () => {
    try {
      setError('')
      const [usersResp, panelsResp] = await Promise.all([
        apiFetch('/management/users'),
        apiFetch('/management/panels'),
      ])
      setUsers(Array.isArray(usersResp) ? usersResp : [])
      setPanels(Array.isArray(panelsResp?.panels) ? panelsResp.panels : [])
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Unable to load users or panels.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const togglePanel = async (userId, panel, checked) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return
    const nextPanels = new Set(target.panels || [])
    if (checked) {
      nextPanels.add(panel)
    } else {
      nextPanels.delete(panel)
    }

    setSaving((prev) => ({ ...prev, [userId]: true }))
    try {
      const updated = await apiFetch(`/management/users/${userId}/panels`, {
        method: 'PUT',
        body: { panels: Array.from(nextPanels) },
      })
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Failed to update user panels.')
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="content-stack">
      <h2 className="section-title">User Permissions</h2>
      {error && <div className="banner banner--error">{error}</div>}
      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th align="left">User</th>
              <th align="left">Email</th>
              <th align="left">Roles</th>
              {panels.map((panel) => (
                <th key={panel} align="left">{panel}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userPanels = new Set(user.panels || [])
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{(user.roles || []).join(', ') || '—'}</td>
                  {panels.map((panel) => (
                    <td key={panel}>
                      <input
                        type="checkbox"
                        checked={userPanels.has(panel)}
                        onChange={(e) => togglePanel(user.id, panel, e.target.checked)}
                        disabled={saving[user.id]}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function LegacyApp() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<PanelRoute panel="timesheets"><TimesheetPage /></PanelRoute>} />
        <Route path="manage" element={<PanelRoute panel="manage-data"><ManageCatalogPage /></PanelRoute>} />
        <Route path="submitted" element={<PanelRoute panel="submitted"><SubmittedTimesheetsPage /></PanelRoute>} />
        <Route path="permissions" element={<PanelRoute panel="permissions"><PermissionsPage /></PanelRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


export { ProtectedRoute, PublicOnlyRoute, PanelRoute }

// Helper utilities for timesheet view
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekStarts(year) {
  const starts = []
  const firstDay = new Date(year, 0, 1)
  const firstWeekStart = startOfWeek(firstDay)
  if (firstWeekStart.getFullYear() < year) {
    firstWeekStart.setDate(firstWeekStart.getDate() + 7)
  }
  const cursor = new Date(firstWeekStart)
  while (cursor.getFullYear() === year) {
    starts.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 7)
  }
  return starts
}

function getDaysForWeek(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`)
  const days = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: `${WEEKDAY_LABELS[i]} ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    })
  }
  return days
}

function getCurrentWeekStartIso() {
  return startOfWeek(new Date()).toISOString().slice(0, 10)
}

function formatWeekLabel(weekStart) {
  const d = new Date(`${weekStart}T00:00:00`)
  return `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

