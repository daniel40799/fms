import { motion } from 'framer-motion';
import { alertTone } from '../../lib/status';

export function Alert({ message, tone = 'INFORMATION', onDismiss }: { message: string; tone?: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`mb-6 flex items-center justify-between gap-4 rounded-md border px-4 py-3 text-sm shadow-sm transition-colors duration-200 ease-out motion-reduce:transition-none ${alertTone(tone)}`}
    >
      <span>{message}</span>
      <button
        type="button"
        className="rounded px-2 py-1 font-semibold transition-all duration-150 ease-out hover:bg-white/50 hover:text-slate-950 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-reduce:transition-none motion-reduce:active:scale-100"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </motion.div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </motion.div>
  )
}
