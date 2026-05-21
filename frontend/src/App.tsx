import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useEffect, useState, type ReactElement } from 'react'
import { AppLayout } from './components/layout'
import { Alert } from './components/ui'
import { api, tokenStore } from './lib/api'
import { getErrorMessage } from './lib/errors'
import {
AttendancePage,
DashboardPage,
EventsPage,
LoginPage,
MyRegistrationsPage,
OrganizationsPage,
ProfilePage,
RegisterPage,
RegistrationReviewPage,
ReportsPage,
UsersPage,
} from './pages'
import type { AttendanceLog, EventRecord, FmsUser, Me, Organization, ProfilePayload, Registration, RoleName, View } from './types'

function hasAnyRole(roles: RoleName[], expectedRoles: RoleName[]) {
  return roles.some((role) => expectedRoles.includes(role))
}

function getInitialToken() {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const ssoToken = fragment.get('sso_token')

  if (ssoToken) {
    tokenStore.set(ssoToken)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    return ssoToken
  }

  return tokenStore.get()
}

function App() {
  const [token, setToken] = useState(getInitialToken)
  const [me, setMe] = useState<Me | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [attendance, setAttendance] = useState<AttendanceLog[]>([])
  const [users, setUsers] = useState<FmsUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [view, setView] = useState<View>('dashboard')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('INFORMATION')

  const roles = me?.roles ?? []
  const isMainAdmin = roles.includes('MAIN_ADMIN')
  const canManageUsers = hasAnyRole(roles, ['MAIN_ADMIN', 'USER_ADMIN'])
  const canManageAffiliations = hasAnyRole(roles, ['MAIN_ADMIN', 'USER_ADMIN', 'ORGANIZATION_ADMIN'])
  const canManageEvents = hasAnyRole(roles, ['MAIN_ADMIN', 'EVENT_ADMIN'])
  const isInternalFapor7User = me?.organizationCode?.toUpperCase() === 'FAPOR7'
  const canRegisterForEvents = hasAnyRole(roles, ['MAIN_ADMIN', 'END_USER']) && !isInternalFapor7User
  const canViewDashboard = hasAnyRole(roles, ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN', 'END_USER'])
  const canViewEvents = hasAnyRole(roles, ['MAIN_ADMIN', 'EVENT_ADMIN', 'END_USER'])
  const canViewMyRegistrations = canRegisterForEvents
  const canViewReports = hasAnyRole(roles, ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN'])
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
    const profileRoles = profile?.roles ?? []
    const profileCanManageEvents = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'EVENT_ADMIN'])
    const profileCanViewEvents = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'EVENT_ADMIN', 'END_USER'])
    const profileCanViewOwnRegistrations = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'END_USER'])
      && profile?.organizationCode?.toUpperCase() !== 'FAPOR7'
    const profileCanViewDashboard = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN', 'END_USER'])
    const profileCanViewReports = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN'])
    const profileCanManageAffiliations = hasAnyRole(profileRoles, ['MAIN_ADMIN', 'USER_ADMIN', 'ORGANIZATION_ADMIN'])

    if (profileCanViewEvents || profileCanViewDashboard || profileCanViewReports) {
      setEvents(await api.events.list())
    } else {
      setEvents([])
    }

    if (profileCanViewOwnRegistrations) {
      setMyRegistrations(await api.registrations.mine())
    } else {
      setMyRegistrations([])
    }

    if (profileCanManageEvents || profileCanViewReports) {
      const [allRegistrations, logs] = await Promise.all([api.registrations.list(), api.attendance.list()])
      setRegistrations(allRegistrations)
      setAttendance(logs)
    } else {
      setRegistrations([])
      setAttendance([])
    }

    if (profileCanManageAffiliations) {
      const [userData, orgData] = await Promise.all([api.users.list(), api.organizations.list()])
      setUsers(userData)
      setOrganizations(orgData)
    } else {
      setUsers([])
      setOrganizations([])
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
    setAuthView('login')
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

  async function updateProfile(payload: ProfilePayload) {
    setLoading(true)
    try {
      await api.updateMe(payload)
      const profile = await api.me()
      setMe(profile)
      setNotice('Profile updated.')
      setNoticeTone('CONFIRMED')
    } catch (error) {
      setNotice(getErrorMessage(error))
      setNoticeTone('ERROR')
      throw error
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
    if (authView === 'register') {
      return (
        <MotionConfig reducedMotion="user">
          <RegisterPage
            onBackToLogin={() => {
              setAuthView('login')
              setNotice('')
            }}
            onRegistered={() => {
              setAuthView('login')
              setNotice('Account created. Sign in with your email and password.')
              setNoticeTone('CONFIRMED')
            }}
          />
        </MotionConfig>
      )
    }

    return (
      <MotionConfig reducedMotion="user">
        <LoginPage
          loading={loading}
          notice={notice}
          noticeTone={noticeTone}
          onCreateAccount={() => {
            setAuthView('register')
            setNotice('')
          }}
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
    ...(canViewDashboard ? [{ id: 'dashboard' as View, label: 'Dashboard' }] : []),
    { id: 'profile', label: 'Profile' },
    ...(canViewEvents ? [{ id: 'events' as View, label: 'Events' }] : []),
    ...(canViewMyRegistrations ? [{ id: 'my-registrations' as View, label: 'My registrations' }] : []),
    ...(canReviewRegistrations ? [{ id: 'registrations' as View, label: 'Payment review' }] : []),
    ...(canReviewRegistrations ? [{ id: 'attendance' as View, label: 'Attendance' }] : []),
    ...(canManageAffiliations ? [{ id: 'users' as View, label: 'Users' }] : []),
    ...(canViewOrganizations ? [{ id: 'organizations' as View, label: 'Organizations' }] : []),
    ...(canViewReports ? [{ id: 'reports' as View, label: 'Reports' }] : []),
  ]
  const activeView = navItems.some((item) => item.id === view) ? view : navItems[0].id

  const currentPage = {
    dashboard: (
      <DashboardPage
        events={events}
        registrations={canReviewRegistrations ? registrations : myRegistrations}
        attendance={attendance}
        users={users}
        canReviewRegistrations={canReviewRegistrations}
        canRegister={canRegisterForEvents}
        isEndUserDashboard={roles.includes('END_USER') && !canReviewRegistrations}
        onRegister={(eventId) => api.registrations.create(eventId).then(() => refresh('Registration created.'))}
      />
    ),
    profile: <ProfilePage me={me} onUpdate={updateProfile} />,
    events: (
      <EventsPage
        events={events}
        organizations={organizations}
        canManageEvents={canManageEvents}
        canRegister={canRegisterForEvents}
        onCreate={(payload) => api.events.create(payload).then(() => refresh('Event created.'))}
        onUpdate={(id, payload) => api.events.update(id, payload).then(() => refresh('Event updated.'))}
        onArchive={(id) => api.events.archive(id).then(() => refresh('Event archived.'))}
        onDelete={(id) => api.events.deleteDraft(id).then(() => refresh('Draft event deleted.'))}
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
        affiliationOrganizations={canManageUsers
          ? organizations
          : organizations.filter((organization) => organization.id === me.organizationId)}
        canCreate={canManageUsers}
        onCreate={(payload) => api.users.create(payload).then(() => refresh('User account created.'))}
        onImport={(file) => api.users.importCsv(file).then(() => refresh('Users imported.'))}
        onUpdateOrganization={(userId, organizationId) =>
          api.users.updateOrganization(userId, organizationId).then(() => refresh('Organization affiliation updated.'))
        }
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
        roles={roles}
      />
    ),
  } satisfies Record<View, ReactElement>

  return (
    <MotionConfig reducedMotion="user">
      <AppLayout
        me={me}
        view={activeView}
        navItems={navItems}
        loading={loading}
        onNavigate={setView}
        onRefresh={() => void refresh('Data refreshed.')}
        onLogout={handleLogout}
      >
        <AnimatePresence initial={false}>
          {notice && <Alert key={notice} message={notice} tone={noticeTone} onDismiss={() => setNotice('')} />}
        </AnimatePresence>
        {currentPage[activeView]}
      </AppLayout>
    </MotionConfig>
  )
}

export default App
