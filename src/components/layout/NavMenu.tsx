import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { GearIcon, SearchIcon, SectionIcon } from '../ui/icons'
import { SECTIONS } from '../../lib/sections'
import { toAvatarMember } from '../../lib/avatarMember'
import { useHousehold } from '../../features/household/HouseholdContext'
import type { SectionKey } from '../../types'

interface NavMenuProps {
  open: boolean
  onClose: () => void
  currentKey: SectionKey
}

export function NavMenu({ open, onClose, currentKey }: NavMenuProps) {
  const { myMember, households, switchHousehold, setAddingHousehold } = useHousehold()

  async function handleSwitch(id: string, isActive: boolean) {
    onClose()
    if (!isActive) await switchHousehold(id)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[calc(100dvh-env(safe-area-inset-top)-80px)] w-[260px] overflow-y-auto overscroll-contain rounded-[22px] border border-white/15 bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              {myMember && <Avatar member={toAvatarMember(myMember)} size={34} />}
              <button className="flex items-center gap-1.5 text-[15px] font-medium text-white/85">
                <GearIcon />
                Szerkesztés
              </button>
            </div>
            <div className="h-px bg-white/10" />
            {/* Háztartás-váltó */}
            <div className="flex flex-col gap-0.5 p-2">
              <p className="px-3 pb-1 pt-1 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                Háztartások
              </p>
              {households.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSwitch(h.id, h.isActive)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
                    h.isActive ? 'bg-white/15 text-white' : 'text-white/85 active:bg-white/10'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                      h.isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-black' : 'border-white/30'
                    }`}
                  >
                    {h.isActive ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{h.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  setAddingHousehold(true)
                }}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] font-medium text-white/70 active:bg-white/10"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[18px] leading-none">+</span>
                Háztartás hozzáadása
              </button>
            </div>
            <div className="h-px bg-white/10" />
            <nav className="flex flex-col gap-0.5 p-2">
              <Link
                to="/kereses"
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium text-white/85 active:bg-white/10"
              >
                <SearchIcon />
                Keresés
              </Link>
              {SECTIONS.map((section) => {
                const active = section.key === currentKey
                return (
                  <Link
                    key={section.key}
                    to={section.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      active ? 'bg-white/15 text-white' : 'text-white/85 active:bg-white/10'
                    }`}
                  >
                    <SectionIcon icon={section.icon} className="shrink-0 text-white/70" />
                    {section.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
