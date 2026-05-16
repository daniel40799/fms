import { useState } from 'react'
import { UserCreateForm } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { FmsUser, Organization, RoleName } from '../types'

export function UsersPage({
  users,
  organizations,
  onCreate,
}: {
  users: FmsUser[]
  organizations: Organization[]
  onCreate: (payload: { email: string; password: string; fullName: string; organizationId: string | null; roles: RoleName[] }) => Promise<void>
}) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  return (
    <Page
      title="Users"
      description="Create user accounts, attach organizations, and assign Phase 1 RBAC roles."
      actions={<Button type="button" onClick={() => setIsFormModalOpen(true)}>Create user</Button>}
    >
      <FormModal title="Create user" isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        <UserCreateForm organizations={organizations} onCreate={onCreate} onCancel={() => setIsFormModalOpen(false)} />
      </FormModal>
      <Panel title="User directory">
        <Table
          columns={['Name', 'Email', 'Organization', 'Roles', 'Status']}
          rows={users.map((user) => [
            user.fullName,
            user.email,
            user.organizationName ?? 'None',
            user.roles.join(', '),
            <StatusBadge key={user.id} value={user.status} />,
          ])}
          empty="No users found."
        />
      </Panel>
    </Page>
  )
}
