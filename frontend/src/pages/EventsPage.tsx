import { useState } from 'react'
import { EventForm } from '../components/forms'
import { Page } from '../components/layout'
import { ConfirmDeleteModal, FormModal } from '../components/modals'
import { Button, EmptyState, InlineError, Panel, StatusBadge } from '../components/ui'
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
      <div className="mt-6 grid gap-4">
        {visibleEvents.map((event) => (
          <Panel key={event.id} title={event.title} actions={<StatusBadge value={event.status} />}>
            <div className="grid gap-4 md:grid-cols-[112px_1fr] lg:grid-cols-[112px_1fr_auto]">
              <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
                {event.verticalPosterUrl ? (
                  <img className="h-full w-full object-cover" src={event.verticalPosterUrl} alt="" />
                ) : null}
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{event.description || 'No description provided.'}</p>
                <p><span className="font-medium text-slate-800">Venue:</span> {event.venue || 'TBA'}</p>
                <p><span className="font-medium text-slate-800">Schedule:</span> {formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}</p>
                <p><span className="font-medium text-slate-800">Registration:</span> {formatDateTime(event.registrationOpen)} to {formatDateTime(event.registrationClose)}</p>
                <p><span className="font-medium text-slate-800">Price:</span> PHP {event.registrationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><span className="font-medium text-slate-800">Capacity:</span> {event.capacity ?? 'No limit'} {event.organizationName ? `| ${event.organizationName}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                {canRegister && event.status === 'PUBLISHED' && <RegisterButton eventId={event.id} onRegister={onRegister} />}
                {canManageEvents && event.status !== 'ARCHIVED' && <Button type="button" variant="secondary" onClick={() => openEditModal(event)}>Edit</Button>}
                {canManageEvents && event.status === 'PUBLISHED' && <Button type="button" variant="danger" onClick={() => openConfirmModal(event, 'archive')}>Archive</Button>}
                {canManageEvents && event.status === 'DRAFT' && <Button type="button" variant="danger" onClick={() => openConfirmModal(event, 'delete')}>Delete</Button>}
              </div>
            </div>
          </Panel>
        ))}
        {visibleEvents.length === 0 && <EmptyState message="No events have been created yet." />}
      </div>
    </Page>
  )
}
