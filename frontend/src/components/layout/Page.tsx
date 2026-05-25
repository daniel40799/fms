import type { ReactNode } from 'react';

export function Page({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-semibold text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
        {actions && <div className="flex min-w-0 shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
