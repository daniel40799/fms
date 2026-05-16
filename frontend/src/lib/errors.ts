export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const fallbackByStatus: Record<number, string> = {
  0: 'Network error. Check your connection and try again.',
  400: 'Please check the information and try again.',
  401: 'Your session has expired. Sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested record could not be found.',
  409: 'This change conflicts with existing data. Refresh and try again.',
  500: 'The server could not complete the request. Try again later.',
}

function extractMessage(payload: unknown): string {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload !== 'object') return ''

  const record = payload as Record<string, unknown>
  const message = record.message ?? record.error ?? record.detail
  if (Array.isArray(message)) return message.filter(Boolean).join(' ')
  if (typeof message === 'string') return message
  return ''
}

export async function parseApiError(response: Response, overrideMessage?: string) {
  let payload: unknown
  const contentType = response.headers.get('content-type') ?? ''

  try {
    payload = contentType.includes('application/json') ? await response.json() : await response.text()
  } catch {
    payload = null
  }

  const message = overrideMessage || extractMessage(payload) || fallbackByStatus[response.status] || `Request failed with status ${response.status}.`
  return new ApiError(response.status, message, payload)
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message || fallbackByStatus[error.status] || 'Request failed.'
  if (error instanceof TypeError) return fallbackByStatus[0]
  if (error instanceof Error) return error.message || 'Action failed.'
  return 'Action failed.'
}
