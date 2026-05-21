import { ApproveForm } from '../components/forms'
import { Page } from '../components/layout'
import { Button, InlineError, Panel, StatusBadge, Table } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import type { Registration } from '../types'

function PaymentProofButton({ registration, onViewPaymentProof }: { registration: Registration; onViewPaymentProof: (registrationId: string) => Promise<void> }) {
  const action = useAsyncAction(() => onViewPaymentProof(registration.id))
  if (!registration.paymentFilePath) return <>No file</>

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" loading={action.loading} onClick={() => void action.run()}>
        Proof
      </Button>
      {action.error && <InlineError message={action.error} />}
    </div>
  )
}

export function RegistrationReviewPage({
  registrations,
  onApprove,
  onViewPaymentProof,
}: {
  registrations: Registration[]
  onApprove: (registrationId: string, remarks: string) => Promise<void>
  onViewPaymentProof: (registrationId: string) => Promise<void>
}) {
  const rows = registrations.map((registration) => [
    registration.userFullName,
    registration.eventTitle,
    <StatusBadge key={registration.id} value={registration.status} />,
    registration.paymentReference ?? 'None',
    <PaymentProofButton key={registration.id} registration={registration} onViewPaymentProof={onViewPaymentProof} />,
    <ApproveForm key={registration.id} registration={registration} onApprove={onApprove} />,
  ])

  return (
    <Page title="Payment Review" description="Validate manual payment uploads and confirm registrations to generate attendance QR tokens.">
      <Panel>
        <Table
          columns={['Participant', 'Event', 'Status', 'Reference', 'File', 'Action']}
          rows={rows}
          empty="No registrations to review."
          filterableColumns={[true, true, true, true, false, true]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
