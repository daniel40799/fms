import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { roleLabels } from '../../lib/constants'
import type { Me, View } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function AppLayout({
  me,
  view,
  navItems,
  loading,
  onNavigate,
  onRefresh,
  onLogout,
  children,
}: {
  me: Me
  view: View
  navItems: { id: View; label: string }[]
  loading: boolean
  onNavigate: (view: View) => void
  onRefresh: () => void
  onLogout: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="border-b border-slate-200 px-6 py-5">
            <img src="/fapor7.png"/>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">FAPOR7</p>
          <h1 className="mt-1 text-xl font-semibold">Event Management</h1>
        </div>
        <nav className="space-y-1 px-4 py-5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-all duration-200 ease-out hover:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transition-none motion-reduce:hover:translate-x-0 ${
                view === item.id ? 'bg-sky-50 text-sky-800 shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-500">{me.organization ?? 'No organization assigned'}</p>
              <p className="text-base font-semibold text-slate-950">{me.fullName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {me.roles.map((role) => <Badge key={role}>{roleLabels[role]}</Badge>)}
              <Button type="button" variant="secondary" loading={loading} onClick={onRefresh}>Refresh</Button>
              <Button type="button" variant="ghost" onClick={onLogout}>Sign out</Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-out hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 motion-reduce:transition-none ${
                  view === item.id ? 'bg-sky-50 text-sky-800 shadow-sm' : 'text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
