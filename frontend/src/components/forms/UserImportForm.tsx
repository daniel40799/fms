import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { Button, Field, InlineError } from '../ui'

export function UserImportForm({
  onImport,
  onCancel,
}: {
  onImport: (file: File) => Promise<void>
  onCancel: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const action = useAsyncAction(async () => {
    if (!file) {
      throw new Error('CSV file is required.')
    }

    await onImport(file)
    setFile(null)
    onCancel()
  })

  return (
    <>
      {action.error && <InlineError message={action.error} />}
      <form className="grid gap-4" onSubmit={(event) => {
        event.preventDefault()
        void action.run()
      }}>
        <Field label="CSV file">
          <input
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-900 hover:file:bg-sky-200"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </Field>
        <div className="flex gap-2">
          <Button loading={action.loading}>{action.loading ? 'Importing...' : 'Import users'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}
