import { addMonths, isSameMonth } from 'date-fns'
import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Table, type TableColumn } from '../../components/ui/Table'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { SectionIcon } from '../../components/ui/icons'
import { formatHUF } from '../../lib/currency'
import { formatMonthYear, parseDate } from '../../lib/dateUtils'
import { useBudget } from './BudgetContext'
import { CategoryForm } from './CategoryForm'
import type { BudgetCategory } from '../../types'
import { CategoryDetailSheet } from './CategoryDetailSheet'

interface CategoryRow {
  category: BudgetCategory
  spent: number
  remaining: number
  percent: number
}

export function BudgetPage() {
  const { categories, items, loading, createCategory } = useBudget()
  const [anchorDate] = useState(() => new Date())
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const month = useMemo(() => addMonths(anchorDate, monthOffset), [anchorDate, monthOffset])

  const itemsInMonth = useMemo(
    () => items.filter((item) => isSameMonth(parseDate(item.occurredOn), month)),
    [items, month],
  )

  const rows: CategoryRow[] = categories.map((category) => {
    const spent = itemsInMonth
      .filter((i) => i.categoryId === category.id && i.type === 'expense')
      .reduce((sum, i) => sum + i.amount, 0)
    const remaining = category.monthlyLimit - spent
    const percent = category.monthlyLimit > 0 ? Math.round((spent / category.monthlyLimit) * 100) : 0
    return { category, spent, remaining, percent }
  })

  const totalExpense = rows.reduce((sum, r) => sum + r.spent, 0)
  const totalIncome = itemsInMonth.filter((i) => i.type === 'income').reduce((sum, i) => sum + i.amount, 0)
  const balance = totalIncome - totalExpense

  const columns: TableColumn<CategoryRow>[] = [
    {
      key: 'category',
      header: 'Kategória',
      render: (row) => (
        <span className="flex items-center gap-2 font-medium text-white">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${row.category.color} 25%, transparent)`, color: row.category.color }}
          >
            <SectionIcon icon={row.category.icon} />
          </span>
          {row.category.name}
        </span>
      ),
    },
    { key: 'limit', header: 'Terv', align: 'right', render: (row) => <span className="text-white/70">{formatHUF(row.category.monthlyLimit)}</span> },
    { key: 'spent', header: 'Elköltve', align: 'right', render: (row) => <span className="text-white">{formatHUF(row.spent)}</span> },
    {
      key: 'remaining',
      header: 'Maradt',
      align: 'right',
      render: (row) => (
        <span className={row.remaining < 0 ? 'font-semibold text-red-400' : 'text-white/70'}>
          {formatHUF(row.remaining)}
        </span>
      ),
    },
    {
      key: 'percent',
      header: '%',
      align: 'right',
      render: (row) => (
        <span
          className={`font-semibold ${
            row.percent > 100 ? 'text-red-400' : row.percent >= 80 ? 'text-orange-400' : 'text-white/70'
          }`}
        >
          {row.percent}%
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((v) => v - 1)}
            aria-label="Előző hónap"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/70 active:bg-white/10"
          >
            ‹
          </button>
          <span className="text-[15px] font-semibold capitalize text-white">{formatMonthYear(month)}</span>
          <button
            onClick={() => setMonthOffset((v) => v + 1)}
            aria-label="Következő hónap"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/70 active:bg-white/10"
          >
            ›
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 text-center">
          <SummaryStat label="Bevétel" value={formatHUF(totalIncome)} />
          <SummaryStat label="Kiadás" value={formatHUF(totalExpense)} />
          <SummaryStat label="Egyenleg" value={formatHUF(balance)} highlight={balance < 0} />
        </div>
      </Card>

      {categories.length === 0 && !loading ? (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-[15px] text-white/60">Még nincs költségvetési kategóriád.</p>
          <button
            onClick={() => setAddingCategory(true)}
            className="rounded-pill bg-white px-4 py-2.5 text-[14px] font-semibold text-black"
          >
            + Első kategória létrehozása
          </button>
        </Card>
      ) : (
        <Card className="p-4">
          <Table
            title="Táblázat"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.category.id}
            onRowClick={(row) => setSelectedCategory(row.category)}
          />
        </Card>
      )}

      {categories.length > 0 && (
        <button
          onClick={() => setAddingCategory(true)}
          className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10"
        >
          + Új kategória
        </button>
      )}

      <CategoryDetailSheet category={selectedCategory} onClose={() => setSelectedCategory(null)} month={month} />

      <BottomSheet open={addingCategory} onClose={() => setAddingCategory(false)}>
        <h2 className="mb-4 text-center text-[17px] font-bold text-white">Új kategória</h2>
        <CategoryForm
          submitLabel="Kategória létrehozása"
          onCancel={() => setAddingCategory(false)}
          onSubmit={async (input) => {
            await createCategory(input)
            setAddingCategory(false)
          }}
        />
      </BottomSheet>
    </div>
  )
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-2">
      <p className="text-[12px] font-medium text-white/45">{label}</p>
      <p className={`mt-0.5 text-[15px] font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
