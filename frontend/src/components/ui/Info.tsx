import type { ReactNode } from 'react';

export function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  )
}
