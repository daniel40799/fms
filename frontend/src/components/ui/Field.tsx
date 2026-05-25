import type { ReactNode } from 'react';

export function Field({ label, children, className = '', error }: { label: string; children: ReactNode; className?: string; error?: string }) {
  void className;
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-sm text-red-600 dark:text-red-300">{error}</span>}
    </label>
  )
}
