import { BottomSheet } from '../../components/ui/BottomSheet'

interface AboutSheetProps {
  open: boolean
  onClose: () => void
}

export function AboutSheet({ open, onClose }: AboutSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-1 text-center text-[17px] font-bold text-white">Otthon</h2>
      <p className="mb-4 text-center text-[13px] text-white/40">v1.0</p>
      <p className="text-center text-[15px] text-white/70">
        Egy hely a család hétköznapi ügyeinek: határidők, időpontok, költségvetés és számlák.
      </p>
    </BottomSheet>
  )
}
