import { useState } from 'react'
import { OrganizationForm, OrganizationImportForm, type OrganizationImportRow } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { FmsUser, Organization } from '../types'

function holderSummary(organization: Organization) {
  return organization.holders?.length
    ? organization.holders.map((holder) => holder.fullName).join(', ')
    : 'None'
}

export function OrganizationsPage({
  organizations,
  users,
  canCreate,
  canDelete,
  onCreate,
  onUpdate,
  onImport,
  onDelete,
}: {
  organizations: Organization[]
  users: FmsUser[]
  canCreate: boolean
  canDelete: boolean
  onCreate: (payload: { name: string; code: string; status: string; holderIds: string[] }) => Promise<void>
  onUpdate: (id: string, payload: { name: string; code: string; status: string; holderIds: string[] }) => Promise<void>
  onImport: (organizations: OrganizationImportRow[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)

  return (
    <Page
      title="Organizations"
      description="Maintain FAPOR7 member organizations used for affiliation, reporting, and event ownership."
      actions={canCreate ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsImportModalOpen(true)}>Import organizations</Button>
          <Button type="button" onClick={() => setIsFormModalOpen(true)}>Create organization</Button>
        </div>
      ) : null}
    >
      {canCreate && (
        <>
          <FormModal title="Import organizations" isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
            <OrganizationImportForm onImport={onImport} onCancel={() => setIsImportModalOpen(false)} />
          </FormModal>
          <FormModal title="Create organization" isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
            <OrganizationForm
              organization={null}
              users={users}
              onSubmit={async (payload) => {
                await onCreate(payload)
                setIsFormModalOpen(false)
              }}
              onCancel={() => setIsFormModalOpen(false)}
            />
          </FormModal>
        </>
      )}
      {selectedOrganization && (
        <FormModal title={`Edit ${selectedOrganization.name}`} isOpen={Boolean(selectedOrganization)} onClose={() => setSelectedOrganization(null)}>
          <OrganizationForm
            organization={selectedOrganization}
            users={users}
            onSubmit={async (payload) => {
              await onUpdate(selectedOrganization.id, payload)
              setSelectedOrganization(null)
            }}
            onCancel={() => setSelectedOrganization(null)}
            onDelete={canDelete ? async () => {
              await onDelete(selectedOrganization.id)
              setSelectedOrganization(null)
            } : undefined}
          />
        </FormModal>
      )}
      <Panel title="Organization directory">
        <Table
          columns={['Name', 'Code', 'Status', 'Holders', 'Action']}
          rows={organizations.map((org) => [
            org.name,
            org.code,
            <StatusBadge key={org.id} value={org.status} />,
            holderSummary(org),
            <Button key={`${org.id}-edit`} type="button" variant="secondary" onClick={() => setSelectedOrganization(org)}>
              Edit
            </Button>,
          ])}
          empty="No organizations found."
          filterableColumns={[true, true, true, true, false]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
