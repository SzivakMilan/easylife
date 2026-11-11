import type { Member } from '../../types'

interface AvatarProps {
  member: Member
  size?: number
}

export function Avatar({ member, size = 24 }: AvatarProps) {
  return (
    <span
      title={member.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/20"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        backgroundColor: member.color,
      }}
    >
      {member.initials}
    </span>
  )
}

export function AvatarStack({ members, size = 24 }: { members: Member[]; size?: number }) {
  if (members.length === 0) return null
  return (
    <span className="flex items-center" style={{ marginRight: -size * 0.3 }}>
      {members.map((m, i) => (
        <span key={m.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: members.length - i }}>
          <Avatar member={m} size={size} />
        </span>
      ))}
    </span>
  )
}
