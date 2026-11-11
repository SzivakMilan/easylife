import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { useShopping } from './ShoppingContext'

export function ShoppingPage() {
  const { items, create, setChecked, remove, clearChecked } = useShopping()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    await create(trimmed)
    setName('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Bevásárlás</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          placeholder="Új tétel (pl. Tej)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-pill bg-white px-5 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          +
        </button>
      </form>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-[15px] text-white/60">Üres a bevásárlólista.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {unchecked.map((item) => (
            <ShoppingRow key={item.id} name={item.name} checked={false} onToggle={() => setChecked(item.id, true)} onRemove={() => remove(item.id)} />
          ))}
          {checked.map((item) => (
            <ShoppingRow key={item.id} name={item.name} checked onToggle={() => setChecked(item.id, false)} onRemove={() => remove(item.id)} />
          ))}
        </Card>
      )}

      {checked.length > 0 && (
        <button onClick={clearChecked} className="text-center text-[14px] font-medium text-white/40">
          Kész tételek törlése ({checked.length})
        </button>
      )}
    </div>
  )
}

function ShoppingRow({
  name,
  checked,
  onToggle,
  onRemove,
}: {
  name: string
  checked: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3.5 first:border-t-0">
      <button
        onClick={onToggle}
        aria-label={checked ? 'Visszajelölés' : 'Kész'}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/25'
        }`}
      >
        {checked && '✓'}
      </button>
      <span className={`flex-1 truncate text-[16px] font-medium ${checked ? 'text-white/40 line-through' : 'text-white'}`}>
        {name}
      </span>
      <button onClick={onRemove} aria-label="Törlés" className="text-white/30 active:text-red-400">
        ✕
      </button>
    </div>
  )
}
