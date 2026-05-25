import { motion } from 'framer-motion'
import { fadeIn } from '../../lib/motion'

export function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      {...fadeIn}
      className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 transition-colors duration-200 ease-out hover:border-sky-300 hover:bg-sky-50/30 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-sky-400/30 dark:hover:bg-sky-400/10 motion-reduce:transition-none"
    >
      {message}
    </motion.div>
  )
}
