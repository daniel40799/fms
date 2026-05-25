import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { Button, Field, InlineError } from '../ui'

export type OrganizationImportRow = {
  name: string
  code: string
}

export function OrganizationImportForm({
  onImport,
  onCancel,
}: {
  onImport: (organizations: OrganizationImportRow[]) => Promise<void>
  onCancel: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const action = useAsyncAction(async () => {
    if (!file) {
      throw new Error('CSV file is required.')
    }

    const rows = parseOrganizationCsv(await file.text())
    await onImport(rows)
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
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-900 hover:file:bg-sky-200 dark:file:bg-sky-400/10 dark:file:text-sky-100 dark:hover:file:bg-sky-400/20"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </Field>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          CSV headers must include name and code.
        </p>
        <div className="sticky bottom-0 z-10 -mx-5 -mb-4 flex flex-wrap gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <Button loading={action.loading}>{action.loading ? 'Importing...' : 'Import organizations'}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </>
  )
}

function parseOrganizationCsv(csv: string): OrganizationImportRow[] {
  const records = parseCsvRecords(csv)
  if (records.length < 2) {
    throw new Error('CSV file has no organization rows.')
  }

  const headers = records[0].map(normalizeHeader)
  const nameIndex = headers.indexOf('name')
  const codeIndex = headers.indexOf('code')

  if (nameIndex === -1 || codeIndex === -1) {
    throw new Error('CSV columns are required: name, code.')
  }

  const rows = records.slice(1)
    .filter((record) => record.some((value) => value.trim()))
    .map((record, index) => {
      const name = record[nameIndex]?.trim() ?? ''
      const code = record[codeIndex]?.trim() ?? ''
      if (!name || !code) {
        throw new Error(`CSV row ${index + 2} is missing name or code.`)
      }
      return { name, code }
    })

  if (!rows.length) {
    throw new Error('CSV file has no organization rows.')
  }

  return rows
}

function parseCsvRecords(csv: string) {
  const records: string[][] = []
  let record: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const current = csv[index]

    if (quoted) {
      if (current === '"') {
        if (csv[index + 1] === '"') {
          value += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        value += current
      }
      continue
    }

    if (current === '"' && value.length === 0) {
      quoted = true
    } else if (current === ',') {
      record.push(value.trim())
      value = ''
    } else if (current === '\n') {
      record.push(value.trim())
      records.push(record)
      record = []
      value = ''
    } else if (current !== '\r') {
      value += current
    }
  }

  if (quoted) {
    throw new Error('CSV file has an unterminated quoted value.')
  }

  if (record.length || value.length) {
    record.push(value.trim())
    records.push(record)
  }

  return records
}

function normalizeHeader(header: string) {
  return header.trim().replace(/^\uFEFF/, '').replace(/[-_\s]/g, '').toLowerCase()
}
