import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Panel({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children?: ReactNode; className?: string }) {
  void className;
  return (
    <motion.section
      layout
      className={`rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          {title && <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-3 sm:p-4">{children}</div>
    </motion.section>
  )
}
