import { motion } from 'framer-motion'

interface Segment {
  key: string
  label: string
}

interface SegmentedControlProps {
  segments: Segment[]
  value: string
  onChange: (key: string) => void
  layoutId: string
}

export function SegmentedControl({ segments, value, onChange, layoutId }: SegmentedControlProps) {
  return (
    <div className="flex items-stretch gap-1 border-b border-white/10 px-2 pb-3">
      {segments.map((segment) => {
        const active = segment.key === value
        return (
          <button
            key={segment.key}
            onClick={() => onChange(segment.key)}
            className="relative flex-1 px-2 py-1.5 text-center text-[15px] font-medium transition-colors"
          >
            <span
              className={`relative z-10 whitespace-pre-line ${active ? 'font-semibold text-white' : 'text-white/45'}`}
            >
              {segment.label}
            </span>
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-0 -bottom-3 h-0.5 rounded-full bg-white"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
