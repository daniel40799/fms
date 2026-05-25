import { useState } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Button, Field, InlineError } from '../ui';

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
      <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]" onSubmit={(event) => {
        event.preventDefault()
        void action.run()
      }}>
        <Field label="Name"><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label="Code"><input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></Field>
        <div className="sticky bottom-0 z-10 -mx-5 -mb-4 flex flex-wrap gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:col-span-2">
          <Button loading={action.loading}>{action.loading ? 'Creating...' : 'Create'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
