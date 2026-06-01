import type { AttendanceLog, EventPayload, EventRecord, FmsUser, Me, Organization, ProfilePayload, Registration, RoleName, UserAccountPayload } from '../types'
import { backendUrl } from './backendPaths'
import { ApiError, parseApiError } from './errors'

const TOKEN_KEY = 'fapor7.jwt'

export type TwoFactorChannel = 'EMAIL' | 'SMS'

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
    const response = await fetch(backendUrl(path), { ...options, headers: authHeaders(options) })
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
    const response = await fetch(backendUrl(path), { headers: authHeaders() })
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
    login: (email: string, password: string, channel?: TwoFactorChannel) =>
      request<{
        token: string | null
        twoFactorRequired: boolean
        challengeId: string | null
        channel: TwoFactorChannel | null
        maskedDestination: string | null
        expiresAt: string | null
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...(channel ? { channel } : {}) }),
      }),
    verifyTwoFactor: (challengeId: string, code: string) =>
      request<{ token: string }>('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
      }),
    resendTwoFactor: (challengeId: string) =>
      request<{
        token: string | null
        twoFactorRequired: boolean
        challengeId: string
        channel: TwoFactorChannel
        maskedDestination: string
        expiresAt: string
      }>('/api/auth/2fa/resend', {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
      }),
    register: (payload: { fullName: string; email: string; password: string; mobileNumber: string | null; organizationIds: string[]; organizationId: string | null }) =>
      request<FmsUser>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  me: () => request<Me>('/api/me'),
  updateMe: (payload: ProfilePayload) =>
    request<FmsUser>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  uploadProfilePicture: (file: File) => {
    const body = new FormData()
    body.set('file', file)
    return request<FmsUser>('/api/me/profile-picture', {
      method: 'POST',
      body,
    })
  },
  organizations: {
    list: () => request<Organization[]>('/api/organizations'),
    create: (payload: { name: string; code: string; holderIds?: string[] }) =>
      request<Organization>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: { name: string; code: string; status: string; holderIds: string[] }) =>
      request<Organization>(`/api/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>(`/api/organizations/${id}`, {
        method: 'DELETE',
      }),
  },
  users: {
    list: () => request<FmsUser[]>('/api/users'),
    create: (payload: {
      email: string
      password: string
      fullName: string
      firstName?: string | null
      middleName?: string | null
      lastName?: string | null
      birthday?: string | null
      sex?: string | null
      address?: string | null
      mobileNumber?: string | null
      prcNumber?: string | null
      organizationIds: string[]
      organizationId?: string | null
      roles: RoleName[]
    }) =>
      request<FmsUser>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: UserAccountPayload) =>
      request<FmsUser>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    importCsv: (file: File) => {
      const body = new FormData()
      body.set('file', file)
      return request<FmsUser[]>('/api/users/import', {
        method: 'POST',
        body,
      })
    },
    updateOrganizations: (id: string, organizationIds: string[]) =>
      request<FmsUser>(`/api/users/${id}/organization`, {
        method: 'PATCH',
        body: JSON.stringify({ organizationIds }),
      }),
    updateOrganization: (id: string, organizationId: string | null) =>
      request<FmsUser>(`/api/users/${id}/organization`, {
        method: 'PATCH',
        body: JSON.stringify({ organizationIds: organizationId ? [organizationId] : [] }),
      }),
    confirmOrganization: (id: string, organizationId: string) =>
      request<FmsUser>(`/api/users/${id}/organizations/${organizationId}/confirm`, {
        method: 'PATCH',
      }),
    rejectOrganization: (id: string, organizationId: string) =>
      request<FmsUser>(`/api/users/${id}/organizations/${organizationId}/reject`, {
        method: 'PATCH',
      }),
    delete: (id: string) =>
      request<void>(`/api/users/${id}`, {
        method: 'DELETE',
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
    deleteDraft: (id: string) =>
      request<void>(`/api/events/${id}`, {
        method: 'DELETE',
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
