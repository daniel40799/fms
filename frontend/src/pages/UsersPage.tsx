import { useState } from 'react'
import { UserAccountForm, UserImportForm } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { FmsUser, Organization, UserAccountPayload } from '../types'

function organizationSummary(user: FmsUser) {
  if (user.organizations?.length) {
    return user.organizations.map((organization) => `${organization.name} (${organization.status})`).join(', ')
  }

  return user.organizationName ?? 'None'
}

export function UsersPage({
  users,
  organizations,
  canCreate,
  canDelete,
  currentUserId,
  onCreateAccount,
  onImport,
  onUpdate,
  onDelete,
}: {
  users: FmsUser[]
  organizations: Organization[]
  canCreate: boolean
  canDelete: boolean
  currentUserId: string
  onCreateAccount: () => void
  onImport: (file: File) => Promise<void>
  onUpdate: (userId: string, payload: UserAccountPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FmsUser | null>(null)

  return (
    <Page
      title="Users"
      description="Maintain user accounts, roles, and organization affiliation."
      actions={canCreate ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsImportModalOpen(true)}>Import users</Button>
          <Button type="button" onClick={onCreateAccount}>Create account</Button>
        </div>
      ) : null}
    >
      {canCreate && (
        <FormModal title="Import users" isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
          <UserImportForm onImport={onImport} onCancel={() => setIsImportModalOpen(false)} />
        </FormModal>
      )}
      {selectedUser && (
        <FormModal title={`Edit ${selectedUser.fullName}`} isOpen={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
          <UserAccountForm
            user={selectedUser}
            organizations={organizations}
            onSubmit={async (payload) => {
              await onUpdate(selectedUser.id, payload)
              setSelectedUser(null)
            }}
            onCancel={() => setSelectedUser(null)}
            onDelete={canDelete && selectedUser.id !== currentUserId ? async () => {
              await onDelete(selectedUser.id)
              setSelectedUser(null)
            } : undefined}
          />
        </FormModal>
      )}
      <Panel title="User directory">
        <Table
          columns={['Name', 'Email', 'Organizations', 'Roles', 'Status', 'Action']}
          rows={users.map((user) => [
            user.fullName,
            user.email,
            organizationSummary(user),
            user.roles.join(', '),
            <StatusBadge key={user.id} value={user.status} />,
            <Button key={`${user.id}-edit`} type="button" variant="secondary" onClick={() => setSelectedUser(user)}>
              Edit
            </Button>,
          ])}
          empty="No users found."
          filterableColumns={[true, true, true, true, true, false]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
