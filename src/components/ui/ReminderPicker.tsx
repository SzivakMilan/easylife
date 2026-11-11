import { REMINDER_OPTIONS } from '../../lib/reminderOptions'

interface ReminderPickerProps {
  value: number[]
  onChange: (value: number[]) => void
}

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  function toggle(offset: number) {
    onChange(value.includes(offset) ? value.filter((v) => v !== offset) : [...value, offset])
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-white/50">Emlékeztess</p>
      <div className="flex flex-wrap gap-2">
        {REMINDER_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
              value.includes(o.value)
                ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                : 'border-white/15 bg-white/5 text-white/80'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.length === 0 && <p className="mt-1.5 text-[12px] text-white/35">Nincs emlékeztető</p>}
    </div>
  )
}
