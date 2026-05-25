import { useState } from 'react'
import fallbackHero from '../assets/hero.png'
import { EventForm } from '../components/forms'
import { Page } from '../components/layout'
import { ConfirmDeleteModal, FormModal } from '../components/modals'
import { Button, EmptyState, InlineError, StatusBadge } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import type { EventPayload, EventRecord, Organization } from '../types'

function RegisterButton({ eventId, onRegister }: { eventId: string; onRegister: (eventId: string) => Promise<void> }) {
  const action = useAsyncAction(() => onRegister(eventId))
  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" loading={action.loading} onClick={() => void action.run()}>Register</Button>
      {action.error && <InlineError message={action.error} />}
    </div>
  )
}

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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete'>('archive')
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

  const openConfirmModal = (item: EventRecord, action: 'archive' | 'delete') => {
    setSelectedItem(item)
    setConfirmAction(action)
    setIsConfirmModalOpen(true)
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
            />
          </FormModal>
          <ConfirmDeleteModal
            actionLabel={confirmAction === 'archive' ? 'Archive event' : 'Delete draft'}
            description={confirmAction === 'archive'
              ? 'This keeps historical registrations and attendance logs but removes the event from active use.'
              : 'This permanently removes the draft before it is published.'}
            isOpen={isConfirmModalOpen}
            objectName={selectedItem?.title ?? ''}
            title={confirmAction === 'archive' ? 'Archive event' : 'Delete draft event'}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={async () => {
              if (!selectedItem) return
              if (confirmAction === 'archive') await onArchive(selectedItem.id)
              else await onDelete(selectedItem.id)
              setIsConfirmModalOpen(false)
              setSelectedItem(null)
            }}
          />
        </>
      )}
      <div className="mx-auto mt-6 grid max-w-6xl gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEvents.map((event) => (
          <article
            key={event.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-950">
              <img
                className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
                src={event.horizontalPosterUrl || event.verticalPosterUrl || fallbackHero}
                alt=""
              />
              {canManageEvents && (
                <div className="absolute left-3 top-3">
                  <StatusBadge value={event.status} />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="space-y-2">
                <h3 className="line-clamp-2 min-h-12 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                  {event.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {event.description || 'No description provided.'}
                </p>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Venue: </dt>
                  <dd className="inline">{event.venue || 'TBA'}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Schedule: </dt>
                  <dd className="inline">{formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Registration: </dt>
                  <dd className="inline">{formatDateTime(event.registrationOpen)} to {formatDateTime(event.registrationClose)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Price: </dt>
                  <dd className="inline">PHP {event.registrationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-100">Capacity: </dt>
                  <dd className="inline">{event.capacity ?? 'No limit'} {event.organizationName ? `| ${event.organizationName}` : ''}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap items-start gap-2 pt-5">
                {canRegister && event.status === 'PUBLISHED' && <RegisterButton eventId={event.id} onRegister={onRegister} />}
                {canManageEvents && event.status !== 'ARCHIVED' && <Button type="button" variant="secondary" onClick={() => openEditModal(event)}>Edit</Button>}
                {canManageEvents && event.status === 'PUBLISHED' && <Button type="button" variant="danger" onClick={() => openConfirmModal(event, 'archive')}>Archive</Button>}
                {canManageEvents && event.status === 'DRAFT' && <Button type="button" variant="danger" onClick={() => openConfirmModal(event, 'delete')}>Delete</Button>}
              </div>
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
