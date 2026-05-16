import { format, isValid, parseISO } from 'date-fns'

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function parseApiDateTime(value: string | null | undefined) {
  if (!value) return null
  const parsed = parseISO(value)
  if (isValid(parsed)) return parsed
  const fallback = new Date(value)
  return isValid(fallback) ? fallback : null
}

export function toLocalDateTimePayload(date: Date | null): string | null {
  return date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : null
}
