import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { listItemMotion } from '../../lib/motion'

export function Table({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {rows.length ? rows.map((row, index) => (
              <motion.tr key={index} layout {...listItemMotion} className="transition-colors duration-150 ease-out hover:bg-slate-50 motion-reduce:transition-none">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-top text-slate-700 transition-colors duration-150 ease-out motion-reduce:transition-none">{cell}</td>)}
              </motion.tr>
            )) : (
              <motion.tr key="empty" {...listItemMotion}>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length}>{empty}</td>
              </motion.tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
