import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { InlineError } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

export function PaymentUploadForm({
  registrationId,
  onUpload,
}: {
  registrationId: string
  onUpload: (registrationId: string, paymentReference: string, file: File) => Promise<void>
}) {
  const [paymentReference, setPaymentReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const action = useAsyncAction(async () => {
    if (!file) throw new Error('Select a proof-of-payment file.')
    await onUpload(registrationId, paymentReference, file)
    setPaymentReference('')
    setFile(null)
  })

  return (
    <form className="space-y-3 rounded-md border border-slate-200 p-4 transition-colors duration-200 ease-out hover:border-sky-200 hover:bg-sky-50/30 motion-reduce:transition-none" onSubmit={(event) => {
      event.preventDefault()
      void action.run()
    }}>
      <Field label="Payment reference"><input className="input" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} required /></Field>
      <Field label="Proof of payment"><input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></Field>
      {action.error && <InlineError message={action.error} />}
      <Button loading={action.loading}>{action.loading ? 'Uploading...' : 'Upload proof'}</Button>
    </form>
  )
}
