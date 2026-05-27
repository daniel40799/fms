import { Button, Panel, StatusBadge, Table } from '../components/ui'
import { Page } from '../components/layout'
import { useAsyncAction } from '../hooks/useAsyncAction'
import type { FmsUser, Me, Organization, UserOrganization } from '../types'

function MembershipActions({
  user,
  membership,
  onConfirm,
  onReject,
}: {
  user: FmsUser
  membership: UserOrganization
  onConfirm: (userId: string, organizationId: string) => Promise<void>
  onReject: (userId: string, organizationId: string) => Promise<void>
}) {
  const confirm = useAsyncAction(() => onConfirm(user.id, membership.id))
  const reject = useAsyncAction(() => onReject(user.id, membership.id))

  if (membership.status === 'CONFIRMED') return <span className="text-sm text-slate-500 dark:text-slate-400">Confirmed</span>
  if (membership.status === 'REJECTED') return <span className="text-sm text-slate-500 dark:text-slate-400">Rejected</span>

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" loading={confirm.loading} onClick={() => void confirm.run()}>Confirm</Button>
      <Button type="button" variant="danger" loading={reject.loading} onClick={() => void reject.run()}>Reject</Button>
      {(confirm.error || reject.error) && <span className="basis-full text-sm text-red-600 dark:text-red-300">{confirm.error || reject.error}</span>}
    </div>
  )
}

export function OrganizationConfirmationsPage({
  users,
  me,
  organizations,
  onConfirm,
  onReject,
}: {
  users: FmsUser[]
  me: Me
  organizations: Organization[]
  onConfirm: (userId: string, organizationId: string) => Promise<void>
  onReject: (userId: string, organizationId: string) => Promise<void>
}) {
  const explicitHeldOrganizationIds = organizations
    .filter((organization) => organization.holders?.some((holder) => holder.id === me.id))
    .map((organization) => organization.id)
  const heldOrganizationIds = new Set(explicitHeldOrganizationIds.length
    ? explicitHeldOrganizationIds
    : me.organizations.map((organization) => organization.id))
  const rows = users.flatMap((user) => (user.organizations ?? [])
    .filter((membership) => heldOrganizationIds.size === 0 || heldOrganizationIds.has(membership.id))
    .map((membership) => [
      user.fullName,
      user.email,
      membership.name,
      <StatusBadge key={`${user.id}-${membership.id}-status`} value={membership.status} />,
      <MembershipActions
        key={`${user.id}-${membership.id}-actions`}
        user={user}
        membership={membership}
        onConfirm={onConfirm}
        onReject={onReject}
      />,
    ]))

  return (
    <Page title="Organization Confirmations" description="Review submitted organization memberships for the organizations you hold.">
      <Panel title="Submitted memberships">
        <Table
          columns={['Name', 'Email', 'Organization', 'Status', 'Action']}
          rows={rows}
          empty="No submitted organization memberships need review."
          filterableColumns={[true, true, true, true, false]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
