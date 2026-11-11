import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useSection } from '../../hooks/useSection'
import { sectionPageGradient } from '../../lib/sections'

export function SectionBackground() {
  const { meta, colors } = useSection()

  // Elsődleges gombok / kiválasztott buborékok színe: bg-[var(--accent)]
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', colors.accent)
  }, [colors.accent])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505]">
      <AnimatePresence>
        <motion.div
          key={meta.key}
          className="absolute inset-0"
          style={{ background: sectionPageGradient(colors.accent) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </AnimatePresence>
    </div>
  )
}
