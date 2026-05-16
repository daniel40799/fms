import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { InlineError } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

export function OrganizationCreateForm({
  onCreate,
  onCancel,
}: {
  onCreate: (payload: { name: string; code: string }) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ name: '', code: '' })
  const action = useAsyncAction(async () => {
    await onCreate(form)
    setForm({ name: '', code: '' })
    onCancel()
  })

  return (
    <>
      {action.error && <InlineError message={action.error} />}
      <form className="grid gap-4 sm:grid-cols-[1fr_180px_auto]" onSubmit={(event) => {
        event.preventDefault()
        void action.run()
      }}>
        <Field label="Name"><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label="Code"><input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></Field>
        <div className="flex gap-2 self-end">
          <Button loading={action.loading}>{action.loading ? 'Creating...' : 'Create'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
