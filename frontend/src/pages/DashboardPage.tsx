import { Page } from '../components/layout'
import { Panel, Stat, StatusBadge, Table } from '../components/ui'
import { formatDateTime } from '../lib/datetime'
import type { AttendanceLog, EventRecord, FmsUser, Registration } from '../types'

export function DashboardPage({
  events,
  registrations,
  attendance,
  users,
  canReviewRegistrations,
}: {
  events: EventRecord[]
  registrations: Registration[]
  attendance: AttendanceLog[]
  users: FmsUser[]
  canReviewRegistrations: boolean
}) {
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
        <Panel title="Upcoming events">
          <Table
            columns={['Event', 'Schedule', 'Status']}
            rows={events.slice(0, 5).map((event) => [
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
