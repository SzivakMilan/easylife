import { isSameMonth } from 'date-fns'
import { useRef, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { formatHUF } from '../../lib/currency'
import { formatFullDate, parseDate } from '../../lib/dateUtils'
import { SectionIcon } from '../../components/ui/icons'
import { useBudget } from './BudgetContext'
import { CategoryForm } from './CategoryForm'
import { BudgetItemForm } from './BudgetItemForm'
import type { BudgetCategory } from '../../types'

interface CategoryDetailSheetProps {
  category: BudgetCategory | null
  onClose: () => void
  month: Date
}

type Mode = 'view' | 'edit-category' | 'add-item'

export function CategoryDetailSheet({ category, onClose, month }: CategoryDetailSheetProps) {
  const { categories, items, updateCategory, createItem, deleteItem } = useBudget()
  const [mode, setMode] = useState<Mode>('view')
  const lastRef = useRef<BudgetCategory | null>(category)
  if (category) lastRef.current = category
  const displayCategory = category ?? lastRef.current

  function handleClose() {
    setMode('view')
    onClose()
  }

  const live = displayCategory ? categories.find((c) => c.id === displayCategory.id) ?? displayCategory : null

  const gradient = live
    ? `linear-gradient(170deg, color-mix(in srgb, ${live.color} 55%, #0a0a0c) 0%, #0a0a0c 65%)`
    : undefined

  const itemsInMonth = live
    ? items.filter((i) => i.categoryId === live.id && isSameMonth(parseDate(i.occurredOn), month))
    : []
  const spent = itemsInMonth.filter((i) => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0)
  const remaining = live ? live.monthlyLimit - spent : 0
  const sorted = [...itemsInMonth].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))

  return (
    <BottomSheet open={Boolean(category)} onClose={handleClose} gradient={gradient}>
      {live && mode === 'edit-category' && (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">Kategória szerkesztése</h2>
          <CategoryForm
            initial={live}
            submitLabel="Mentés"
            onCancel={() => setMode('view')}
            onSubmit={async (input) => {
              await updateCategory(live.id, input)
              setMode('view')
            }}
          />
        </div>
      )}

      {live && mode === 'add-item' && (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">Új tétel</h2>
          <BudgetItemForm
            categories={categories}
            defaultType="expense"
            submitLabel="Tétel rögzítése"
            onCancel={() => setMode('view')}
            onSubmit={async (input) => {
              await createItem({ ...input, categoryId: live.id })
              setMode('view')
            }}
          />
        </div>
      )}

      {live && mode === 'view' && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${live.color} 28%, transparent)`, color: live.color }}
                >
                  <SectionIcon icon={live.icon} />
                </span>
                <h2 className="text-[20px] font-bold text-white">{live.name}</h2>
              </div>
              <button onClick={() => setMode('edit-category')} className="text-[14px] font-medium text-white/60">
                Szerkesztés
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 text-center">
              <Stat label="Terv" value={formatHUF(live.monthlyLimit)} />
              <Stat label="Elköltve" value={formatHUF(spent)} />
              <Stat label="Maradt" value={formatHUF(remaining)} highlight={remaining < 0} />
            </div>
          </div>

          <button
            onClick={() => setMode('add-item')}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10"
          >
            + Tétel hozzáadása
          </button>

          <div>
            <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">Tételek</h3>
            {sorted.length === 0 ? (
              <div className="rounded-card border border-white/10 bg-black/20 px-4 py-8 text-center text-[15px] text-white/60">
                Nincs rögzített tétel ebben a hónapban
              </div>
            ) : (
              <div className="overflow-hidden rounded-card border border-white/10 bg-black/20">
                {sorted.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 first:border-t-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-white">
                        {item.note ?? (item.type === 'income' ? 'Bevétel' : 'Kiadás')}
                      </span>
                      <span className="block text-[13px] text-white/45">{formatFullDate(parseDate(item.occurredOn))}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={item.type === 'income' ? 'text-emerald-400' : 'text-white'}>
                        {item.type === 'income' ? '+' : '−'}
                        {formatHUF(item.amount)}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        aria-label="Törlés"
                        className="text-white/30 active:text-red-400"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-2">
      <p className="text-[12px] font-medium text-white/45">{label}</p>
      <p className={`mt-0.5 text-[15px] font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
