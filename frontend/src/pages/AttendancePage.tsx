import { useState } from 'react'
import { Page } from '../components/layout'
import { Button, InlineError, Panel, Table } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import type { AttendanceLog } from '../types'

export function AttendancePage({ logs, onCheckIn }: { logs: AttendanceLog[]; onCheckIn: (qrToken: string) => Promise<void> }) {
  const [qrToken, setQrToken] = useState('')
  const action = useAsyncAction(async () => {
    await onCheckIn(qrToken)
    setQrToken('')
  })

  return (
    <Page title="Attendance" description="Record QR-based check-ins and review attendance logs.">
      <Panel title="QR check-in">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => {
          event.preventDefault()
          void action.run()
        }}>
          <input className="input" value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Paste or scan QR token" required />
          <Button loading={action.loading}>{action.loading ? 'Checking in...' : 'Check in'}</Button>
        </form>
        {action.error && <InlineError message={action.error} />}
      </Panel>
      <Panel className="mt-6" title="Attendance logs">
        <Table
          columns={['Participant', 'Event', 'Checked in by', 'Time']}
          rows={logs.map((log) => [log.userFullName, log.eventTitle, log.checkedInByName, formatDateTime(log.checkedInAt)])}
          empty="No check-ins recorded."
        />
      </Panel>
    </Page>
  )
}
