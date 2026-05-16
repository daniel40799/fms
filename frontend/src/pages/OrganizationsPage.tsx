import { useState } from 'react'
import { OrganizationCreateForm } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, Panel, StatusBadge, Table } from '../components/ui'
import type { Organization } from '../types'

export function OrganizationsPage({
  organizations,
  canCreate,
  onCreate,
}: {
  organizations: Organization[]
  canCreate: boolean
  onCreate: (payload: { name: string; code: string }) => Promise<void>
}) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  return (
    <Page
      title="Organizations"
      description="Maintain FAPOR7 member organizations used for affiliation, reporting, and event ownership."
      actions={canCreate ? <Button type="button" onClick={() => setIsFormModalOpen(true)}>Create organization</Button> : null}
    >
      {canCreate && (
        <FormModal title="Create organization" isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
          <OrganizationCreateForm onCreate={onCreate} onCancel={() => setIsFormModalOpen(false)} />
        </FormModal>
      )}
      <Panel title="Organization directory">
        <Table
          columns={['Name', 'Code', 'Status']}
          rows={organizations.map((org) => [org.name, org.code, <StatusBadge key={org.id} value={org.status} />])}
          empty="No organizations found."
        />
      </Panel>
    </Page>
  )
}
