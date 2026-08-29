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
  achievements: string[]
  member_since?: string | null
  department?: Department | null
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
  is_admin: boolean
  achievements: string[]
  card?: CardPublic | null
}
