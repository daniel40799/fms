import { UserAccountForm } from '../components/forms'
import { Page } from '../components/layout'
import { Panel } from '../components/ui'
import type { Organization, UserAccountPayload } from '../types'

export function CreateAccountPage({
  organizations,
  onCreate,
  onCancel,
}: {
  organizations: Organization[]
  onCreate: (payload: UserAccountPayload) => Promise<void>
  onCancel: () => void
}) {
  return (
    <Page title="Create Account" description="Create a user account with roles, contact details, and organization memberships.">
      <Panel title="Account details">
        <UserAccountForm
          user={null}
          organizations={organizations}
          onSubmit={onCreate}
          onCancel={onCancel}
        />
      </Panel>
    </Page>
  )
}
