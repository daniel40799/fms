import type { AttendanceLog, EventPayload, EventRecord, FmsUser, Me, Organization, Registration, RoleName } from '../types'
import { ApiError, parseApiError } from './errors'

const TOKEN_KEY = 'fapor7.jwt'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

function authHeaders(options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = tokenStore.get()

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(path, { ...options, headers: authHeaders(options) })
    if (!response.ok) {
      throw await parseApiError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Network error. Check your connection and try again.')
  }
}

async function download(path: string, forbiddenMessage?: string) {
  try {
    const response = await fetch(path, { headers: authHeaders() })
    if (!response.ok) {
      throw await parseApiError(response, response.status === 403 ? forbiddenMessage : undefined)
    }

    return response.blob()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Network error. Check your connection and try again.')
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (payload: { fullName: string; email: string; password: string; organizationId: string | null }) =>
      request<FmsUser>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  me: () => request<Me>('/api/me'),
  organizations: {
    list: () => request<Organization[]>('/api/organizations'),
    create: (payload: { name: string; code: string }) =>
      request<Organization>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  users: {
    list: () => request<FmsUser[]>('/api/users'),
    create: (payload: {
      email: string
      password: string
      fullName: string
      organizationId: string | null
      roles: RoleName[]
    }) =>
      request<FmsUser>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  events: {
    list: () => request<EventRecord[]>('/api/events'),
    create: (payload: EventPayload) =>
      request<EventRecord>('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: EventPayload) =>
      request<EventRecord>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    archive: (id: string) =>
      request<EventRecord>(`/api/events/${id}/archive`, {
        method: 'PATCH',
      }),
  },
  registrations: {
    create: (eventId: string) =>
      request<Registration>('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      }),
    mine: () => request<Registration[]>('/api/registrations/me'),
    list: () => request<Registration[]>('/api/registrations'),
    approve: (id: string, remarks: string) =>
      request<Registration>(`/api/registrations/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks }),
      }),
    downloadPaymentProof: (id: string) =>
      download(`/api/registrations/${id}/payment-proof`, 'You do not have permission to view this payment proof.'),
    uploadPayment: (id: string, paymentReference: string, file: File) => {
      const body = new FormData()
      body.set('paymentReference', paymentReference)
      body.set('file', file)
      return request<Registration>(`/api/registrations/${id}/payment`, {
        method: 'POST',
        body,
      })
    },
  },
  attendance: {
    list: () => request<AttendanceLog[]>('/api/attendance'),
    checkIn: (qrToken: string) =>
      request<AttendanceLog>('/api/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ qrToken }),
      }),
  },
}
