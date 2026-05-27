import { QrCodeIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { Page } from '../components/layout'
import { QrCameraScanner } from '../components/qr/QrCameraScanner'
import { Button, InlineError, Panel, StatusBadge, Table } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import type { AttendanceLog, EventRecord } from '../types'

export function AttendancePage({
  logs,
  onCheckIn,
  events,
  selectedEventId,
  onSelectEvent,
  title = 'Attendance',
}: {
  logs: AttendanceLog[]
  onCheckIn: (qrToken: string) => Promise<void>
  events?: EventRecord[]
  selectedEventId?: string | null
  onSelectEvent?: (eventId: string | null) => void
  title?: string
}) {
  const [qrToken, setQrToken] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const assignedEvents = useMemo(() => events ?? [], [events])
  const todayEvents = useMemo(() => assignedEvents.filter(isEventToday), [assignedEvents])
  const selectedEvent = assignedEvents.find((event) => event.id === selectedEventId) ?? null
  const eventSelectorEnabled = Boolean(events && onSelectEvent)
  const fallbackEvent = todayEvents[0] ?? assignedEvents[0] ?? null
  const selectableEvents = todayEvents.length ? todayEvents : fallbackEvent ? [fallbackEvent] : []
  const action = useAsyncAction(async (tokenOverride?: string) => {
    const token = tokenOverride ?? qrToken
    await onCheckIn(token)
    setQrToken('')
  })

  useEffect(() => {
    if (!events || !onSelectEvent || !assignedEvents.length) return

    const hasSelectedEvent = selectedEventId && assignedEvents.some((event) => event.id === selectedEventId)
    if (todayEvents.length === 1 && selectedEventId !== todayEvents[0].id) {
      onSelectEvent(todayEvents[0].id)
      return
    }

    if (!todayEvents.length && fallbackEvent && selectedEventId !== fallbackEvent.id) {
      onSelectEvent(fallbackEvent.id)
      return
    }

    if (hasSelectedEvent || todayEvents.length !== 0) return

    onSelectEvent(null)
  }, [assignedEvents, events, fallbackEvent, onSelectEvent, selectedEventId, todayEvents])

  return (
    <Page title={title} description="Record QR-based check-ins and review attendance logs.">
      {eventSelectorEnabled ? (
        <Panel title="Assigned events">
          {assignedEvents.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectableEvents.map((event) => {
                const active = event.id === selectedEventId

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent?.(event.id)}
                    className={`rounded-lg border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:focus-visible:outline-sky-400 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                      active
                        ? 'border-sky-300 bg-sky-50 text-slate-950 shadow-sm dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-950 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(event.startDate)}</p>
                      </div>
                      <StatusBadge value={event.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{event.venue || 'TBA'}</p>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">No assigned events are available.</p>
          )}
        </Panel>
      ) : null}
      <Panel title="QR check-in">
        <QrCameraScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={(token) => {
            setQrToken(token)
            setScannerOpen(false)
            void action.run(token)
          }}
        />
        {selectedEvent ? (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <span className="font-semibold text-slate-950 dark:text-white">{selectedEvent.title}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{formatDateTime(selectedEvent.startDate)}</span>
          </div>
        ) : null}
        <div className="grid gap-3">
          <Button
            type="button"
            className="min-h-12 w-full text-base sm:w-fit"
            leftIcon={<QrCodeIcon className="h-5 w-5" aria-hidden />}
            disabled={eventSelectorEnabled && !selectedEvent}
            onClick={() => setScannerOpen(true)}
          >
            Scan QR Code
          </Button>
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => {
            event.preventDefault()
            void action.run()
          }}>
            <input className="input" value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Paste QR token" disabled={eventSelectorEnabled && !selectedEvent} required />
            <Button loading={action.loading} disabled={eventSelectorEnabled && !selectedEvent}>{action.loading ? 'Checking in...' : 'Check in'}</Button>
          </form>
        </div>
        {action.error && <InlineError message={action.error} />}
      </Panel>
      <Panel className="mt-6" title="Attendance logs">
        <Table
          columns={['Participant', 'Event', 'Checked in by', 'Time']}
          rows={logs.map((log) => [log.userFullName, log.eventTitle, log.checkedInByName, formatDateTime(log.checkedInAt)])}
          empty="No check-ins recorded."
          filterableColumns={[true, true, true, true]}
          pageSize={10}
        />
      </Panel>
    </Page>
  )
}

function isEventToday(event: EventRecord) {
  const now = new Date()
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  return start < startOfTomorrow && end >= startOfToday
}
