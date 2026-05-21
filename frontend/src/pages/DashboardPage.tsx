import { useMemo, useState } from 'react'
import fallbackHero from '../assets/hero.png'
import { Page } from '../components/layout'
import { Button, EmptyState, InlineError, Panel, Stat, StatusBadge, Table } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import type { AttendanceLog, EventRecord, FmsUser, Registration } from '../types'

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
      <Button type="button" loading={action.loading} onClick={() => void action.run()}>
        Register for {formatPrice(event.registrationPrice)}
      </Button>
      {action.error && <InlineError message={action.error} />}
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

  return (
    <Page
      title={event.title}
      description={event.organizationName ?? 'FAPOR7 event'}
      actions={<Button type="button" variant="secondary" onClick={onBack}>Back to events</Button>}
    >
      <div className="overflow-hidden rounded-md bg-slate-900">
        <img
          className="aspect-[16/6] w-full object-cover"
          src={event.horizontalPosterUrl ?? fallbackHero}
          alt=""
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-950">{event.title}</h2>
            <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {event.description || 'Event details will be posted soon.'}
            </p>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-950">Date</p>
              <p className="mt-1 text-slate-600">{formatDateTime(event.startDate)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Venue</p>
              <p className="mt-1 text-slate-600">{event.venue || 'TBA'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Organizer</p>
              <p className="mt-1 text-slate-600">{event.organizationName ?? 'FAPOR7'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Schedule</p>
              <p className="mt-1 text-slate-600">{formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {mapSrc ? (
              <iframe
                className="h-80 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapSrc}
                title={`${event.title} location`}
              />
            ) : (
              <div className="grid h-80 place-items-center text-sm text-slate-500">Location to be announced.</div>
            )}
          </div>
        </section>
        <aside className="space-y-4 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
            <img className="h-full w-full object-cover" src={event.verticalPosterUrl ?? fallbackHero} alt="" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Registration</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{formatPrice(event.registrationPrice)}</p>
          </div>
          {canRegister ? <RegisterButton event={event} onRegister={onRegister} /> : null}
        </aside>
      </div>
    </Page>
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
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <button className="block w-full text-left" type="button" onClick={() => onOpen(event)}>
        <div className="aspect-[3/4] overflow-hidden bg-slate-100">
          <img className="h-full w-full object-cover" src={event.verticalPosterUrl ?? fallbackHero} alt="" />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold text-slate-950">{event.title}</h3>
          <p className="text-sm text-slate-600">{event.venue || 'TBA'}</p>
          <p className="text-sm text-slate-600">{formatDateTime(event.startDate)}</p>
          <p className="text-sm text-slate-600">{event.organizationName ?? 'FAPOR7'}</p>
          <span className="inline-flex rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white">{canRegister ? 'Register' : 'View details'}</span>
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
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null)
  const featuredEvent = featuredEvents[featuredIndex % Math.max(featuredEvents.length, 1)]
  const nextOrganizer = upcomingEvents.find((event) => event.organizationName)?.organizationName
  const organizerEvents = nextOrganizer
    ? upcomingEvents.filter((event) => event.organizationName === nextOrganizer)
    : []

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
        <section className="relative overflow-hidden rounded-md bg-slate-950 text-white">
          <button className="block w-full text-left" type="button" onClick={() => setSelectedEvent(featuredEvent)}>
            <img className="aspect-[16/6] min-h-72 w-full object-cover opacity-80" src={featuredEvent.horizontalPosterUrl ?? fallbackHero} alt="" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 sm:p-8">
              <p className="text-sm font-semibold">{featuredEvent.organizationName ?? 'FAPOR7'}</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold sm:text-5xl">{featuredEvent.title}</h1>
              <p className="mt-3 text-sm text-slate-100 sm:text-base">{formatDateTime(featuredEvent.startDate)} | {featuredEvent.venue || 'TBA'}</p>
            </div>
          </button>
          {featuredEvents.length > 1 ? (
            <div className="absolute right-4 top-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setFeaturedIndex((index) => (index - 1 + featuredEvents.length) % featuredEvents.length)}>Prev</Button>
              <Button type="button" variant="secondary" onClick={() => setFeaturedIndex((index) => (index + 1) % featuredEvents.length)}>Next</Button>
            </div>
          ) : null}
        </section>
      ) : (
        <EmptyState message="No published events are available yet." />
      )}
      {publishedEvents.length ? (
        <>
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-slate-950">Upcoming events</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {(upcomingEvents.length ? upcomingEvents : publishedEvents).map((event) => <EventCard key={event.id} event={event} canRegister={canRegister} onOpen={setSelectedEvent} />)}
            </div>
          </section>
          {organizerEvents.length ? (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-slate-950">Events by {nextOrganizer}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {organizerEvents.map((event) => <EventCard key={`${event.id}-organizer`} event={event} canRegister={canRegister} onOpen={setSelectedEvent} />)}
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
  canReviewRegistrations,
  canRegister,
  isEndUserDashboard,
  onRegister,
}: {
  events: EventRecord[]
  registrations: Registration[]
  attendance: AttendanceLog[]
  users: FmsUser[]
  canReviewRegistrations: boolean
  canRegister: boolean
  isEndUserDashboard: boolean
  onRegister: (eventId: string) => Promise<void>
}) {
  if (isEndUserDashboard) {
    return <EndUserDashboard events={events} canRegister={canRegister} onRegister={onRegister} />
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
