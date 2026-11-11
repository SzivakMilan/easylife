import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  gradient?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, gradient, children }: BottomSheetProps) {
  // Lehúzással bezárni CSAK a felső fogantyúnál lehet: ha az egész lap húzható,
  // a framer-motion elnyeli a függőleges érintést, és a tartalom nem görgethető
  // (nagyított kijelzőn / nagy betűméretnél a hosszabb űrlapok így elérhetetlenek).
  const dragControls = useDragControls()

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] border-t border-white/10 pb-[calc(env(safe-area-inset-bottom)+20px)]"
            style={{
              background: gradient ?? 'linear-gradient(180deg, #1c1c22 0%, #0a0a0c 100%)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose()
            }}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-3"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1.5 w-10 rounded-full bg-white/25" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [-webkit-overflow-scrolling:touch]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
