import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function Panel({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <motion.section
      layout
      className={`rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {title && <h3 className="text-base font-semibold text-slate-950">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </motion.section>
  )
}
