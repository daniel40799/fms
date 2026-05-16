import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

export function AnimatedDialog({
  title,
  isOpen,
  onClose,
  children,
  size = 'lg',
}: {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'lg'
}) {
  const titleId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onMouseDown={onClose}
        >
          <motion.div
            className="fixed inset-0 bg-slate-950/40"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          />
          <motion.section
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12, ease: 'easeIn' } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative w-full ${size === 'sm' ? 'max-w-md' : 'max-w-3xl'} rounded-lg border border-slate-200 bg-white shadow-xl`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <h3 id={titleId} className="text-base font-semibold text-slate-950">{title}</h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transition-none motion-reduce:active:scale-100"
                onClick={onClose}
                aria-label={`Close ${title}`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
                  <path
                    fill="currentColor"
                    d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z"
                  />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
