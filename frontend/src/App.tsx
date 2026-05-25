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

const internalRoles: RoleName[] = ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN', 'ORGANIZATION_ADMIN', 'EXHIBITOR']

function isEndUserOnly(roles: RoleName[]) {
  return roles.includes('END_USER') && !hasAnyRole(roles, internalRoles)
}

function getAssignedExhibitorEvents(events: EventRecord[], me: Me) {
  const activeEvents = events.filter((event) => event.status !== 'ARCHIVED')
  const organizationEvents = me.organizationId
    ? activeEvents.filter((event) => event.organizationId === me.organizationId)
    : []

  return organizationEvents.length ? organizationEvents : activeEvents
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
  const [selectedExhibitorEventId, setSelectedExhibitorEventId] = useState<string | null>(null)
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [view, setView] = useState<View>('dashboard')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('INFORMATION')

  const roles = me?.roles ?? []
  const isMainAdmin = roles.includes('MAIN_ADMIN')
  const isUserAdmin = roles.includes('USER_ADMIN')
  const isEventAdmin = roles.includes('EVENT_ADMIN')
  const isOrganizationAdmin = roles.includes('ORGANIZATION_ADMIN')
  const isExhibitor = roles.includes('EXHIBITOR')
  const endUserOnly = isEndUserOnly(roles)
  const canManageUsers = isMainAdmin || isUserAdmin
  const canViewUsers = canManageUsers || isOrganizationAdmin
  const canManageEvents = isMainAdmin || isEventAdmin
  const isInternalFapor7User = me?.organizationCode?.toUpperCase() === 'FAPOR7'
  const canRegisterForEvents = endUserOnly && !isInternalFapor7User
  const canViewProfile = endUserOnly
  const canViewDashboard = hasAnyRole(roles, ['MAIN_ADMIN', 'USER_ADMIN', 'EVENT_ADMIN', 'ORGANIZATION_ADMIN', 'EXHIBITOR', 'END_USER'])
  const canViewEvents = canManageEvents || endUserOnly
  const canViewMyRegistrations = canRegisterForEvents
  const canViewReports = isMainAdmin || isEventAdmin || isOrganizationAdmin
  const canReviewRegistrations = canManageEvents
  const canViewAttendance = canManageEvents || isExhibitor
  const canViewOrganizations = isMainAdmin || isOrganizationAdmin
  const canCreateOrganizations = isMainAdmin || isOrganizationAdmin
  const dashboardVariant = endUserOnly
    ? 'end-user'
    : isOrganizationAdmin && !isMainAdmin
      ? 'organization-admin'
      : isUserAdmin && !isMainAdmin
        ? 'user-admin'
        : 'operations'

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
    const profileIsMainAdmin = profileRoles.includes('MAIN_ADMIN')
    const profileIsEventAdmin = profileRoles.includes('EVENT_ADMIN')
    const profileIsUserAdmin = profileRoles.includes('USER_ADMIN')
    const profileIsOrganizationAdmin = profileRoles.includes('ORGANIZATION_ADMIN')
    const profileIsExhibitor = profileRoles.includes('EXHIBITOR')
    const profileEndUserOnly = isEndUserOnly(profileRoles)
    const profileCanManageEvents = profileIsMainAdmin || profileIsEventAdmin
    const profileCanViewEvents = profileCanManageEvents || profileEndUserOnly || profileIsExhibitor
    const profileCanViewOwnRegistrations = profileEndUserOnly
      && profile?.organizationCode?.toUpperCase() !== 'FAPOR7'
    const profileCanViewReports = profileIsMainAdmin || profileIsEventAdmin || profileIsOrganizationAdmin
    const profileCanManageAffiliations = profileIsMainAdmin || profileIsUserAdmin || profileIsOrganizationAdmin
    const profileNeedsOrganizations = profileCanManageAffiliations || profileCanManageEvents || profileIsOrganizationAdmin

    if (profileCanViewEvents || profileCanViewReports) {
      setEvents(await api.events.list())
    } else {
      setEvents([])
    }

    if (profileCanViewOwnRegistrations) {
      setMyRegistrations(await api.registrations.mine())
    } else {
      setMyRegistrations([])
    }

    if (profileCanManageEvents) {
      const [allRegistrations, logs] = await Promise.all([api.registrations.list(), api.attendance.list()])
      setRegistrations(allRegistrations)
      setAttendance(logs)
    } else if (profileIsExhibitor) {
      setRegistrations([])
      setAttendance(await api.attendance.list())
    } else {
      setRegistrations([])
      setAttendance([])
    }

    if (profileCanManageAffiliations || profileNeedsOrganizations) {
      const [userData, orgData] = await Promise.all([
        profileCanManageAffiliations ? api.users.list() : Promise.resolve([]),
        api.organizations.list(),
      ])
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

  async function uploadProfilePicture(file: File) {
    setLoading(true)
    try {
      await api.uploadProfilePicture(file)
      const profile = await api.me()
      setMe(profile)
      setNotice('Profile picture updated.')
      setNoticeTone('CONFIRMED')
    } catch (error) {
      setNotice(getErrorMessage(error))
      setNoticeTone('ERROR')
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function importOrganizations(rows: Array<{ name: string; code: string }>) {
    for (const row of rows) {
      await api.organizations.create(row)
    }

    await refresh(`${rows.length} organization${rows.length === 1 ? '' : 's'} imported.`)
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
    ...(canViewProfile ? [{ id: 'profile' as View, label: 'Profile' }] : []),
    ...(canViewEvents ? [{ id: 'events' as View, label: 'Events' }] : []),
    ...(canViewMyRegistrations ? [{ id: 'my-registrations' as View, label: 'My registrations' }] : []),
    ...(canReviewRegistrations ? [{ id: 'registrations' as View, label: 'Payment review' }] : []),
    ...(canViewAttendance ? [{ id: 'attendance' as View, label: 'Attendance' }] : []),
    ...(canViewUsers ? [{ id: 'users' as View, label: 'Users' }] : []),
    ...(canViewOrganizations ? [{ id: 'organizations' as View, label: 'Organizations' }] : []),
    ...(canViewReports ? [{ id: 'reports' as View, label: 'Reports' }] : []),
  ]
  const activeView = navItems.some((item) => item.id === view) ? view : navItems[0].id

  const currentPage = {
    dashboard: isExhibitor ? (
      <AttendancePage
        logs={selectedExhibitorEventId
          ? attendance.filter((log) => log.eventId === selectedExhibitorEventId)
          : attendance}
        events={getAssignedExhibitorEvents(events, me)}
        selectedEventId={selectedExhibitorEventId}
        onSelectEvent={setSelectedExhibitorEventId}
        title="Exhibitor Dashboard"
        onCheckIn={(qrToken) => api.attendance.checkIn(qrToken).then(() => refresh('Attendance recorded.'))}
      />
    ) : (
      <DashboardPage
        events={events}
        registrations={canReviewRegistrations ? registrations : myRegistrations}
        attendance={attendance}
        users={users}
        organizations={organizations}
        me={me}
        variant={dashboardVariant}
        canReviewRegistrations={canReviewRegistrations}
        canRegister={canRegisterForEvents}
        onRegister={(eventId) => api.registrations.create(eventId).then(() => refresh('Registration created.'))}
      />
    ),
    profile: <ProfilePage me={me} onUpdate={updateProfile} onUploadPicture={uploadProfilePicture} />,
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
        logs={isExhibitor && selectedExhibitorEventId
          ? attendance.filter((log) => log.eventId === selectedExhibitorEventId)
          : attendance}
        events={isExhibitor ? getAssignedExhibitorEvents(events, me) : undefined}
        selectedEventId={isExhibitor ? selectedExhibitorEventId : undefined}
        onSelectEvent={isExhibitor ? setSelectedExhibitorEventId : undefined}
        title={isExhibitor ? 'Exhibitor Dashboard' : 'Attendance'}
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
        canDelete={canManageUsers}
        currentUserId={me.id}
        onCreate={(payload) => api.users.create(payload).then(() => refresh('User account created.'))}
        onImport={(file) => api.users.importCsv(file).then(() => refresh('Users imported.'))}
        onUpdateOrganization={(userId, organizationId) =>
          api.users.updateOrganization(userId, organizationId).then(() => refresh('Organization affiliation updated.'))
        }
        onDelete={(id) => api.users.delete(id).then(() => refresh('User deleted.'))}
      />
    ),
    organizations: (
      <OrganizationsPage
        organizations={organizations}
        canCreate={canCreateOrganizations}
        canDelete={canCreateOrganizations}
        onCreate={(payload) => api.organizations.create(payload).then(() => refresh('Organization created.'))}
        onImport={(rows) => importOrganizations(rows)}
        onDelete={(id) => api.organizations.delete(id).then(() => refresh('Organization deleted.'))}
      />
    ),
    reports: (
      <ReportsPage
        events={events}
        registrations={canReviewRegistrations ? registrations : myRegistrations}
        attendance={attendance}
        users={users}
        organizations={organizations}
        me={me}
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
