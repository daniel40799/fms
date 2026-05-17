import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { parseApiDateTime, toLocalDateTimePayload } from '../../lib/datetime'
import type { EventPayload, EventRecord, Organization } from '../../types'
import { Button, Field, InlineError, Select } from '../ui'
import { DateTimePicker } from './DateTimePicker'

export function EventForm({
  event,
  organizations,
  onSubmit,
  onCancel,
}: {
  event: EventRecord | null
  organizations: Organization[]
  onSubmit: (payload: EventPayload) => Promise<void>
  onCancel: () => void
}) {
  const action = useAsyncAction(onSubmit)
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    venue: event?.venue ?? '',
    startDate: parseApiDateTime(event?.startDate),
    endDate: parseApiDateTime(event?.endDate),
    capacity: event?.capacity?.toString() ?? '',
    registrationOpen: parseApiDateTime(event?.registrationOpen),
    registrationClose: parseApiDateTime(event?.registrationClose),
    organizationId: event?.organizationId ?? '',
    status: event?.status ?? 'DRAFT',
  })

  const set = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <>
      {action.error && <InlineError message={action.error} />}
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault()
          if (!form.startDate || !form.endDate) {
            action.setError('Start and end dates are required.')
            return
          }
          const payload: EventPayload = {
            title: form.title,
            description: form.description,
            venue: form.venue,
            startDate: toLocalDateTimePayload(form.startDate) ?? '',
            endDate: toLocalDateTimePayload(form.endDate) ?? '',
            registrationOpen: toLocalDateTimePayload(form.registrationOpen),
            registrationClose: toLocalDateTimePayload(form.registrationClose),
            capacity: form.capacity ? Number(form.capacity) : null,
            organizationId: form.organizationId || null,
          }
          void action.run(payload)
        }}
      >
        <Field label="Event name"><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field>
        <Field label="Venue"><input className="input" value={form.venue} onChange={(e) => set('venue', e.target.value)} /></Field>
        <Field label="Start"><DateTimePicker value={form.startDate} onChange={(value) => set('startDate', value)} required /></Field>
        <Field label="End"><DateTimePicker value={form.endDate} onChange={(value) => set('endDate', value)} required /></Field>
        <Field label="Registration opens"><DateTimePicker value={form.registrationOpen} onChange={(value) => set('registrationOpen', value)} /></Field>
        <Field label="Registration closes"><DateTimePicker value={form.registrationClose} onChange={(value) => set('registrationClose', value)} /></Field>
        <Field label="Capacity"><input className="input" type="number" min="0" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} /></Field>
        <Field label="Organization">
          <Select value={form.organizationId} onChange={(e) => set('organizationId', e.target.value)}>
            <option value="">None</option>
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </Select>
        </Field>
        {event && (
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        )}
        <Field label="Description" className="lg:col-span-2">
          <textarea className="input min-h-24" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="flex gap-2 lg:col-span-2">
          <Button loading={action.loading}>{action.loading ? 'Saving...' : event ? 'Save changes' : 'Create event'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
