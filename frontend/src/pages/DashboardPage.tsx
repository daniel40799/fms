import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EventDetailView, formatEventPrice, getEventPosterUrl } from '../components/events/EventDetailView'
import { Page } from '../components/layout'
import { EmptyState, Panel, Stat, StatusBadge, Table } from '../components/ui'
import { formatDateTime } from '../lib/datetime'
import { pageTransition } from '../lib/motion'
import type { AttendanceLog, EventRecord, FmsUser, Me, Organization, Registration, RoleName } from '../types'

const CAROUSEL_INTERVAL_MS = 6000
type DashboardVariant = 'operations' | 'end-user' | 'organization-admin' | 'user-admin'

function EventCard({
  event,
  canRegister,
  onOpen,
}: {
  event: EventRecord
  canRegister: boolean
  onOpen: (event: EventRecord) => void
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <button className="group flex h-full w-full text-left sm:block" type="button" onClick={() => onOpen(event)}>
        <div className="aspect-[3/4] w-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-950 sm:w-full">
          <img
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            src={getEventPosterUrl(event, 'portrait')}
            alt=""
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 p-3 sm:space-y-2 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-950 dark:text-white sm:min-h-12 sm:text-base sm:leading-6">{event.title}</h3>
          <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">{event.venue || 'TBA'}</p>
          <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">{formatDateTime(event.startDate)}</p>
          <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{event.organizationName ?? 'FAPOR7'}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sm:pt-2">
            <span className="text-xs font-bold text-slate-950 dark:text-white sm:text-sm">{formatEventPrice(event.registrationPrice)}</span>
            <span className="inline-flex min-h-8 items-center rounded-md bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 ease-out group-hover:bg-sky-800 dark:bg-sky-600 dark:group-hover:bg-sky-500 motion-reduce:transition-none sm:min-h-9 sm:px-3 sm:py-2 sm:text-sm">
              {canRegister ? 'Register' : 'View details'}
            </span>
          </div>
        </div>
      </button>
    </article>
  )
}

