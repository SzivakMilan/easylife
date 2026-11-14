import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { formatFullDate, formatTime, parseDate, isToday } from '../../lib/dateUtils'
import { useHealth } from './HealthContext'
import type { HealthEntry, HealthEntryType } from '../../types'

type Tab = HealthEntryType

const TABS: { key: Tab; label: string }[] = [
  { key: 'food', label: 'Étkezés' },
  { key: 'drink', label: 'Ital' },
  { key: 'weight', label: 'Testsúly' },
]

export function HealthPage() {
  const { entries, create, remove } = useHealth()
  const [tab, setTab] = useState<Tab>('food')

  const tabEntries = useMemo(
    () =>
      entries
        .filter((e) => e.type === tab)
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [entries, tab],
  )

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Egészség</h2>

      <SegmentedControl
        segments={TABS}
        value={tab}
        onChange={(key) => setTab(key as Tab)}
        layoutId="health-tabs"
      />

      {tab === 'food' && (
        <FoodTab
          entries={tabEntries}
          onCreate={(note) => create({ type: 'food', note })}
          onRemove={remove}
        />
      )}
      {tab === 'drink' && (
        <DrinkTab
          entries={tabEntries}
          onCreate={(amount, note) => create({ type: 'drink', amount, note })}
          onRemove={remove}
        />
      )}
      {tab === 'weight' && (
        <WeightTab
          entries={tabEntries}
          onCreate={(amount) => create({ type: 'weight', amount })}
          onRemove={remove}
        />
      )}
    </div>
  )
}

function EntryRow({ entry, label, onRemove }: { entry: HealthEntry; label: string; onRemove: (id: string) => void }) {
  const date = parseDate(entry.occurredAt)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 first:border-t-0">
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-white">{label}</span>
        <span className="block text-[13px] text-white/45">
          {formatFullDate(date)} · {formatTime(date)}
        </span>
      </span>
      <button
        onClick={() => {
          if (window.confirm('Biztosan törlöd ezt a bejegyzést?')) onRemove(entry.id)
        }}
        aria-label="Törlés"
        className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] text-white/60 active:bg-red-500/20 active:text-red-400"
      >
        ✕
      </button>
    </div>
  )
}

function EntryList({ entries, emptyLabel, label, onRemove }: {
  entries: HealthEntry[]
  emptyLabel: string
  label: (entry: HealthEntry) => string
  onRemove: (id: string) => void
}) {
  if (entries.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <p className="text-[15px] text-white/60">{emptyLabel}</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} label={label(entry)} onRemove={onRemove} />
      ))}
    </Card>
  )
}

function FoodTab({ entries, onCreate, onRemove }: {
  entries: HealthEntry[]
  onCreate: (note: string) => Promise<void>
  onRemove: (id: string) => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = note.trim()
    if (!trimmed) return
    setBusy(true)
    await onCreate(trimmed)
    setNote('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          placeholder="Mit ettél? (pl. Zöldséges omlett)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !note.trim()}
          className="rounded-pill bg-[var(--accent)] px-5 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          +
        </button>
      </form>
      <EntryList entries={entries} emptyLabel="Még nincs rögzített étkezés." label={(e) => e.note ?? 'Étkezés'} onRemove={onRemove} />
    </div>
  )
}

const QUICK_DRINK_AMOUNTS = [200, 300, 500]

function DrinkTab({ entries, onCreate, onRemove }: {
  entries: HealthEntry[]
  onCreate: (amount: number, note?: string) => Promise<void>
  onRemove: (id: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const todayTotal = entries
    .filter((e) => isToday(parseDate(e.occurredAt)))
    .reduce((sum, e) => sum + (e.amount ?? 0), 0)

  async function handleQuickAdd(ml: number) {
    setBusy(true)
    await onCreate(ml)
    setBusy(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return
    setBusy(true)
    await onCreate(value, note.trim() || undefined)
    setAmount('')
    setNote('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 text-center">
        <p className="text-[12px] font-medium text-white/45">Mai folyadékbevitel</p>
        <p className="mt-0.5 text-[26px] font-bold text-white">{todayTotal} ml</p>
      </Card>

      <div className="flex gap-2">
        {QUICK_DRINK_AMOUNTS.map((ml) => (
          <button
            key={ml}
            type="button"
            disabled={busy}
            onClick={() => handleQuickAdd(ml)}
            className="flex-1 rounded-pill border border-white/15 bg-white/5 px-3 py-2.5 text-[14px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
          >
            +{ml} ml
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Mennyiség (ml)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
          />
          <input
            placeholder="Mi volt? (opcionális)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !amount}
          className="rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          Rögzítés
        </button>
      </form>

      <EntryList
        entries={entries}
        emptyLabel="Még nincs rögzített ital."
        label={(e) => (e.note ? `${e.amount} ml · ${e.note}` : `${e.amount} ml`)}
        onRemove={onRemove}
      />
    </div>
  )
}

function WeightTab({ entries, onCreate, onRemove }: {
  entries: HealthEntry[]
  onCreate: (amount: number) => Promise<void>
  onRemove: (id: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const latest = entries[0]
  const previous = entries[1]
  const delta = latest && previous ? Math.round(((latest.amount ?? 0) - (previous.amount ?? 0)) * 10) / 10 : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return
    setBusy(true)
    await onCreate(value)
    setAmount('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 text-center">
        <p className="text-[12px] font-medium text-white/45">Jelenlegi testsúly</p>
        <p className="mt-0.5 text-[26px] font-bold text-white">{latest ? `${latest.amount} kg` : '—'}</p>
        {delta !== null && (
          <p className={`mt-1 text-[13px] font-medium ${delta > 0 ? 'text-orange-400' : delta < 0 ? 'text-emerald-400' : 'text-white/45'}`}>
            {delta > 0 ? '+' : ''}
            {delta} kg az előző óta
          </p>
        )}
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder="Testsúly (kg)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !amount}
          className="rounded-pill bg-[var(--accent)] px-5 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          +
        </button>
      </form>

      <EntryList entries={entries} emptyLabel="Még nincs rögzített testsúly." label={(e) => `${e.amount} kg`} onRemove={onRemove} />
    </div>
  )
}
