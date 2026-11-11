export interface HouseholdMember {
  id: string
  householdId: string
  userId: string
  displayName: string
  avatarColor: string
  role: 'owner' | 'member'
}

export interface ConnectedMember extends HouseholdMember {
  householdName: string
  isOwnHousehold: boolean
}

export interface Invite {
  id: string
  kind: 'member' | 'household_link'
  code: string
  expiresAt: string | null
}

export interface MyHousehold {
  id: string
  name: string
  memberId: string
  role: 'owner' | 'member'
  isActive: boolean
}
