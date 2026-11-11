import type { HouseholdMember } from '../types/household'
import type { Member } from '../types'

export function initialsOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

export function toAvatarMember(member: HouseholdMember): Member {
  return { id: member.id, name: member.displayName, initials: initialsOf(member.displayName), color: member.avatarColor }
}
