import { useMemo } from 'react'
import { Page } from '../components/layout'
import { Button, Panel, Stat, Table } from '../components/ui'
import { toCsv } from '../lib/csv'
import type { AttendanceLog, EventRecord, FmsUser, Registration } from '../types'

function DownloadButton({ filename, rows, children }: { filename: string; rows: Record<string, unknown>[]; children: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
      }}
    >
      {children}
    </Button>
  )
}

export function ReportsPage({
  events,
  registrations,
  attendance,
  users,
}: {
  events: EventRecord[]
  registrations: Registration[]
  attendance: AttendanceLog[]
  users: FmsUser[]
}) {
  const eventRows = useMemo<Record<string, unknown>[]>(() => events.map((event) => ({
    title: event.title,
    venue: event.venue,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    capacity: event.capacity ?? '',
  })), [events])

  const registrationRows = useMemo<Record<string, unknown>[]>(() => registrations.map((registration) => ({
    participant: registration.userFullName,
    event: registration.eventTitle,
    status: registration.status,
    paymentReference: registration.paymentReference ?? '',
    approvedAt: registration.approvedAt ?? '',
  })), [registrations])

  return (
    <Page title="Reports" description="Exportable operational summaries for events, payments, registration status, and attendance.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Events" value={events.length} tone="INFORMATION" />
        <Stat label="Payment uploads" value={registrations.filter((item) => item.status === 'PAYMENT_UPLOADED').length} tone="PAYMENT_UPLOADED" />
        <Stat label="Confirmed registrations" value={registrations.filter((item) => item.status === 'CONFIRMED').length} tone="CONFIRMED" />
        <Stat label="Attendance logs" value={attendance.length} tone="ACTIVE" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Exports">
          <div className="flex flex-wrap gap-2">
            <DownloadButton filename="fapor7-events.csv" rows={eventRows}>Events CSV</DownloadButton>
            <DownloadButton filename="fapor7-registrations.csv" rows={registrationRows}>Registrations CSV</DownloadButton>
            <DownloadButton filename="fapor7-attendance.csv" rows={attendance.map((log) => ({ ...log }))}>Attendance CSV</DownloadButton>
            <DownloadButton filename="fapor7-users.csv" rows={users.map((user) => ({ ...user }))}>Users CSV</DownloadButton>
          </div>
        </Panel>
        <Panel title="Completion criteria">
          <Table
            columns={['Participant', 'Registration', 'Payment', 'Attendance']}
            rows={registrations.slice(0, 8).map((registration) => [
              registration.userFullName,
              'Complete',
              registration.status === 'CONFIRMED' ? 'Confirmed' : registration.status === 'PAYMENT_UPLOADED' ? 'For review' : 'Pending',
              attendance.some((log) => log.registrationId === registration.id) ? 'Checked in' : 'Not checked in',
            ])}
            empty="No completion data yet."
          />
        </Panel>
      </div>
    </Page>
  )
}
