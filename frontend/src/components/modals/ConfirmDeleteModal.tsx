import { useAsyncAction } from '../../hooks/useAsyncAction'
import { alertTone } from '../../lib/status'
import { InlineError } from '../ui/Alert'
import { Button } from '../ui/Button'
import { AnimatedDialog } from './AnimatedDialog'

export function ConfirmDeleteModal({
  title,
  objectName,
  description,
  actionLabel = 'Delete',
  isOpen,
  onClose,
  onConfirm,
}: {
  title: string
  objectName: string
  description: string
  actionLabel?: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const action = useAsyncAction(onConfirm)

  return (
    <AnimatedDialog isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className={`rounded-md border px-3 py-2 text-sm ${alertTone('ARCHIVED')}`}>
          <span className="font-semibold">{objectName}</span>
        </div>
        <p className="text-sm text-slate-600">{description}</p>
        {action.error && <InlineError message={action.error} />}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="danger" loading={action.loading} onClick={() => void action.run()}>
            {action.loading ? 'Working...' : actionLabel}
          </Button>
        </div>
      </div>
    </AnimatedDialog>
  )
}
