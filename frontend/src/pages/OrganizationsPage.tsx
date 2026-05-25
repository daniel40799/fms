import { useState } from 'react'
import { OrganizationCreateForm, OrganizationImportForm, type OrganizationImportRow } from '../components/forms'
import { Page } from '../components/layout'
import { ConfirmDeleteModal, FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { Organization } from '../types'

export function OrganizationsPage({
  organizations,
  canCreate,
  canDelete,
  onCreate,
  onImport,
  onDelete,
}: {
  organizations: Organization[]
  canCreate: boolean
  canDelete: boolean
  onCreate: (payload: { name: string; code: string }) => Promise<void>
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
            <OrganizationCreateForm onCreate={onCreate} onCancel={() => setIsFormModalOpen(false)} />
          </FormModal>
        </>
      )}
      {canDelete && (
        <ConfirmDeleteModal
          actionLabel="Delete organization"
          description="This permanently removes the organization. Existing users or events may block deletion."
          isOpen={Boolean(selectedOrganization)}
          objectName={selectedOrganization?.name ?? ''}
          title="Delete organization"
          onClose={() => setSelectedOrganization(null)}
          onConfirm={async () => {
            if (!selectedOrganization) return
            await onDelete(selectedOrganization.id)
            setSelectedOrganization(null)
          }}
        />
      )}
      <Panel title="Organization directory">
        <Table
          columns={['Name', 'Code', 'Status', ...(canDelete ? ['Actions'] : [])]}
          rows={organizations.map((org) => [
            org.name,
            org.code,
            <StatusBadge key={org.id} value={org.status} />,
            ...(canDelete ? [
              <Button key={`${org.id}-delete`} type="button" variant="danger" onClick={() => setSelectedOrganization(org)}>
                Delete
              </Button>,
            ] : []),
          ])}
          empty="No organizations found."
          filterableColumns={[true, true, true, false]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}
