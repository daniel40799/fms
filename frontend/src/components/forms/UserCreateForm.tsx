import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { roleLabels, roles } from '../../lib/constants'
import type { Organization, RoleName } from '../../types'
import { Button, Field, InlineError, Select } from '../ui'

export function UserCreateForm({
  organizations,
  onCreate,
  onCancel,
}: {
  organizations: Organization[]
  onCreate: (payload: { email: string; password: string; fullName: string; organizationId: string | null; roles: RoleName[] }) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', organizationId: '', roles: ['END_USER'] as RoleName[] })
  const action = useAsyncAction(async () => {
    await onCreate({ ...form, organizationId: form.organizationId || null })
    setForm({ email: '', password: '', fullName: '', organizationId: '', roles: ['END_USER'] })
    onCancel()
  })

  return (
    <>
      {action.error && <InlineError message={action.error} />}
      <form className="grid gap-4 lg:grid-cols-2" onSubmit={(event) => {
        event.preventDefault()
        void action.run()
      }}>
        <Field label="Full name"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Initial password"><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        <Field label="Organization">
          <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
            <option value="">None</option>
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </Select>
        </Field>
        <div className="lg:col-span-2">
          <p className="text-sm font-medium text-slate-800">Roles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <label key={role} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm transition-all duration-200 ease-out hover:border-sky-200 hover:bg-sky-50/60 focus-within:ring-2 focus-within:ring-sky-700 motion-reduce:transition-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-700 transition-colors duration-200 ease-out focus:ring-sky-700 motion-reduce:transition-none"
                  checked={form.roles.includes(role)}
                  onChange={(event) => {
                    const nextRoles = event.target.checked
                      ? [...form.roles, role]
                      : form.roles.filter((item) => item !== role)
                    setForm({ ...form, roles: nextRoles.length ? nextRoles : ['END_USER'] })
                  }}
                />
                {roleLabels[role]}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 lg:col-span-2">
          <Button loading={action.loading}>{action.loading ? 'Creating...' : 'Create user'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
