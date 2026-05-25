import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import fallbackHero from '../assets/hero.png'
import { Page } from '../components/layout'
import { Button, EmptyState, InlineError, Panel, Stat, StatusBadge, Table } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import { pageTransition } from '../lib/motion'
import type { AttendanceLog, EventRecord, FmsUser, Me, Organization, Registration, RoleName } from '../types'

const CAROUSEL_INTERVAL_MS = 6000
type DashboardVariant = 'operations' | 'end-user' | 'organization-admin' | 'user-admin'

function formatPrice(price: number) {
  return `PHP ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function RegisterButton({
  event,
  onRegister,
}: {
  event: EventRecord
  onRegister: (eventId: string) => Promise<void>
}) {
  const action = useAsyncAction(() => onRegister(event.id))

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="min-h-11 w-full rounded-lg text-base"
        loading={action.loading}
        onClick={() => void action.run()}
      >
        Register for {formatPrice(event.registrationPrice)}
      </Button>
      {action.error && <InlineError message={action.error} />}
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function MetadataCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-950 dark:text-white">{value}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p> : null}
        </div>
      </div>
    </div>
  )
}

function EventDetail({
  event,
  canRegister,
  onBack,
  onRegister,
}: {
  event: EventRecord
  canRegister: boolean
  onBack: () => void
  onRegister: (eventId: string) => Promise<void>
}) {
  const mapSrc = event.venue
    ? `https://www.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed`
    : ''
  const mapsLink = event.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`
    : ''

  return (
    <section className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to events
          </Button>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {formatDateTime(event.startDate)}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <img
            className="aspect-[16/7] w-full rounded-[1.35rem] object-cover sm:aspect-[16/6]"
            src={event.horizontalPosterUrl ?? fallbackHero}
            alt=""
          />
        </div>

        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {event.organizationName ?? 'FAPOR7'}
          </p>
          <h1 className="max-w-5xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {event.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
            {event.venue || 'Venue to be announced'} | {formatDateTime(event.startDate)}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetadataCard label="Date" value={formatDateTime(event.startDate)} icon={CalendarDaysIcon} />
          <MetadataCard label="Venue" value={event.venue || 'TBA'} icon={MapPinIcon} />
          <MetadataCard label="Organizer" value={event.organizationName ?? 'FAPOR7'} icon={BuildingOffice2Icon} />
          <MetadataCard
            label="Schedule"
            value={formatDateTime(event.startDate)}
            detail={`Ends ${formatDateTime(event.endDate)}`}
            icon={ClockIcon}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <DetailSection title="About this Event">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                {event.description || 'Event details will be posted soon.'}
              </p>
            </DetailSection>

            <DetailSection title="Event Details">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Starts</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatDateTime(event.startDate)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ends</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatDateTime(event.endDate)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Registration</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatPrice(event.registrationPrice)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capacity</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{event.capacity ?? 'No limit'}</dd>
                </div>
              </dl>
            </DetailSection>

            <DetailSection title="Location">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {event.venue || 'Location to be announced.'}
                </p>
                {mapsLink ? (
                  <a
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-white/10 dark:focus-visible:outline-sky-400 motion-reduce:transition-none"
                    href={mapsLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in Google Maps
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                {mapSrc ? (
                  <iframe
                    className="h-80 w-full border-0 sm:h-96"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapSrc}
                    title={`${event.title} location`}
                  />
                ) : (
                  <div className="grid h-80 place-items-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Location to be announced.
                  </div>
                )}
              </div>
            </DetailSection>
          </main>

          <aside className="self-start xl:sticky xl:top-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                <img
                  className="aspect-[3/4] w-full object-cover"
                  src={event.verticalPosterUrl ?? fallbackHero}
                  alt=""
                />
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Starts at</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {formatPrice(event.registrationPrice)}
                </p>
              </div>
              <div className="mt-5">
                {canRegister ? (
                  <RegisterButton event={event} onRegister={onRegister} />
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    Registration is currently unavailable.
                  </p>
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Registration is processed through your FAPOR7/FMS account and follows the event organizer's approval workflow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

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
      <button className="group block h-full w-full text-left" type="button" onClick={() => onOpen(event)}>
        <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-950">
          <img
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            src={event.verticalPosterUrl ?? fallbackHero}
            alt=""
          />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 min-h-12 text-base font-bold text-slate-950 dark:text-white">{event.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{event.venue || 'TBA'}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{formatDateTime(event.startDate)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{event.organizationName ?? 'FAPOR7'}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <span className="text-sm font-bold text-slate-950 dark:text-white">{formatPrice(event.registrationPrice)}</span>
            <span className="inline-flex min-h-9 items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out group-hover:bg-sky-800 dark:bg-sky-600 dark:group-hover:bg-sky-500 motion-reduce:transition-none">
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

  if (selectedEvent) {
    return (
      <EventDetail
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
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm dark:border-white/10">
            <AnimatePresence mode="wait">
              <motion.button
                key={featuredEvent.id}
                type="button"
                className="group relative block w-full overflow-hidden text-left"
                onClick={() => setSelectedEvent(featuredEvent)}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={pageTransition}
              >
                <img
                  className="aspect-[16/9] min-h-72 w-full object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:aspect-[16/7] lg:aspect-[16/6]"
                  src={featuredEvent.horizontalPosterUrl ?? fallbackHero}
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <p className="text-sm font-semibold text-sky-100">{featuredEvent.organizationName ?? 'FAPOR7'}</p>
                  <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                    {featuredEvent.title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100 sm:text-base">
                    {formatDateTime(featuredEvent.startDate)} | {featuredEvent.venue || 'TBA'}
                  </p>
                </div>
              </motion.button>
            </AnimatePresence>

            {featuredEvents.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateFeatured(featuredIndex - 1)}
                  className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-900 shadow-sm backdrop-blur transition-all duration-200 ease-out hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100 sm:left-5"
                  aria-label="Previous event"
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => navigateFeatured(featuredIndex + 1)}
                  className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-900 shadow-sm backdrop-blur transition-all duration-200 ease-out hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-5"
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
          <section className="mx-auto mt-8 max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Upcoming events</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{publishedEvents.length} published</p>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {(upcomingEvents.length ? upcomingEvents : publishedEvents).map((event) => (
                <EventCard key={event.id} event={event} canRegister={canRegister} onOpen={setSelectedEvent} />
              ))}
            </div>
          </section>
          {organizerEvents.length ? (
            <section className="mx-auto mt-10 max-w-7xl">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Events by {nextOrganizer}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
  const activeOrganizations = organizations.filter((organization) => organization.status === 'ACTIVE').length
  const affiliatedUsers = users.filter((user) => user.organizationId).length
  const totalAdmins = organizations.reduce((total, organization) => total + countOrganizationAdmins(organization, users, me), 0)

  return (
    <Page title="Organization Dashboard" description="Organization coverage, affiliation, and administrator summary.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total organizations" value={organizations.length} tone="INFORMATION" />
        <Stat label="Active organizations" value={activeOrganizations} tone="ACTIVE" />
        <Stat label="Organization admins" value={totalAdmins} tone="DEFAULT" />
        <Stat label="Affiliated users" value={affiliatedUsers} tone="CONFIRMED" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Organization summaries">
          <Table
            columns={['Organization', 'Code', 'Status', 'Users', 'Admins']}
            rows={organizations.map((organization) => [
              organization.name,
              organization.code,
              <StatusBadge key={organization.id} value={organization.status} />,
              users.filter((user) => user.organizationId === organization.id).length,
              countOrganizationAdmins(organization, users, me),
            ])}
            empty="No organizations yet."
            filterableColumns={[true, true, true, false, false]}
            pageSize={8}
          />
        </Panel>
        <Panel title="User affiliation summary">
          <Table
            columns={['User', 'Organization', 'Status']}
            rows={users.slice(0, 8).map((user) => [
              user.fullName,
              user.organizationName ?? 'Unassigned',
              <StatusBadge key={user.id} value={user.status} />,
            ])}
            empty="No users available for organization administration."
          />
        </Panel>
      </div>
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

function countOrganizationAdmins(organization: Organization, users: FmsUser[], me: Me) {
  const listedAdmins = users.filter((user) =>
    user.organizationId === organization.id && user.roles.some(isAdministrativeRole)
  ).length
  const includeCurrentAdmin = me.organizationId === organization.id
    && me.roles.includes('ORGANIZATION_ADMIN')
    && !users.some((user) => user.id === me.id && user.roles.some(isAdministrativeRole))

  return listedAdmins + (includeCurrentAdmin ? 1 : 0)
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
