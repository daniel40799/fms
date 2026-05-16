import type { RoleName } from '../types'

export const roles: RoleName[] = [
  'MAIN_ADMIN',
  'USER_ADMIN',
  'EVENT_ADMIN',
  'ORGANIZATION_ADMIN',
  'EXHIBITOR',
  'END_USER',
]

export const roleLabels: Record<RoleName, string> = {
  MAIN_ADMIN: 'Main Administrator',
  USER_ADMIN: 'User Administrator',
  EVENT_ADMIN: 'Event Administrator',
  ORGANIZATION_ADMIN: 'Organization Administrator',
  EXHIBITOR: 'Exhibitor',
  END_USER: 'End User',
}
