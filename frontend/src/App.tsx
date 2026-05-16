import { useEffect, useState, type ReactElement } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { AppLayout } from './components/layout/AppLayout'
import { Alert } from './components/ui/Alert'
import { api, tokenStore } from './lib/api'
import { getErrorMessage } from './lib/errors'
import type { AttendanceLog, EventRecord, FmsUser, Me, Organization, Registration, View } from './types'
import {
  AttendancePage,
  DashboardPage,
  EventsPage,
  LoginPage,
  MyRegistrationsPage,
  OrganizationsPage,
  RegistrationReviewPage,
  ReportsPage,
  UsersPage,
} from './pages'

function App() {
  const [token, setToken] = useState(tokenStore.get())
  const [me, setMe] = useState<Me | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [attendance, setAttendance] = useState<AttendanceLog[]>([])
  const [users, setUsers] = useState<FmsUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('INFORMATION')

  const isMainAdmin = me?.roles.includes('MAIN_ADMIN') ?? false
  const canManageUsers = Boolean(me?.roles.some((role) => role === 'MAIN_ADMIN' || role === 'USER_ADMIN'))
  const canManageEvents = Boolean(me?.roles.some((role) => role === 'MAIN_ADMIN' || role === 'EVENT_ADMIN'))
  const canReviewRegistrations = canManageEvents
  const canViewOrganizations = canManageUsers
  const canCreateOrganizations = isMainAdmin

  async function loadSession() {
    if (!tokenStore.get()) return
    setLoading(true)
    try {
      const profile = await api.me()
      setMe(profile)
      await loadCore(profile)
    } catch (error) {
      tokenStore.clear()
      setToken(null)
      setMe(null)
      setNotice(getErrorMessage(error))
      setNoticeTone('ERROR')
    } finally {
      setLoading(false)
    }
  }

  async function loadCore(profile = me) {
    const [eventData, ownRegistrations] = await Promise.all([api.events.list(), api.registrations.mine()])
    setEvents(eventData)
    setMyRegistrations(ownRegistrations)

    if (profile?.roles.some((role) => role === 'MAIN_ADMIN' || role === 'EVENT_ADMIN')) {
      const [allRegistrations, logs] = await Promise.all([api.registrations.list(), api.attendance.list()])
      setRegistrations(allRegistrations)
      setAttendance(logs)
    }

    if (profile?.roles.some((role) => role === 'MAIN_ADMIN' || role === 'USER_ADMIN')) {
      const [userData, orgData] = await Promise.all([api.users.list(), api.organizations.list()])
      setUsers(userData)
      setOrganizations(orgData)
    }
  }

  useEffect(() => {
    // The initial session hydration intentionally runs once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogout() {
    tokenStore.clear()
    setToken(null)
    setMe(null)
    setView('dashboard')
  }

  async function refresh(message?: string) {
    setLoading(true)
    try {
      await loadCore()
      if (message) {
        setNotice(message)
        setNoticeTone('CONFIRMED')
      }
    } catch (error) {
      setNotice(getErrorMessage(error))
      setNoticeTone('ERROR')
    } finally {
      setLoading(false)
    }
  }

  async function viewPaymentProof(registrationId: string) {
    const blob = await api.registrations.downloadPaymentProof(registrationId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  if (!token || !me) {
    return (
      <MotionConfig reducedMotion="user">
        <LoginPage
          loading={loading}
          notice={notice}
          onLoggedIn={(nextToken) => {
            tokenStore.set(nextToken)
            setToken(nextToken)
            setNotice('')
            void loadSession()
          }}
        />
      </MotionConfig>
    )
  }

  const navItems: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'events', label: 'Events' },
    { id: 'my-registrations', label: 'My registrations' },
    ...(canReviewRegistrations ? [{ id: 'registrations' as View, label: 'Payment review' }] : []),
    ...(canReviewRegistrations ? [{ id: 'attendance' as View, label: 'Attendance' }] : []),
    ...(canManageUsers ? [{ id: 'users' as View, label: 'Users' }] : []),
    ...(canViewOrganizations ? [{ id: 'organizations' as View, label: 'Organizations' }] : []),
    { id: 'reports', label: 'Reports' },
  ]

  const currentPage = {
    dashboard: (
      <DashboardPage
        events={events}
        registrations={canReviewRegistrations ? registrations : myRegistrations}
        attendance={attendance}
        users={users}
        canReviewRegistrations={canReviewRegistrations}
      />
    ),
    events: (
      <EventsPage
        events={events}
        organizations={organizations}
        canManageEvents={canManageEvents}
        onCreate={(payload) => api.events.create(payload).then(() => refresh('Event created.'))}
        onUpdate={(id, payload) => api.events.update(id, payload).then(() => refresh('Event updated.'))}
        onArchive={(id) => api.events.archive(id).then(() => refresh('Event archived.'))}
        onRegister={(eventId) => api.registrations.create(eventId).then(() => refresh('Registration created.'))}
      />
    ),
    'my-registrations': (
      <MyRegistrationsPage
        registrations={myRegistrations}
        onUpload={(registrationId, paymentReference, file) =>
          api.registrations.uploadPayment(registrationId, paymentReference, file).then(() => refresh('Payment proof uploaded.'))
        }
      />
    ),
    registrations: (
      <RegistrationReviewPage
        registrations={registrations}
        onViewPaymentProof={viewPaymentProof}
        onApprove={(registrationId, remarks) =>
          api.registrations.approve(registrationId, remarks).then(() => refresh('Registration confirmed and QR token generated.'))
        }
      />
    ),
    attendance: (
      <AttendancePage
        logs={attendance}
        onCheckIn={(qrToken) => api.attendance.checkIn(qrToken).then(() => refresh('Attendance recorded.'))}
      />
    ),
    users: (
      <UsersPage
        users={users}
        organizations={organizations}
        onCreate={(payload) => api.users.create(payload).then(() => refresh('User account created.'))}
      />
    ),
    organizations: (
      <OrganizationsPage
        organizations={organizations}
        canCreate={canCreateOrganizations}
        onCreate={(payload) => api.organizations.create(payload).then(() => refresh('Organization created.'))}
      />
    ),
    reports: (
      <ReportsPage
        events={events}
        registrations={canReviewRegistrations ? registrations : myRegistrations}
        attendance={attendance}
        users={users}
      />
    ),
  } satisfies Record<View, ReactElement>

  return (
    <MotionConfig reducedMotion="user">
      <AppLayout
        me={me}
        view={view}
        navItems={navItems}
        loading={loading}
        onNavigate={setView}
        onRefresh={() => void refresh('Data refreshed.')}
        onLogout={handleLogout}
      >
        <AnimatePresence initial={false}>
          {notice && <Alert key={notice} message={notice} tone={noticeTone} onDismiss={() => setNotice('')} />}
        </AnimatePresence>
        {currentPage[view]}
      </AppLayout>
    </MotionConfig>
  )
}

export default App
