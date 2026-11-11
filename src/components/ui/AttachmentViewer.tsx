import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface AttachmentViewerProps {
  url: string | null
  isPdf: boolean
  onClose: () => void
}

export function AttachmentViewer({ url, isPdf, onClose }: AttachmentViewerProps) {
  return createPortal(
    <AnimatePresence>
      {url && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex justify-end px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[20px] text-white active:bg-white/20"
            >
              ✕
            </button>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
            onClick={onClose}
          >
            {isPdf ? (
              <iframe
                src={url}
                title="Melléklet"
                className="h-full w-full rounded-card border border-white/10 bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={url}
                alt="Melléklet"
                className="max-h-full max-w-full rounded-card border border-white/10 object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
