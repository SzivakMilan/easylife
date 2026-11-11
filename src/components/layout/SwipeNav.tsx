import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { Routes, useLocation, useNavigate } from 'react-router-dom'
import { adjacentSection, sectionByPath, sectionIndex } from '../../lib/sections'

const SWIPE_DISTANCE = 70
const SWIPE_VELOCITY = 500

interface SwipeNavProps {
  children: ReactNode
}

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '28%' : '-28%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-28%' : '28%', opacity: 0 }),
}

export function SwipeNav({ children }: SwipeNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const meta = sectionByPath(location.pathname)
  const currentIndex = sectionIndex(meta.key)

  const prevIndexRef = useRef(currentIndex)
  const direction = currentIndex >= prevIndexRef.current ? 1 : -1
  prevIndexRef.current = currentIndex

  function handleDragEnd(_: unknown, info: PanInfo) {
    const left = info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY
    const right = info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY
    if (left) {
      const next = adjacentSection(meta.key, 1)
      if (next) navigate(next.path)
    } else if (right) {
      const prev = adjacentSection(meta.key, -1)
      if (prev) navigate(prev.path)
    }
  }

  return (
    <motion.div
      className="relative overflow-x-hidden"
      style={{ touchAction: 'pan-y' }}
      drag="x"
      dragDirectionLock
      dragElastic={0.1}
      dragConstraints={{ left: 0, right: 0 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Routes location={location}>{children}</Routes>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
