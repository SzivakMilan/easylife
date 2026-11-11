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
  const { myMember } = useHousehold()

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
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-[22px] border border-white/15 bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-2xl"
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
