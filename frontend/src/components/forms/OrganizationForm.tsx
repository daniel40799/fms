import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import type { FmsUser, Organization } from '../../types'
import { Button, Field, InlineError, Select } from '../ui'

export function OrganizationForm({
  organization,
  users,
  onSubmit,
  onCancel,
  onDelete,
}: {
  organization: Organization | null
  users: FmsUser[]
  onSubmit: (payload: { name: string; code: string; status: string; holderIds: string[] }) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}) {
  const [form, setForm] = useState({
    name: organization?.name ?? '',
    code: organization?.code ?? '',
    status: organization?.status ?? 'ACTIVE',
    holderIds: organization?.holders?.map((holder) => holder.id) ?? [],
  })
  const action = useAsyncAction(async () => {
    if (!form.name.trim() || !form.code.trim()) {
      throw new Error('Organization name and code are required.')
    }

    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim(),
      status: form.status,
      holderIds: form.holderIds,
    })
  })
  const deleteAction = useAsyncAction(async () => {
    if (onDelete) await onDelete()
  })
  const set = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleHolder = (id: string) => {
    set('holderIds', form.holderIds.includes(id)
      ? form.holderIds.filter((item) => item !== id)
      : [...form.holderIds, id])
  }

  return (
    <>
      {(action.error || deleteAction.error) && <InlineError message={action.error || deleteAction.error} />}
      <form
        className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]"
        onSubmit={(event) => {
          event.preventDefault()
          void action.run()
        }}
      >
        <Field label="Name"><input className="input" value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field>
        <Field label="Code"><input className="input" value={form.code} onChange={(event) => set('code', event.target.value)} required /></Field>
        {organization ? (
          <Field label="Status" className="sm:col-span-2">
            <Select value={form.status} onChange={(event) => set('status', event.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        ) : null}
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Organization holders</p>
          <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-2">
            {users.length ? users.map((user) => (
              <label key={user.id} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
                  checked={form.holderIds.includes(user.id)}
                  onChange={() => toggleHolder(user.id)}
                />
                <span className="truncate">{user.fullName}</span>
              </label>
            )) : <p className="px-2 py-1 text-sm text-slate-500 dark:text-slate-400">No users available.</p>}
          </div>
        </div>
        <div className="sticky bottom-0 z-10 -mx-5 -mb-4 flex flex-wrap gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:col-span-2">
          <Button loading={action.loading}>{action.loading ? 'Saving...' : organization ? 'Save changes' : 'Create'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          {onDelete ? (
            <Button type="button" variant="danger" loading={deleteAction.loading} onClick={() => void deleteAction.run()}>
              Delete
            </Button>
          ) : null}
        </div>
      </form>
    </>
  )
}
