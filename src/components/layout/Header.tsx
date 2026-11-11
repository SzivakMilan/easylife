import { useState } from 'react'
import { useSection } from '../../hooks/useSection'
import { Pill } from '../ui/Pill'
import { SectionIcon } from '../ui/icons'
import { NavMenu } from './NavMenu'
import { useHousehold } from '../../features/household/HouseholdContext'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { meta, colors } = useSection()
  const { household, households } = useHousehold()

  return (
    <header className="relative z-20 flex items-center justify-between px-5 pb-2 pt-[calc(env(safe-area-inset-top)+14px)]">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold tracking-tight text-white">Otthon</h1>
        {/* Több háztartásnál látszódjon, melyik az aktív */}
        {households.length > 1 && household && (
          <p className="-mt-0.5 max-w-[45vw] truncate text-[13px] font-medium text-white/60">{household.name}</p>
        )}
      </div>
      <div className="relative">
        <Pill
          onClick={() => setMenuOpen((v) => !v)}
          className="border-[color-mix(in_srgb,var(--pill-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--pill-accent)_18%,transparent)]"
          style={{ '--pill-accent': colors.accent } as never}
          icon={<SectionIcon icon={meta.icon} />}
        >
          {meta.label}
        </Pill>
        <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentKey={meta.key} />
      </div>
    </header>
  )
}