function EndUserDashboard({
  events,
  canRegister,
  onRegister,
}: {
  events: EventRecord[]
  canRegister: boolean
  onRegister: (eventId: string) => Promise<void>
}) {
  const publishedEvents = useMemo(
    () => events
      .filter((event) => event.status === 'PUBLISHED')
      .sort((left, right) => Date.parse(left.startDate) - Date.parse(right.startDate)),
    [events],
  )
  const upcomingEvents = publishedEvents
  const featuredEvents = upcomingEvents.length ? upcomingEvents : publishedEvents
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [carouselTick, setCarouselTick] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null)
  const suppressFeaturedClickRef = useRef(false)
  const featuredEvent = featuredEvents.length ? featuredEvents[featuredIndex % featuredEvents.length] : null
  const nextOrganizer = upcomingEvents.find((event) => event.organizationName)?.organizationName
  const organizerEvents = nextOrganizer
    ? upcomingEvents.filter((event) => event.organizationName === nextOrganizer)
    : []

  useEffect(() => {
    if (featuredEvents.length <= 1 || selectedEvent) return undefined

    const timer = window.setTimeout(() => {
      setFeaturedIndex((index) => (index + 1) % featuredEvents.length)
    }, CAROUSEL_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [carouselTick, featuredEvents.length, featuredIndex, selectedEvent])

  const navigateFeatured = (nextIndex: number) => {
    if (!featuredEvents.length) return
    setFeaturedIndex((nextIndex + featuredEvents.length) % featuredEvents.length)
    setCarouselTick((tick) => tick + 1)
  }

  const handleFeaturedDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    void event
    if (featuredEvents.length <= 1) return

    const swiped = Math.abs(info.offset.x) > 45 || Math.abs(info.velocity.x) > 500
    if (!swiped) return

    suppressFeaturedClickRef.current = true
    navigateFeatured(featuredIndex + (info.offset.x < 0 ? 1 : -1))
    window.setTimeout(() => {
      suppressFeaturedClickRef.current = false
    }, 0)
  }

  const openFeaturedEvent = (event: EventRecord) => {
    if (suppressFeaturedClickRef.current) {
      suppressFeaturedClickRef.current = false
      return
    }

    setSelectedEvent(event)
  }

  if (selectedEvent) {
    return (
      <EventDetailView
        event={selectedEvent}
        canRegister={canRegister}
        onBack={() => setSelectedEvent(null)}
        onRegister={onRegister}
      />
    )
  }

  return (
    <Page title="Events" description="Published events open for FAPOR7 participants.">
      {featuredEvent ? (
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl sm:bg-slate-950">
            <AnimatePresence mode="wait">
              <motion.button
                key={featuredEvent.id}
                type="button"
                className="group relative block w-full touch-pan-y overflow-hidden text-left"
                drag={featuredEvents.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={handleFeaturedDragEnd}
                onClick={() => openFeaturedEvent(featuredEvent)}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={pageTransition}
              >
                <div className="sm:hidden">
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      src={getEventPosterUrl(featuredEvent, 'portrait')}
                      alt=""
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="line-clamp-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      {featuredEvent.organizationName ?? 'FAPOR7'}
                    </p>
                    <h1 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                      {featuredEvent.title}
                    </h1>
                    <div className="grid gap-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-1">{formatDateTime(featuredEvent.startDate)}</p>
                      <p className="line-clamp-1">{featuredEvent.venue || 'TBA'}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-sm font-bold text-slate-950 dark:text-white">
                        {formatEventPrice(featuredEvent.registrationPrice)}
                      </span>
                      <span className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out group-hover:bg-sky-800 dark:bg-sky-600 dark:group-hover:bg-sky-500 motion-reduce:transition-none">
                        {canRegister ? 'Register' : 'View details'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <img
                    className="aspect-[16/7] min-h-72 w-full object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100 lg:aspect-[16/6]"
                    src={getEventPosterUrl(featuredEvent, 'landscape')}
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <p className="text-sm font-semibold text-sky-100">{featuredEvent.organizationName ?? 'FAPOR7'}</p>
                    <h1 className="mt-2 max-w-4xl text-5xl font-black tracking-tight text-white">
                      {featuredEvent.title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-base leading-6 text-slate-100">
                      {formatDateTime(featuredEvent.startDate)} | {featuredEvent.venue || 'TBA'}
                    </p>
                  </div>
                </div>
              </motion.button>
            </AnimatePresence>

            {featuredEvents.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateFeatured(featuredIndex - 1)}
                  className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-900 shadow-sm backdrop-blur transition-all duration-200 ease-out hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100 sm:left-5 sm:inline-flex"
                  aria-label="Previous event"
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => navigateFeatured(featuredIndex + 1)}
                  className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-900 shadow-sm backdrop-blur transition-all duration-200 ease-out hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-5 sm:inline-flex"
                  aria-label="Next event"
                >
                  <ChevronRightIcon className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : null}
          </section>

          {featuredEvents.length > 1 ? (
            <div className="mt-4 flex justify-center gap-2" aria-label="Event slides">
              {featuredEvents.map((event, index) => {
                const active = index === featuredIndex % featuredEvents.length

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigateFeatured(index)}
                    className={`h-2.5 rounded-full transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:focus-visible:outline-sky-400 motion-reduce:transition-none ${
                      active
                        ? 'w-8 bg-sky-700 dark:bg-sky-300'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500'
                    }`}
                    aria-label={`Show ${event.title}`}
                    aria-current={active ? 'true' : undefined}
                  />
                )
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState message="No published events are available yet." />
      )}
      {publishedEvents.length ? (
        <>
          <section className="mx-auto mt-6 max-w-7xl sm:mt-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">Upcoming events</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{publishedEvents.length} published</p>
            </div>
            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {(upcomingEvents.length ? upcomingEvents : publishedEvents).map((event) => (
                <EventCard key={event.id} event={event} canRegister={canRegister} onOpen={setSelectedEvent} />
              ))}
            </div>
          </section>
          {organizerEvents.length ? (
            <section className="mx-auto mt-8 max-w-7xl sm:mt-10">
              <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">Events by {nextOrganizer}</h2>
              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
                {organizerEvents.map((event) => (
                  <EventCard key={`${event.id}-organizer`} event={event} canRegister={canRegister} onOpen={setSelectedEvent} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </Page>
  )
}

export function DashboardPage({
  events,
  registrations,
  attendance,
  users,
  organizations,
  me,
  variant,
  canReviewRegistrations,
  canRegister,
  onRegister,
}: {
  events: EventRecord[]
  registrations: Registration[]
  attendance: AttendanceLog[]
  users: FmsUser[]
  organizations: Organization[]
  me: Me
  variant: DashboardVariant
  canReviewRegistrations: boolean
  canRegister: boolean
  onRegister: (eventId: string) => Promise<void>
}) {
  if (variant === 'end-user') {
    return <EndUserDashboard events={events} canRegister={canRegister} onRegister={onRegister} />
  }

  if (variant === 'organization-admin') {
    return <OrganizationAdminDashboard organizations={organizations} users={users} me={me} />
  }

  if (variant === 'user-admin') {
    return <UserAdminDashboard users={users} />
  }

  const stats = [
    { label: 'Events', value: events.length, tone: 'INFORMATION' },
    { label: canReviewRegistrations ? 'Registrations' : 'My registrations', value: registrations.length, tone: 'INFORMATION' },
    { label: 'Confirmed', value: registrations.filter((item) => item.status === 'CONFIRMED').length, tone: 'CONFIRMED' },
    { label: 'Check-ins', value: attendance.length, tone: 'ACTIVE' },
    ...(users.length ? [{ label: 'Users', value: users.length, tone: 'DEFAULT' }] : []),
  ]

  return (
    <Page title="Operations Dashboard" description="A compact view of Phase 1 system activity and the next administrative actions.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => <Stat key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Events">
          <Table
            columns={['Event', 'Schedule', 'Status']}
            rows={events.map((event) => [
              event.title,
              formatDateTime(event.startDate),
              <StatusBadge key={event.id} value={event.status} />,
            ])}
            empty="No events yet."
          />
        </Panel>
        <Panel title="Registration pipeline">
          <Table
            columns={['Participant', 'Event', 'Status']}
            rows={registrations.slice(0, 5).map((registration) => [
              registration.userFullName,
              registration.eventTitle,
              <StatusBadge key={registration.id} value={registration.status} />,
            ])}
            empty="No registrations yet."
          />
        </Panel>
      </div>
    </Page>
  )
}

function OrganizationAdminDashboard({
  organizations,
  users,
  me,
}: {
  organizations: Organization[]
  users: FmsUser[]
  me: Me
}) {
  const heldOrganizations = organizations.filter((organization) => organization.holders?.some((holder) => holder.id === me.id))
  const visibleOrganizationIds = new Set((heldOrganizations.length ? heldOrganizations : me.organizations).map((organization) => organization.id))
  const memberships = users.flatMap((user) => (user.organizations ?? [])
    .filter((membership) => visibleOrganizationIds.size === 0 || visibleOrganizationIds.has(membership.id))
    .map((membership) => ({ user, membership })))
  const pendingMemberships = memberships.filter((item) => item.membership.status === 'PENDING').length
  const confirmedMemberships = memberships.filter((item) => item.membership.status === 'CONFIRMED').length

  return (
    <Page title="Organization Confirmation Dashboard" description="Submitted memberships for the organizations you hold.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Held organizations" value={heldOrganizations.length || me.organizations.length} tone="INFORMATION" />
        <Stat label="Pending review" value={pendingMemberships} tone="PENDING" />
        <Stat label="Confirmed" value={confirmedMemberships} tone="CONFIRMED" />
      </div>
      <Panel title="Recent submitted memberships" className="mt-6">
        <Table
          columns={['User', 'Email', 'Organization', 'Status']}
          rows={memberships.slice(0, 8).map(({ user, membership }) => [
            user.fullName,
            user.email,
            membership.name,
            <StatusBadge key={`${user.id}-${membership.id}`} value={membership.status} />,
          ])}
          empty="No submitted memberships are available for review."
          filterableColumns={[true, true, true, true]}
          pageSize={8}
        />
      </Panel>
    </Page>
  )
}

function UserAdminDashboard({ users }: { users: FmsUser[] }) {
  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length
  const endUsers = users.filter((user) => user.roles.includes('END_USER')).length
  const adminUsers = users.filter((user) => user.roles.some(isAdministrativeRole)).length
  const unaffiliatedUsers = users.filter((user) => !user.organizationId).length
  const roleRows = getRoleRows(users)

  return (
    <Page title="User Administration Dashboard" description="User account totals, active users, and role coverage.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total users" value={users.length} tone="INFORMATION" />
        <Stat label="Active users" value={activeUsers} tone="ACTIVE" />
        <Stat label="End users" value={endUsers} tone="CONFIRMED" />
        <Stat label="Admin users" value={adminUsers} tone="DEFAULT" />
        <Stat label="Unassigned" value={unaffiliatedUsers} tone="PENDING" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent users">
          <Table
            columns={['Name', 'Email', 'Organization', 'Status']}
            rows={users.slice(0, 8).map((user) => [
              user.fullName,
              user.email,
              user.organizationName ?? 'Unassigned',
              <StatusBadge key={user.id} value={user.status} />,
            ])}
            empty="No users found."
            filterableColumns={[true, true, true, true]}
            pageSize={8}
          />
        </Panel>
        <Panel title="Role summary">
          <Table
            columns={['Role', 'Users']}
            rows={roleRows}
            empty="No role data available."
          />
        </Panel>
      </div>
    </Page>
  )
}

function isAdministrativeRole(role: RoleName) {
  return role === 'MAIN_ADMIN'
    || role === 'USER_ADMIN'
    || role === 'EVENT_ADMIN'
    || role === 'ORGANIZATION_ADMIN'
}

function getRoleRows(users: FmsUser[]) {
  const roleCounts = new Map<RoleName, number>()

  for (const user of users) {
    for (const role of user.roles) {
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
    }
  }

  return Array.from(roleCounts.entries()).map(([role, count]) => [role, count])
}
