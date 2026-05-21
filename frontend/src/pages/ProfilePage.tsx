import { useState } from 'react'
import { Page } from '../components/layout'
import { Button, Field, InlineError, Panel, Select } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import type { Me, ProfilePayload } from '../types'

export function ProfilePage({
  me,
  onUpdate,
}: {
  me: Me
  onUpdate: (payload: ProfilePayload) => Promise<void>
}) {
  const [form, setForm] = useState({
    firstName: me.firstName ?? '',
    middleName: me.middleName ?? '',
    lastName: me.lastName ?? '',
    birthday: me.birthday ?? '',
    sex: me.sex ?? '',
    address: me.address ?? '',
    mobileNumber: me.mobileNumber ?? '',
    prcNumber: me.prcNumber ?? '',
  })
  const save = useAsyncAction(async () => onUpdate({
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim() || null,
    lastName: form.lastName.trim(),
    birthday: form.birthday || null,
    sex: form.sex || null,
    address: form.address.trim() || null,
    mobileNumber: form.mobileNumber.trim() || null,
    prcNumber: form.prcNumber.trim() || null,
  }))
  const set = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) =>
    setForm((current) => ({ ...current, [key]: value }))

  return (
    <Page
      title="Profile"
      description="Maintain the participant identity used for event registration and activity records."
    >
      <Panel title="Personal information">
        {save.error && <InlineError message={save.error} />}
        <form
          className="grid max-w-4xl gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            void save.run()
          }}
        >
          <Field label="First name">
            <input className="input" value={form.firstName} onChange={(event) => set('firstName', event.target.value)} required />
          </Field>
          <Field label="Middle name">
            <input className="input" value={form.middleName} onChange={(event) => set('middleName', event.target.value)} />
          </Field>
          <Field label="Last name">
            <input className="input" value={form.lastName} onChange={(event) => set('lastName', event.target.value)} required />
          </Field>
          <Field label="Birthday">
            <input className="input" type="date" value={form.birthday} onChange={(event) => set('birthday', event.target.value)} />
          </Field>
          <Field label="Sex">
            <Select value={form.sex} onChange={(event) => set('sex', event.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Mobile number">
            <input className="input" type="tel" value={form.mobileNumber} onChange={(event) => set('mobileNumber', event.target.value)} />
          </Field>
          <Field label="PRC number">
            <input
              className="input"
              inputMode="numeric"
              maxLength={7}
              pattern="\d{7}"
              title="Enter a 7-digit PRC number."
              value={form.prcNumber}
              onChange={(event) => set('prcNumber', event.target.value)}
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea className="input min-h-24" value={form.address} onChange={(event) => set('address', event.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input bg-slate-50 text-slate-500" value={me.email} readOnly />
          </Field>
          <Field label="Organization">
            <input className="input bg-slate-50 text-slate-500" value={me.organization ?? 'None'} readOnly />
          </Field>
          <div className="flex items-end sm:col-span-2">
            <Button loading={save.loading}>{save.loading ? 'Saving...' : 'Save profile'}</Button>
          </div>
        </form>
      </Panel>
    </Page>
  )
}
