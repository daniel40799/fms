import { useMemo } from 'react'
import { Page } from '../components/layout'
import { Button, Panel, Stat, Table } from '../components/ui'
import { toCsv } from '../lib/csv'
import type { AttendanceLog, EventRecord, FmsUser, Me, Organization, Registration, RoleName } from '../types'

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
  organizations,
  me,
  roles,
}: {
  events: EventRecord[]
  registrations: Registration[]
  attendance: AttendanceLog[]
  users: FmsUser[]
  organizations: Organization[]
  me: Me
  roles: RoleName[]
}) {
  const isMainAdmin = roles.includes('MAIN_ADMIN')
  const isOrganizationAdmin = roles.includes('ORGANIZATION_ADMIN')
  const canExportEvents = isMainAdmin || roles.includes('EVENT_ADMIN')
  const canExportUsers = isMainAdmin
  const canExportOrganizations = isMainAdmin || isOrganizationAdmin
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
  const organizationRows = useMemo<Record<string, unknown>[]>(() => organizations.map((organization) => ({
    name: organization.name,
    code: organization.code,
    status: organization.status,
    users: users.filter((user) => user.organizationId === organization.id).length,
    admins: countOrganizationAdmins(organization, users, me),
  })), [me, organizations, users])
  const organizationAdminRows = useMemo<Record<string, unknown>[]>(() => organizations.map((organization) => ({
    organization: organization.name,
    code: organization.code,
    admins: countOrganizationAdmins(organization, users, me),
  })), [me, organizations, users])

  return (
    <Page title="Reports" description="Exportable operational summaries for events, payments, registration status, attendance, and organizations.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canExportEvents ? <Stat label="Events" value={events.length} tone="INFORMATION" /> : null}
        {isMainAdmin ? <Stat label="Payment uploads" value={registrations.filter((item) => item.status === 'PAYMENT_UPLOADED').length} tone="PAYMENT_UPLOADED" /> : null}
        {isMainAdmin ? <Stat label="Confirmed registrations" value={registrations.filter((item) => item.status === 'CONFIRMED').length} tone="CONFIRMED" /> : null}
        {isMainAdmin ? <Stat label="Attendance logs" value={attendance.length} tone="ACTIVE" /> : null}
        {canExportUsers ? <Stat label="Users" value={users.length} tone="DEFAULT" /> : null}
        {canExportOrganizations ? <Stat label="Organizations" value={organizations.length} tone="INFORMATION" /> : null}
      </div>
      <div className={`mt-6 grid gap-6 ${isMainAdmin ? 'xl:grid-cols-2' : ''}`}>
        <Panel title="Exports">
          <div className="flex flex-wrap gap-2">
            {canExportEvents ? <DownloadButton filename="fapor7-events.csv" rows={eventRows}>Events CSV</DownloadButton> : null}
            {isMainAdmin ? <DownloadButton filename="fapor7-registrations.csv" rows={registrationRows}>Registrations CSV</DownloadButton> : null}
            {isMainAdmin ? <DownloadButton filename="fapor7-attendance.csv" rows={attendance.map((log) => ({ ...log }))}>Attendance CSV</DownloadButton> : null}
            {canExportUsers ? <DownloadButton filename="fapor7-users.csv" rows={users.map((user) => ({ ...user }))}>Users CSV</DownloadButton> : null}
            {canExportOrganizations ? <DownloadButton filename="fapor7-organizations.csv" rows={organizationRows}>Organizations CSV</DownloadButton> : null}
            {canExportOrganizations ? <DownloadButton filename="fapor7-organization-admin-counts.csv" rows={organizationAdminRows}>Admin counts CSV</DownloadButton> : null}
          </div>
        </Panel>
        {isMainAdmin ? (
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
        ) : null}
        {isOrganizationAdmin ? (
          <Panel title="Organization summary">
            <Table
              columns={['Organization', 'Code', 'Users', 'Admins']}
              rows={organizations.map((organization) => [
                organization.name,
                organization.code,
                users.filter((user) => user.organizationId === organization.id).length,
                countOrganizationAdmins(organization, users, me),
              ])}
              empty="No organization report data yet."
              filterableColumns={[true, true, false, false]}
              pageSize={8}
            />
          </Panel>
        ) : null}
      </div>
    </Page>
  )
}

function countOrganizationAdmins(organization: Organization, users: FmsUser[], me: Me) {
  const listedAdmins = users.filter((user) =>
    user.organizationId === organization.id
    && user.roles.some((role) => role === 'MAIN_ADMIN'
      || role === 'USER_ADMIN'
      || role === 'EVENT_ADMIN'
      || role === 'ORGANIZATION_ADMIN')
  ).length
  const includeCurrentAdmin = me.organizationId === organization.id
    && me.roles.includes('ORGANIZATION_ADMIN')
    && !users.some((user) => user.id === me.id)

  return listedAdmins + (includeCurrentAdmin ? 1 : 0)
}
