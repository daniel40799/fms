import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  MoonIcon,
  QrCodeIcon,
  Squares2X2Icon,
  SunIcon,
  TicketIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { roleLabels } from '../../lib/constants'
import { pageTransition } from '../../lib/motion'
import type { Me, View } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

type NavItem = { id: View; label: string }
type ThemePreference = 'light' | 'dark'
type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

const THEME_STORAGE_KEY = 'fms-theme'

const navigationIcons: Record<View, NavIcon> = {
  dashboard: Squares2X2Icon,
  profile: UserCircleIcon,
  'create-account': UserPlusIcon,
  events: CalendarDaysIcon,
  'my-registrations': TicketIcon,
  registrations: CreditCardIcon,
  attendance: QrCodeIcon,
  users: UsersIcon,
  organizations: BuildingOffice2Icon,
  'organization-confirmations': ClipboardDocumentCheckIcon,
  reports: ChartBarIcon,
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0]
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]
  return [first, second].filter(Boolean).join('').toUpperCase() || 'U'
}

function getPrimaryRoleLabel(me: Me) {
  const role = me.roles.find((item) => item !== 'END_USER') ?? me.roles[0]
  return role ? roleLabels[role] : 'Team Member'
}

function getInitialTheme(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function SidebarIdentity({ me, collapsed }: { me: Me; collapsed: boolean }) {
  const isEndUser = me.roles.includes('END_USER')
  const organizationName = me.organization ?? me.organizationCode ?? 'No organization assigned'
  const profileTitle = isEndUser ? me.fullName : getPrimaryRoleLabel(me)

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center">
      {isEndUser ? (
        me.profileImageUrl ? (
          <img
            className={classNames(
              'shrink-0 rounded-full border border-sky-100 object-cover shadow-sm ring-4 ring-sky-100/70 dark:border-sky-400/20 dark:ring-sky-400/10',
              collapsed ? 'h-12 w-12' : 'h-16 w-16',
            )}
            src={me.profileImageUrl}
            alt={`${me.fullName} profile`}
          />
        ) : (
          <div className={classNames(
            'grid shrink-0 place-items-center rounded-full border border-sky-100 bg-sky-50 font-black text-sky-800 shadow-sm ring-4 ring-sky-100/70 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100 dark:ring-sky-400/10',
            collapsed ? 'h-12 w-12 text-sm' : 'h-16 w-16 text-lg',
          )}>
            {getInitials(me.fullName)}
          </div>
        )
      ) : (
        <div className={classNames(
          'grid shrink-0 place-items-center rounded-full border border-slate-200 bg-white shadow-sm ring-4 ring-slate-100/80 dark:border-white/10 dark:bg-white dark:ring-white/10',
          collapsed ? 'h-12 w-12' : 'h-16 w-16',
        )}>
          <img className={classNames('object-contain', collapsed ? 'h-9 w-9' : 'h-12 w-12')} src="/fapor7.png" alt="FAPOR7" />
        </div>
      )}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="identity-text"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={pageTransition}
            className="min-w-0 max-w-full space-y-1.5 px-1"
          >
            <p className="line-clamp-2 break-words text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              {organizationName}
            </p>
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-6 tracking-tight text-slate-950 dark:text-white">
              {profileTitle}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent({
  me,
  view,
  navItems,
  collapsed,
  loading,
  theme,
  onNavigate,
  onCollapseToggle,
  onClose,
  onRefresh,
  onLogout,
  onThemeToggle,
}: {
  me: Me
  view: View
  navItems: NavItem[]
  collapsed: boolean
  loading?: boolean
  theme?: ThemePreference
  onNavigate: (view: View) => void
  onCollapseToggle?: () => void
  onClose?: () => void
  onRefresh?: () => void
  onLogout?: () => void
  onThemeToggle?: () => void
}) {
  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-sm transition-colors duration-200 ease-out dark:border-white/10 dark:bg-slate-900 motion-reduce:transition-none',
        collapsed ? 'px-3 pb-4' : 'px-5 pb-5',
      )}
    >
      <div className={classNames('border-b border-slate-200 py-5 dark:border-white/10', collapsed && 'py-4')}>
        <div className={classNames('relative flex flex-col items-center gap-3', collapsed && 'justify-center')}>
          <SidebarIdentity me={me} collapsed={collapsed} />
          <div className={classNames('flex shrink-0 items-center gap-2', !collapsed && 'absolute right-0 top-0')}>
            {onCollapseToggle ? (
              <button
                type="button"
                onClick={onCollapseToggle}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white motion-reduce:transition-none motion-reduce:active:scale-100 lg:inline-flex"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRightIcon className="h-5 w-5" aria-hidden /> : <ChevronLeftIcon className="h-5 w-5" aria-hidden />}
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:text-slate-950 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white motion-reduce:transition-none motion-reduce:active:scale-100 lg:hidden"
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 py-4 sm:py-5" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = navigationIcons[item.id]
          const active = view === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={classNames(
                'group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ease-out hover:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:focus-visible:outline-sky-400 motion-reduce:transition-none motion-reduce:hover:translate-x-0 sm:min-h-11 sm:py-2.5',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-sky-50 text-sky-800 shadow-sm dark:bg-sky-400/10 dark:text-sky-100'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
              )}
            >
              <Icon
                className={classNames(
                  'h-5 w-5 shrink-0 transition-colors duration-200 ease-out motion-reduce:transition-none',
                  active ? 'text-sky-700 dark:text-sky-200' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200',
                )}
                aria-hidden
              />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key={`${item.id}-label`}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={pageTransition}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {onClose && onRefresh && onLogout && onThemeToggle && theme ? (
        <div className="space-y-4 border-t border-slate-200 py-4 dark:border-white/10 lg:hidden">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Roles</p>
            <div className="flex flex-wrap gap-2">
              {me.roles.map((role) => <Badge key={role}>{roleLabels[role]}</Badge>)}
            </div>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={onThemeToggle}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" aria-hidden /> : <MoonIcon className="h-5 w-5" aria-hidden />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <Button
              type="button"
              variant="secondary"
              loading={loading}
              leftIcon={<ArrowPathIcon className="h-4 w-4" aria-hidden />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="ghost"
              leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />}
              onClick={() => {
                onClose()
                onLogout()
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

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
  navItems: NavItem[]
  loading: boolean
  onNavigate: (view: View) => void
  onRefresh: () => void
  onLogout: () => void
  children: ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePreference>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const navigateFromSidebar = (nextView: View) => {
    onNavigate(nextView)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 transition-colors duration-200 ease-out dark:bg-slate-950 dark:text-slate-100 motion-reduce:transition-none">
      <AnimatePresence>
        {mobileSidebarOpen ? (
          <motion.div
            key="mobile-sidebar"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={pageTransition}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={pageTransition}
              className="relative flex h-full w-[min(18rem,calc(100vw-1.25rem))] flex-col sm:w-[min(20rem,calc(100vw-2rem))]"
            >
              <SidebarContent
                me={me}
                view={view}
                navItems={navItems}
                collapsed={false}
                loading={loading}
                theme={theme}
                onNavigate={navigateFromSidebar}
                onClose={() => setMobileSidebarOpen(false)}
                onRefresh={onRefresh}
                onLogout={onLogout}
                onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex',
          sidebarCollapsed ? 'w-[5.5rem]' : 'w-72',
        )}
      >
        <SidebarContent
          me={me}
          view={view}
          navItems={navItems}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigate}
          onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        />
      </aside>

      <div
        className={classNames(
          'min-w-0 transition-[padding] duration-200 ease-out motion-reduce:transition-none',
          sidebarCollapsed ? 'lg:pl-[5.5rem]' : 'lg:pl-72',
        )}
      >
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors duration-200 ease-out dark:border-white/10 dark:bg-slate-950/90 motion-reduce:transition-none">
          <div className="flex min-h-14 flex-row items-center justify-between gap-3 px-3 py-2 sm:min-h-16 sm:px-6 sm:py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10 motion-reduce:transition-none motion-reduce:active:scale-100 sm:h-10 sm:w-10 lg:hidden"
                aria-label="Open navigation"
              >
                <Bars3Icon className="h-5 w-5" aria-hidden />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                  {me.organization ?? 'No organization assigned'}
                </p>
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-base">{me.fullName}</p>
              </div>
            </div>
            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              {me.roles.map((role) => <Badge key={role}>{roleLabels[role]}</Badge>)}
              <button
                type="button"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white motion-reduce:transition-none motion-reduce:active:scale-100"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" aria-hidden /> : <MoonIcon className="h-5 w-5" aria-hidden />}
              </button>
              <Button
                type="button"
                variant="secondary"
                loading={loading}
                leftIcon={<ArrowPathIcon className="h-4 w-4" aria-hidden />}
                onClick={onRefresh}
              >
                Refresh
              </Button>
              <Button
                type="button"
                variant="ghost"
                leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />}
                onClick={onLogout}
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={pageTransition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
