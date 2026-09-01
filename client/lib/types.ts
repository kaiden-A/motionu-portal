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
  is_active?: boolean
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
  caps: string[]
  achievements: string[]
  card?: CardPublic | null
}

export const CAPS = {
  manageUsers: 'manage_users',
  manageCards: 'manage_cards',
  manageNews: 'manage_news',
  manageApps: 'manage_apps',
  manageAchievements: 'manage_achievements',
} as const

export interface AppPublic {
  app_id: string
  name: string
  desc?: string | null
  icon: string
  url?: string | null
  enabled: boolean
}

export interface AppCreate {
  name: string
  desc?: string | null
  icon: string
  url?: string | null
  enabled: boolean
}

export interface AppUpdate {
  name?: string
  desc?: string | null
  icon?: string
  url?: string | null
  enabled?: boolean
}

export interface Achievement {
  key: string
  label: string
  desc?: string | null
  icon: string
  enabled: boolean
}

export interface AchievementCreate {
  label: string
  desc?: string | null
  icon: string
}

export interface AchievementUpdate {
  label?: string
  desc?: string | null
  icon?: string
  enabled?: boolean
}

export interface NewsItem {
  id: number
  title: string
  body: string
  author_name: string
  dept?: string | null
  pinned: boolean
  published_at: string
  created_at: string
  updated_at: string
}

export interface NewsCreate {
  title: string
  body: string
  dept?: string | null
  pinned?: boolean
}

export interface NewsUpdate {
  title?: string
  body?: string
  dept?: string | null
  pinned?: boolean
}

export interface PortalEvent {
  id: number
  title: string
  description?: string | null
  location?: string | null
  starts_at: string
  ends_at?: string | null
  dept?: string | null
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface EventCreate {
  title: string
  description?: string | null
  location?: string | null
  starts_at: string
  ends_at?: string | null
  dept?: string | null
}

export interface EventUpdate {
  title?: string
  description?: string | null
  location?: string | null
  starts_at?: string
  ends_at?: string | null
  dept?: string | null
}

export interface PortalUser {
  id: string
  name: string
  email: string
  verified: boolean
  active: boolean
  roles: string[]
  dept?: string | null
  card_id?: string | null
  in_portal: boolean
}

export interface PortalUserCreate {
  name: string
  email: string
  roles: string[]
}

export interface PortalUserUpdate {
  name?: string
  email?: string
  roles?: string[]
}

export const ROLE_KEYS = [
  'member',
  'mainboards',
  'techops',
  'mulcom',
  'Inter',
  'entrep',
]

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
