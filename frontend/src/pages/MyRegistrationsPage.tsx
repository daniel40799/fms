import { PaymentUploadForm } from '../components/forms'
import { Page } from '../components/layout'
import { EmptyState, Info, Panel, StatusBadge } from '../components/ui'
import { formatDateTime } from '../lib/datetime'
import type { Registration } from '../types'

export function MyRegistrationsPage({
  registrations,
  onUpload,
}: {
  registrations: Registration[]
  onUpload: (registrationId: string, paymentReference: string, file: File) => Promise<void>
}) {
  return (
    <Page title="My Registrations" description="Track registration status, upload payment proof, and copy QR tokens after approval.">
      <div className="grid gap-4">
        {registrations.map((registration) => (
          <Panel key={registration.id} title={registration.eventTitle} actions={<StatusBadge value={registration.status} />}>
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Info label="Registered" value={formatDateTime(registration.registeredAt)} />
                <Info label="Payment reference" value={registration.paymentReference ?? 'Not uploaded'} />
                <Info label="Approved by" value={registration.approvedByName ?? 'Pending'} />
                <Info label="QR token" value={registration.qrToken ?? 'Generated after approval'} />
              </dl>
              {registration.status !== 'CONFIRMED' ? (
                <PaymentUploadForm registrationId={registration.id} onUpload={onUpload} />
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <p className="text-xs font-semibold uppercase tracking-wide">Attendance QR token</p>
                  <p className="mt-2 break-all font-mono text-sm">{registration.qrToken}</p>
                </div>
              )}
            </div>
          </Panel>
        ))}
        {registrations.length === 0 && <EmptyState message="You have not registered for an event yet." />}
      </div>
    </Page>
  )
}
