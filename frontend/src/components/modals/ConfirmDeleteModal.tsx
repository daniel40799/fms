import { useAsyncAction } from '../../hooks/useAsyncAction'
import { alertTone } from '../../lib/status'
import { Button, InlineError } from '../ui'
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
          <span className="break-words font-semibold">{objectName}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        {action.error && <InlineError message={action.error} />}
        <div className="sticky bottom-0 -mx-5 -mb-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="danger" loading={action.loading} onClick={() => void action.run()}>
            {action.loading ? 'Working...' : actionLabel}
          </Button>
        </div>
      </div>
    </AnimatedDialog>
  )
}
