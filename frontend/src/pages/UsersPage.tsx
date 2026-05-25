import { useState } from 'react'
import { UserAffiliationForm, UserCreateForm, UserImportForm } from '../components/forms'
import { Page } from '../components/layout'
import { ConfirmDeleteModal, FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { FmsUser, Organization, RoleName } from '../types'

export function UsersPage({
  users,
  organizations,
  affiliationOrganizations,
  canCreate,
  canDelete,
  currentUserId,
  onCreate,
  onImport,
  onUpdateOrganization,
  onDelete,
}: {
  users: FmsUser[]
  organizations: Organization[]
  affiliationOrganizations: Organization[]
  canCreate: boolean
  canDelete: boolean
  currentUserId: string
  onCreate: (payload: { email: string; password: string; fullName: string; organizationId: string | null; roles: RoleName[] }) => Promise<void>
  onImport: (file: File) => Promise<void>
  onUpdateOrganization: (userId: string, organizationId: string | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FmsUser | null>(null)

  return (
    <Page
      title="Users"
      description="Maintain user accounts, roles, and organization affiliation."
      actions={canCreate ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsImportModalOpen(true)}>Import users</Button>
          <Button type="button" onClick={() => setIsFormModalOpen(true)}>Create user</Button>
        </div>
      ) : null}
    >
      {canCreate && (
        <>
          <FormModal title="Import users" isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
            <UserImportForm onImport={onImport} onCancel={() => setIsImportModalOpen(false)} />
          </FormModal>
          <FormModal title="Create user" isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
            <UserCreateForm organizations={organizations} onCreate={onCreate} onCancel={() => setIsFormModalOpen(false)} />
          </FormModal>
        </>
      )}
      {canDelete && (
        <ConfirmDeleteModal
          actionLabel="Delete user"
          description="This permanently removes the user account. Historical registrations or attendance records may block deletion."
          isOpen={Boolean(selectedUser)}
          objectName={selectedUser?.fullName ?? ''}
          title="Delete user"
          onClose={() => setSelectedUser(null)}
          onConfirm={async () => {
            if (!selectedUser) return
            await onDelete(selectedUser.id)
            setSelectedUser(null)
          }}
        />
      )}
      <Panel title="User directory">
        <Table
          columns={['Name', 'Email', 'Organization', 'Roles', 'Status', 'Affiliation', ...(canDelete ? ['Actions'] : [])]}
          rows={users.map((user) => [
            user.fullName,
            user.email,
            user.organizationName ?? 'None',
            user.roles.join(', '),
            <StatusBadge key={user.id} value={user.status} />,
            user.roles.includes('END_USER') ? (
              <UserAffiliationForm
                key={`${user.id}-affiliation`}
                user={user}
                organizations={affiliationOrganizations}
                onUpdate={onUpdateOrganization}
              />
            ) : (
              'Not applicable'
            ),
            ...(canDelete ? [
              user.id === currentUserId ? (
                <span key={`${user.id}-self`} className="text-sm text-slate-500 dark:text-slate-400">Current user</span>
              ) : (
                <Button key={`${user.id}-delete`} type="button" variant="danger" onClick={() => setSelectedUser(user)}>
                  Delete
                </Button>
              ),
            ] : []),
          ])}
          empty="No users found."
          filterableColumns={[true, true, true, true, true, true, false]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
