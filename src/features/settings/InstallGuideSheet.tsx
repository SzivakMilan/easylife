import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { detectPlatform, type Platform } from '../../lib/platform'

interface InstallGuideSheetProps {
  open: boolean
  onClose: () => void
}

const TABS: { key: Platform; label: string }[] = [
  { key: 'ios', label: 'iPhone' },
  { key: 'android', label: 'Android' },
]

export function InstallGuideSheet({ open, onClose }: InstallGuideSheetProps) {
  const [platform, setPlatform] = useState<Platform>(() => {
    const detected = detectPlatform()
    return detected === 'desktop' ? 'ios' : detected
  })

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-1 text-center text-[17px] font-bold text-white">Telepítés a kezdőképernyőre</h2>
      <p className="mb-4 text-center text-[14px] text-white/50">
        Telepítve az Otthon úgy működik, mint egy sima app - gyorsabb indulás, és a push értesítések is csak így
        működnek iOS-en.
      </p>

      <div className="mb-4 flex gap-1 rounded-pill border border-white/10 bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPlatform(t.key)}
            className={`flex-1 rounded-pill py-2 text-[13px] font-semibold transition-colors ${
              platform === t.key ? 'bg-white text-black' : 'text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {platform === 'ios' ? (
        <Steps
          steps={[
            { icon: <ShareIcon />, text: 'Nyisd meg az oldalt Safariban, majd koppints a Megosztás ikonra' },
            { icon: <PlusSquareIcon />, text: '"Kezdőképernyőhöz adás" a listából' },
            { icon: <CheckIcon />, text: 'Koppints a "Hozzáadás" gombra - kész, megjelenik az ikon a kezdőképernyőn' },
          ]}
        />
      ) : (
        <Steps
          steps={[
            { icon: <DotsIcon />, text: 'Nyisd meg az oldalt Chrome-ban, majd koppints a jobb felső ⋮ menüre' },
            { icon: <PlusSquareIcon />, text: '"Telepítés" vagy "Hozzáadás a kezdőképernyőhöz"' },
            { icon: <CheckIcon />, text: 'Erősítsd meg - kész, megjelenik az ikon a kezdőképernyőn' },
          ]}
        />
      )}
    </BottomSheet>
  )
}

function Steps({ steps }: { steps: { icon: React.ReactNode; text: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80">
            {step.icon}
          </span>
          <span className="pt-1.5 text-[14px] text-white/80">
            <span className="mr-1.5 font-bold text-white">{i + 1}.</span>
            {step.text}
          </span>
        </div>
      ))}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

function PlusSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 13 4 4 10-10" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5.5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="18.5" r="1.8" />
    </svg>
  )
}
