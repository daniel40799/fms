import { useState } from 'react'
import { EventForm } from '../components/forms'
import { Page } from '../components/layout'
import { ConfirmDeleteModal, FormModal } from '../components/modals'
import { Button, EmptyState, InlineError, Panel, StatusBadge } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { formatDateTime } from '../lib/datetime'
import type { EventRecord, Organization } from '../types'

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
  onCreate,
  onUpdate,
  onArchive,
  onRegister,
}: {
  events: EventRecord[]
  organizations: Organization[]
  canManageEvents: boolean
  onCreate: (payload: Partial<EventRecord>) => Promise<void>
  onUpdate: (id: string, payload: Partial<EventRecord>) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onRegister: (eventId: string) => Promise<void>
}) {
  const [selectedItem, setSelectedItem] = useState<EventRecord | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

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

  const openDeleteModal = (item: EventRecord) => {
    setSelectedItem(item)
    setIsDeleteModalOpen(true)
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
            actionLabel="Archive event"
            description="This keeps historical registrations and attendance logs but removes the event from active use."
            isOpen={isDeleteModalOpen}
            objectName={selectedItem?.title ?? ''}
            title="Archive event"
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              if (!selectedItem) return
              await onArchive(selectedItem.id)
              setIsDeleteModalOpen(false)
              setSelectedItem(null)
            }}
          />
        </>
      )}
      <div className="mt-6 grid gap-4">
        {events.map((event) => (
          <Panel key={event.id} title={event.title} actions={<StatusBadge value={event.status} />}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-2 text-sm text-slate-600">
                <p>{event.description || 'No description provided.'}</p>
                <p><span className="font-medium text-slate-800">Venue:</span> {event.venue || 'TBA'}</p>
                <p><span className="font-medium text-slate-800">Schedule:</span> {formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}</p>
                <p><span className="font-medium text-slate-800">Registration:</span> {formatDateTime(event.registrationOpen)} to {formatDateTime(event.registrationClose)}</p>
                <p><span className="font-medium text-slate-800">Capacity:</span> {event.capacity ?? 'No limit'} {event.organizationName ? `| ${event.organizationName}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                <RegisterButton eventId={event.id} onRegister={onRegister} />
                {canManageEvents && <Button type="button" variant="secondary" onClick={() => openEditModal(event)}>Edit</Button>}
                {canManageEvents && event.status !== 'ARCHIVED' && <Button type="button" variant="danger" onClick={() => openDeleteModal(event)}>Archive</Button>}
              </div>
            </div>
          </Panel>
        ))}
        {events.length === 0 && <EmptyState message="No events have been created yet." />}
      </div>
    </Page>
  )
}
