export interface Department {
  key: string
  name: string
  short: string
}

export interface MemberPublic {
  name: string
  initials: string
  dept?: string | null
  role?: string | null
  roles: string[]
  achievements: string[]
  member_since?: string | null
  department?: Department | null
}

export interface MemberDirectoryItem extends MemberPublic {
  zitadel_sub?: string | null
}

export interface CardPublic {
  card_id: string
  uid: string
  last_tap?: string | null
  assigned: boolean
  member?: MemberPublic | null
}

export interface CardAdmin extends CardPublic {
  assigned_zitadel_sub?: string | null
}

export interface DirectoryUser {
  id: string
  name: string
  email: string
  verified: boolean
}

export interface MemberMe {
  name: string
  email: string
  initials: string
  dept?: string | null
  role?: string | null
  roles: string[]
  is_admin: boolean
  achievements: string[]
  card?: CardPublic | null
}

export interface AppPublic {
  app_id: string
  name: string
  desc?: string | null
  category: string
  dept?: string | null
  icon: string
  url?: string | null
  enabled: boolean
}

export interface AppCreate {
  app_id: string
  name: string
  desc?: string | null
  category: string
  dept?: string | null
  icon: string
  url?: string | null
  enabled: boolean
}

export interface AppUpdate {
  name?: string
  desc?: string | null
  category?: string
  dept?: string | null
  icon?: string
  url?: string | null
  enabled?: boolean
}

export const DEPARTMENTS: Department[] = [
  { key: 'mainboard', name: 'Mainboards', short: 'Mainboard' },
  { key: 'techops', name: 'Technical Operations', short: 'Tech Ops' },
  { key: 'multimedia', name: 'Multimedia & Communications', short: 'Multimedia' },
  { key: 'entrepreneur', name: 'Entrepreneurship', short: 'Entrepreneur.' },
  { key: 'internal', name: 'Internal Affairs', short: 'Internal' },
]

export const ROLE_SHORT: Record<string, string> = {
  member: 'Member',
  mainboards: 'Mainboards',
  techops: 'Tech Ops',
  mulcom: 'Multimedia',
  Inter: 'Internal',
  entrep: 'Entrepreneur.',
  super_admin: 'Admin',
}
