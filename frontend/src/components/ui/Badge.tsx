import type { ReactNode } from 'react'
import { statusTone } from '../../lib/status'

export interface BadgeProps {
  children: ReactNode
  value?: string
  className?: string
}

export function Badge({ children, value, className = '' }: BadgeProps) {
  void className;
  const tone = value ? statusTone(value) : 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors duration-200 ease-out motion-reduce:transition-none ${tone} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge value={value}>{value.replaceAll('_', ' ')}</Badge>
}

export default Badge
