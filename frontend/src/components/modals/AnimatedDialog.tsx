import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

let bodyLockCount = 0
let previousBodyOverflow = ''
let previousBodyPaddingRight = ''
let previousHtmlOverflow = ''

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

  useEffect(() => {
    if (!isOpen) return

    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow
      previousBodyPaddingRight = document.body.style.paddingRight
      previousHtmlOverflow = document.documentElement.style.overflow

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    bodyLockCount += 1

    return () => {
      bodyLockCount = Math.max(bodyLockCount - 1, 0)

      if (bodyLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow
        document.body.style.paddingRight = previousBodyPaddingRight
        document.documentElement.style.overflow = previousHtmlOverflow
      }
    }
  }, [isOpen])

  const dialog = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden px-3 py-3 sm:items-center sm:px-4 sm:py-6"
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
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm dark:bg-slate-950/70"
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
            className={`relative flex max-h-[92vh] w-full ${size === 'sm' ? 'max-w-md' : 'max-w-3xl'} flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-h-[90vh]`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-4">
              <h3 id={titleId} className="min-w-0 break-words text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-sky-400 motion-reduce:transition-none motion-reduce:active:scale-100"
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
            <div className="min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(dialog, document.body)
}
