import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import fallbackHero from '../../assets/hero.png'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { backendUrl } from '../../lib/backendPaths'
import { formatDateTime } from '../../lib/datetime'
import type { EventRecord } from '../../types'
import { Button, InlineError } from '../ui'

export function formatEventPrice(price: number) {
  return `PHP ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getEventPosterUrl(event: EventRecord, orientation: 'landscape' | 'portrait') {
  const posterUrl = orientation === 'portrait'
    ? event.verticalPosterUrl || event.horizontalPosterUrl
    : event.horizontalPosterUrl || event.verticalPosterUrl

  if (posterUrl) {
    return backendUrl(posterUrl)
  }

  if (orientation === 'portrait') {
    return fallbackHero
  }

  return fallbackHero
}

export function EventRegisterButton({
  event,
  onRegister,
}: {
  event: EventRecord
  onRegister: (eventId: string) => Promise<void>
}) {
  const action = useAsyncAction(() => onRegister(event.id))

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="min-h-11 w-full rounded-lg text-base"
        loading={action.loading}
        onClick={() => void action.run()}
      >
        Register for {formatEventPrice(event.registrationPrice)}
      </Button>
      {action.error && <InlineError message={action.error} />}
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function MetadataCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-950 dark:text-white">{value}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p> : null}
        </div>
      </div>
    </div>
  )
}

export function EventDetailView({
  event,
  canRegister,
  onBack,
  onRegister,
}: {
  event: EventRecord
  canRegister: boolean
  onBack: () => void
  onRegister: (eventId: string) => Promise<void>
}) {
  const mapSrc = event.venue
    ? `https://www.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed`
    : ''
  const mapsLink = event.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`
    : ''

  return (
    <section className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to events
          </Button>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {formatDateTime(event.startDate)}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <img
            className="aspect-[4/5] w-full rounded-[1.35rem] object-cover sm:aspect-[16/6]"
            src={getEventPosterUrl(event, 'portrait')}
            alt=""
          />
        </div>

        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {event.organizationName ?? 'FAPOR7'}
          </p>
          <h1 className="max-w-5xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {event.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
            {event.venue || 'Venue to be announced'} | {formatDateTime(event.startDate)}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetadataCard label="Date" value={formatDateTime(event.startDate)} icon={CalendarDaysIcon} />
          <MetadataCard label="Venue" value={event.venue || 'TBA'} icon={MapPinIcon} />
          <MetadataCard label="Organizer" value={event.organizationName ?? 'FAPOR7'} icon={BuildingOffice2Icon} />
          <MetadataCard
            label="Schedule"
            value={formatDateTime(event.startDate)}
            detail={`Ends ${formatDateTime(event.endDate)}`}
            icon={ClockIcon}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <DetailSection title="About this Event">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                {event.description || 'Event details will be posted soon.'}
              </p>
            </DetailSection>

            <DetailSection title="Event Details">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Starts</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatDateTime(event.startDate)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ends</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatDateTime(event.endDate)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Registration fee</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatEventPrice(event.registrationPrice)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capacity</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{event.capacity ?? 'No limit'}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Registration period</dt>
                  <dd className="mt-1 font-semibold text-slate-950 dark:text-white">
                    {formatDateTime(event.registrationOpen)} to {formatDateTime(event.registrationClose)}
                  </dd>
                </div>
              </dl>
            </DetailSection>

            <DetailSection title="Location">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {event.venue || 'Location to be announced.'}
                </p>
                {mapsLink ? (
                  <a
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-white/10 dark:focus-visible:outline-sky-400 motion-reduce:transition-none"
                    href={mapsLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in Google Maps
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                {mapSrc ? (
                  <iframe
                    className="h-80 w-full border-0 sm:h-96"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapSrc}
                    title={`${event.title} location`}
                  />
                ) : (
                  <div className="grid h-80 place-items-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Location to be announced.
                  </div>
                )}
              </div>
            </DetailSection>
          </main>

          <aside className="order-first self-start xl:order-none xl:sticky xl:top-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950 xl:block">
                <img
                  className="aspect-[3/4] w-full object-cover"
                  src={getEventPosterUrl(event, 'portrait')}
                  alt=""
                />
              </div>
              <div className="mt-1 sm:mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Registration fee</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {formatEventPrice(event.registrationPrice)}
                </p>
              </div>
              <div className="mt-4 sm:mt-5">
                {canRegister ? (
                  <EventRegisterButton event={event} onRegister={onRegister} />
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    Registration is currently unavailable.
                  </p>
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Registration is processed through your FAPOR7/FMS account and follows the event organizer's approval workflow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
