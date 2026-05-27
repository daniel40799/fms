import { useState } from 'react'
import { EventDetailView, formatEventPrice, getEventPosterUrl } from '../components/events/EventDetailView'
import { EventForm } from '../components/forms'
import { Page } from '../components/layout'
import { FormModal } from '../components/modals'
import { Button, EmptyState, StatusBadge } from '../components/ui'
import { formatDateTime } from '../lib/datetime'
import type { EventPayload, EventRecord, Organization } from '../types'

export function EventsPage({
  events,
  organizations,
  canManageEvents,
  canRegister,
  onCreate,
  onUpdate,
  onArchive,
  onDelete,
  onRegister,
}: {
  events: EventRecord[]
  organizations: Organization[]
  canManageEvents: boolean
  canRegister: boolean
  onCreate: (payload: EventPayload) => Promise<void>
  onUpdate: (id: string, payload: EventPayload) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRegister: (eventId: string) => Promise<void>
}) {
  const [selectedItem, setSelectedItem] = useState<EventRecord | null>(null)
  const [selectedInfoEvent, setSelectedInfoEvent] = useState<EventRecord | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const visibleEvents = canManageEvents ? events : events.filter((event) => event.status === 'PUBLISHED')

  const openCreateModal = () => {
    setSelectedItem(null)
    setModalMode('create')
    setIsFormModalOpen(true)
  }

  const openEditModal = (item: EventRecord) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsFormModalOpen(true)
  }

  if (selectedInfoEvent && !canManageEvents) {
    return (
      <EventDetailView
        event={selectedInfoEvent}
        canRegister={canRegister}
        onBack={() => setSelectedInfoEvent(null)}
        onRegister={onRegister}
      />
    )
  }

  return (
    <Page
      title="Events"
      description="Create, publish, update, archive, and register participants for FAPOR7 events."
      actions={canManageEvents ? <Button type="button" onClick={openCreateModal}>Create event</Button> : null}
    >
      {canManageEvents && (
        <>
          <FormModal
            title={modalMode === 'create' ? 'Create event' : `Edit ${selectedItem?.title ?? 'event'}`}
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
          >
            <EventForm
              key={selectedItem?.id ?? 'new'}
              event={modalMode === 'edit' ? selectedItem : null}
              organizations={organizations}
              onCancel={() => setIsFormModalOpen(false)}
              onSubmit={async (payload) => {
                if (modalMode === 'edit' && selectedItem) await onUpdate(selectedItem.id, payload)
                else await onCreate(payload)
                setIsFormModalOpen(false)
                setSelectedItem(null)
              }}
              onArchive={modalMode === 'edit' && selectedItem?.status === 'PUBLISHED' ? async () => {
                await onArchive(selectedItem.id)
                setIsFormModalOpen(false)
                setSelectedItem(null)
              } : undefined}
              onDelete={modalMode === 'edit' && selectedItem?.status === 'DRAFT' ? async () => {
                await onDelete(selectedItem.id)
                setIsFormModalOpen(false)
                setSelectedItem(null)
              } : undefined}
            />
          </FormModal>
        </>
      )}
      <div className="mx-auto mt-6 grid max-w-6xl gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEvents.map((event) => (
          <article
            key={event.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <button
              type="button"
              className="group flex flex-1 text-left disabled:cursor-default sm:flex-col"
              disabled={canManageEvents}
              onClick={() => {
                if (!canManageEvents) setSelectedInfoEvent(event)
              }}
            >
              <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-950 sm:aspect-[4/3] sm:w-full">
                <picture className="block h-full w-full">
                  <source media="(min-width: 640px)" srcSet={getEventPosterUrl(event, 'landscape')} />
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
                    src={getEventPosterUrl(event, 'portrait')}
                    alt=""
                  />
                </picture>
                {canManageEvents && (
                  <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                    <StatusBadge value={event.status} />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                <div className="space-y-2">
                  <h3 className="line-clamp-2 text-base font-bold tracking-tight text-slate-950 dark:text-white sm:min-h-12 sm:text-lg">
                    {event.title}
                  </h3>
                  <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:line-clamp-3">
                    {event.description || 'No description provided.'}
                  </p>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 sm:mt-4 sm:space-y-2 sm:text-sm">
                  <div>
                    <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Venue: </dt>
                    <dd className="inline">{event.venue || 'TBA'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Schedule: </dt>
                    <dd className="inline">{formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}</dd>
                  </div>
                  <div className="hidden sm:block">
                    <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Registration: </dt>
                    <dd className="inline">{formatDateTime(event.registrationOpen)} to {formatDateTime(event.registrationClose)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Price: </dt>
                    <dd className="inline">{formatEventPrice(event.registrationPrice)}</dd>
                  </div>
                  <div className="hidden sm:block">
                    <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Capacity: </dt>
                    <dd className="inline">{event.capacity ?? 'No limit'} {event.organizationName ? `| ${event.organizationName}` : ''}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap items-start gap-2 pt-4 sm:pt-5">
                  {canRegister && event.status === 'PUBLISHED' && (
                    <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out group-hover:border-slate-400 group-hover:bg-slate-50 group-hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-white/20 dark:group-hover:bg-white/10">
                      Register
                    </span>
                  )}
                  {!canManageEvents && (!canRegister || event.status !== 'PUBLISHED') && (
                    <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out group-hover:border-slate-400 group-hover:bg-slate-50 group-hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-white/20 dark:group-hover:bg-white/10">
                      View details
                    </span>
                  )}
                </div>
              </div>
            </button>
            <div className="flex flex-wrap items-start gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
                {canManageEvents && event.status !== 'ARCHIVED' && <Button type="button" variant="secondary" onClick={() => openEditModal(event)}>Edit</Button>}
            </div>
          </article>
        ))}
      </div>
      {visibleEvents.length === 0 && (
        <div className="mx-auto mt-6 max-w-6xl">
          <EmptyState message="No events have been created yet." />
        </div>
      )}
    </Page>
  )
}
