import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import type { Registration } from '../../types'
import { InlineError } from '../ui/Alert'
import { Button } from '../ui/Button'

export function ApproveForm({ registration, onApprove }: { registration: Registration; onApprove: (registrationId: string, remarks: string) => Promise<void> }) {
  const [remarks, setRemarks] = useState('')
  const action = useAsyncAction(() => onApprove(registration.id, remarks))

  if (registration.status === 'CONFIRMED') return <span className="text-sm text-slate-500">Confirmed</span>

  return (
    <form className="min-w-64 space-y-2" onSubmit={(event) => {
      event.preventDefault()
      void action.run()
    }}>
      <div className="flex gap-2">
        <input className="input" placeholder="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        <Button loading={action.loading}>{action.loading ? 'Approving...' : 'Approve'}</Button>
      </div>
      {action.error && <InlineError message={action.error} />}
    </form>
  )
}
