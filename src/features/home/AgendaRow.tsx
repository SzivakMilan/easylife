import { AvatarStack } from '../../components/ui/Avatar'
import { SectionIcon } from '../../components/ui/icons'
import { TYPE_META } from '../../lib/sections'
import { toAvatarMember } from '../../lib/avatarMember'
import { useHousehold } from '../household/HouseholdContext'
import type { AgendaItem } from '../../types'

interface AgendaRowProps {
  item: AgendaItem
  onClick: () => void
}

export function AgendaRow({ item, onClick }: AgendaRowProps) {
  const { members: householdMembers } = useHousehold()
  const meta = TYPE_META[item.type]
  const members = item.assigneeIds
    .map((id) => householdMembers.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map(toAvatarMember)

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-t border-white/8 px-4 py-3 text-left first:border-t-0 active:bg-white/5"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${meta.accent} 22%, transparent)`, color: meta.accent }}
      >
        <SectionIcon icon={meta.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-white/40">
          {item.label}
        </span>
        <span className="block truncate text-[16px] font-semibold text-white">{item.title}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-[15px] font-semibold text-white">{item.value}</span>
        <AvatarStack members={members} size={22} />
      </span>
    </button>
  )
}
