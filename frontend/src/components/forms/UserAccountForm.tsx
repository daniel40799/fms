import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { roleLabels, roles } from '../../lib/constants'
import type { FmsUser, Organization, RoleName, UserAccountPayload } from '../../types'
import { Button, Field, InlineError } from '../ui'

function initialOrganizationIds(user: FmsUser | null) {
  if (!user) return []
  if (user.organizations?.length) return user.organizations.filter((item) => item.status !== 'REJECTED').map((item) => item.id)
  return user.organizationId ? [user.organizationId] : []
}

function compact(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function UserAccountForm({
  user,
  organizations,
  onSubmit,
  onCancel,
  onDelete,
}: {
  user: FmsUser | null
  organizations: Organization[]
  onSubmit: (payload: UserAccountPayload) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({
    email: user?.email ?? '',
    password: '',
    fullName: user?.fullName ?? '',
    firstName: user?.firstName ?? '',
    middleName: user?.middleName ?? '',
    lastName: user?.lastName ?? '',
    birthday: user?.birthday ?? '',
    sex: user?.sex ?? '',
    address: user?.address ?? '',
    mobileNumber: user?.mobileNumber ?? '',
    prcNumber: user?.prcNumber ?? '',
    organizationIds: initialOrganizationIds(user),
    roles: user?.roles.length ? user.roles : (['END_USER'] as RoleName[]),
  })
  const action = useAsyncAction(async () => {
    if (!form.email.trim() || !form.fullName.trim()) {
      throw new Error('Full name and email are required.')
    }

    if (!isEdit && !form.password.trim()) {
      throw new Error('Initial password is required.')
    }

    if (form.roles.length === 0) {
      throw new Error('Select at least one role.')
    }

    await onSubmit({
      email: form.email.trim(),
      password: form.password.trim() || undefined,
      fullName: form.fullName.trim(),
      firstName: compact(form.firstName),
      middleName: compact(form.middleName),
      lastName: compact(form.lastName),
      birthday: form.birthday || null,
      sex: compact(form.sex),
      address: compact(form.address),
      mobileNumber: compact(form.mobileNumber),
      prcNumber: compact(form.prcNumber),
      organizationIds: form.organizationIds,
      roles: form.roles,
    })
  })
  const deleteAction = useAsyncAction(async () => {
    if (onDelete) await onDelete()
  })

  const set = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleOrganization = (id: string) => {
    set('organizationIds', form.organizationIds.includes(id)
      ? form.organizationIds.filter((item) => item !== id)
      : [...form.organizationIds, id])
  }
  const toggleRole = (role: RoleName) => {
    set('roles', form.roles.includes(role)
      ? form.roles.filter((item) => item !== role)
      : [...form.roles, role])
  }

  return (
    <>
      {(action.error || deleteAction.error) && <InlineError message={action.error || deleteAction.error} />}
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          void action.run()
        }}
      >
        <Field label="Full name"><input className="input" value={form.fullName} onChange={(event) => set('fullName', event.target.value)} required /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} required /></Field>
        <Field label={isEdit ? 'New password' : 'Initial password'}>
          <input className="input" type="password" value={form.password} onChange={(event) => set('password', event.target.value)} required={!isEdit} />
        </Field>
        <Field label="Mobile number"><input className="input" value={form.mobileNumber} onChange={(event) => set('mobileNumber', event.target.value)} placeholder="09XXXXXXXXX" /></Field>
        <Field label="First name"><input className="input" value={form.firstName} onChange={(event) => set('firstName', event.target.value)} /></Field>
        <Field label="Middle name"><input className="input" value={form.middleName} onChange={(event) => set('middleName', event.target.value)} /></Field>
        <Field label="Last name"><input className="input" value={form.lastName} onChange={(event) => set('lastName', event.target.value)} /></Field>
        <Field label="Birthday"><input className="input" type="date" value={form.birthday} onChange={(event) => set('birthday', event.target.value)} /></Field>
        <Field label="Sex"><input className="input" value={form.sex} onChange={(event) => set('sex', event.target.value)} /></Field>
        <Field label="PRC number"><input className="input" value={form.prcNumber} onChange={(event) => set('prcNumber', event.target.value)} /></Field>
        <Field label="Address" className="lg:col-span-2">
          <textarea className="input min-h-20" value={form.address} onChange={(event) => set('address', event.target.value)} />
        </Field>
        <div className="lg:col-span-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Organizations</p>
          <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-2">
            {organizations.length ? organizations.map((organization) => (
              <label key={organization.id} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
                  checked={form.organizationIds.includes(organization.id)}
                  onChange={() => toggleOrganization(organization.id)}
                />
                <span className="truncate">{organization.name}</span>
              </label>
            )) : <p className="px-2 py-1 text-sm text-slate-500 dark:text-slate-400">No organizations available.</p>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Roles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <label key={role} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-sky-200 hover:bg-sky-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-400/30 dark:hover:bg-sky-400/10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
                  checked={form.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {roleLabels[role]}
              </label>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 z-10 -mx-5 -mb-4 flex flex-wrap gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:col-span-2">
          <Button loading={action.loading}>{action.loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create account'}</Button>
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
