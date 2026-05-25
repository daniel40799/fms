export type RoleName =
  | 'MAIN_ADMIN'
  | 'USER_ADMIN'
  | 'EVENT_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'EXHIBITOR'
  | 'END_USER'

export interface Me {
  id: string
  email: string
  fullName: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  birthday: string | null
  sex: string | null
  address: string | null
  mobileNumber: string | null
  prcNumber: string | null
  profileImageUrl: string | null
  status: string
  organizationId: string | null
  organization: string | null
  organizationCode: string | null
  roles: RoleName[]
}

export interface Organization {
  id: string
  name: string
  code: string
  status: string
}

export interface FmsUser {
  id: string
  email: string
  fullName: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  birthday: string | null
  sex: string | null
  address: string | null
  mobileNumber: string | null
  prcNumber: string | null
  profileImageUrl: string | null
  status: string
  organizationId: string | null
  organizationName: string | null
  roles: RoleName[]
}

export interface EventRecord {
  id: string
  title: string
  description: string
  venue: string
  startDate: string
  endDate: string
  capacity: number | null
  registrationOpen: string | null
  registrationClose: string | null
  registrationPrice: number
  horizontalPosterUrl: string | null
  verticalPosterUrl: string | null
  status: string
  organizationId: string | null
  organizationName: string | null
  createdById: string
  createdByName: string
}

export interface EventPayload {
  title: string
  description: string
  venue: string
  startDate: string
  endDate: string
  capacity: number | null
  registrationOpen: string | null
  registrationClose: string | null
  registrationPrice: number
  horizontalPosterUrl: string
  verticalPosterUrl: string
  organizationId: string | null
  status?: 'DRAFT' | 'PUBLISHED'
}

export interface ProfilePayload {
  fullName?: string
  firstName: string
  middleName: string | null
  lastName: string
  birthday: string | null
  sex: string | null
  address: string | null
  mobileNumber: string | null
  prcNumber: string | null
}

export interface Registration {
  id: string
  eventId: string
  eventTitle: string
  userId: string
  userFullName: string
  status: string
  registeredAt: string
  paymentReference: string | null
  paymentFilePath: string | null
  paymentUploadedAt: string | null
  approvedById: string | null
  approvedByName: string | null
  approvedAt: string | null
  remarks: string | null
  qrToken: string | null
  qrGeneratedAt: string | null
}

export interface AttendanceLog {
  id: string
  registrationId: string
  eventId: string
  eventTitle: string
  userId: string
  userFullName: string
  checkedInById: string
  checkedInByName: string
  checkedInAt: string
}

export type View =
  | 'dashboard'
  | 'profile'
  | 'events'
  | 'my-registrations'
  | 'registrations'
  | 'attendance'
  | 'users'
  | 'organizations'
  | 'reports'
