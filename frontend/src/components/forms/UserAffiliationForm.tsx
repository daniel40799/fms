import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import type { FmsUser, Organization } from '../../types'
import { Button, InlineError, Select } from '../ui'

export function UserAffiliationForm({
  user,
  organizations,
  onUpdate,
}: {
  user: FmsUser
  organizations: Organization[]
  onUpdate: (userId: string, organizationId: string | null) => Promise<void>
}) {
  const [organizationId, setOrganizationId] = useState(user.organizationId ?? '')
  const save = useAsyncAction(async () => onUpdate(user.id, organizationId || null))

  return (
    <form
      className="grid min-w-56 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
      onSubmit={(event) => {
        event.preventDefault()
        void save.run()
      }}
    >
      <Select
        value={organizationId}
        aria-label={`Organization for ${user.fullName}`}
        onChange={(event) => setOrganizationId(event.target.value)}
      >
        <option value="">Unassigned</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </Select>
      <Button variant="secondary" loading={save.loading}>
        Save
      </Button>
      {save.error && <div className="sm:col-span-2"><InlineError message={save.error} /></div>}
    </form>
  )
}
