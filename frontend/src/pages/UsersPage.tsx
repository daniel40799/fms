import { useState } from 'react'
import { UserAffiliationForm, UserCreateForm, UserImportForm } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { FmsUser, Organization, RoleName } from '../types'

export function UsersPage({
  users,
  organizations,
  affiliationOrganizations,
  canCreate,
  onCreate,
  onImport,
  onUpdateOrganization,
}: {
  users: FmsUser[]
  organizations: Organization[]
  affiliationOrganizations: Organization[]
  canCreate: boolean
  onCreate: (payload: { email: string; password: string; fullName: string; organizationId: string | null; roles: RoleName[] }) => Promise<void>
  onImport: (file: File) => Promise<void>
  onUpdateOrganization: (userId: string, organizationId: string | null) => Promise<void>
}) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

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
      <Panel title="User directory">
        <Table
          columns={['Name', 'Email', 'Organization', 'Roles', 'Status', 'Affiliation']}
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
          ])}
          empty="No users found."
          filterableColumns={[true, true, true, true, true, true]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
