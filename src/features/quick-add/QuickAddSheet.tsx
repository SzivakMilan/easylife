import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { SectionIcon } from '../../components/ui/icons'
import { DeadlineForm } from '../deadlines/DeadlineForm'
import { useDeadlines } from '../deadlines/DeadlinesContext'
import { EventForm } from '../events/EventForm'
import { useEvents } from '../events/EventsContext'
import { BudgetItemForm } from '../budget/BudgetItemForm'
import { useBudget } from '../budget/BudgetContext'
import { BillForm } from '../bills/BillForm'
import { useBills } from '../bills/BillsContext'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
}

type QuickAddKind = 'deadline' | 'event' | 'bill' | 'expense'

const OPTIONS: { key: QuickAddKind; label: string; icon: string }[] = [
  { key: 'deadline', label: 'Határidő', icon: 'flag' },
  { key: 'event', label: 'Időpont', icon: 'calendar' },
  { key: 'bill', label: 'Számla', icon: 'receipt' },
  { key: 'expense', label: 'Kiadás', icon: 'wallet' },
]

export function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const [kind, setKind] = useState<QuickAddKind | null>(null)
  const { create: createDeadline } = useDeadlines()
  const { create: createEvent } = useEvents()
  const { categories, createItem } = useBudget()
  const { create: createBill } = useBills()

  function handleClose() {
    setKind(null)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      {!kind ? (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">Mit szeretnél hozzáadni?</h2>
          <div className="flex flex-col gap-2">
            {OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setKind(option.key)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-[16px] font-semibold text-white active:bg-white/10"
              >
                <SectionIcon icon={option.icon} className="text-white/70" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">
            Új {OPTIONS.find((o) => o.key === kind)?.label.toLowerCase()}
          </h2>
          {kind === 'deadline' && (
            <DeadlineForm
              onSubmit={async (input) => {
                await createDeadline(input)
                handleClose()
              }}
              onCancel={() => setKind(null)}
              submitLabel="Határidő létrehozása"
            />
          )}
          {kind === 'event' && (
            <EventForm
              onSubmit={async (input) => {
                await createEvent(input)
                handleClose()
              }}
              onCancel={() => setKind(null)}
              submitLabel="Időpont létrehozása"
            />
          )}
          {kind === 'expense' &&
            (categories.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-[14px] text-white/50">
                  Először hozz létre egy költségvetési kategóriát a Költségvetés oldalon.
                </p>
                <button onClick={() => setKind(null)} className="text-[14px] font-medium text-white/50">
                  Vissza
                </button>
              </div>
            ) : (
              <BudgetItemForm
                categories={categories}
                submitLabel="Tétel rögzítése"
                onCancel={() => setKind(null)}
                onSubmit={async (input) => {
                  await createItem(input)
                  handleClose()
                }}
              />
            ))}
          {kind === 'bill' && (
            <BillForm
              submitLabel="Számla rögzítése"
              onCancel={() => setKind(null)}
              onSubmit={async (input) => {
                await createBill(input)
                handleClose()
              }}
            />
          )}
        </div>
      )}
    </BottomSheet>
  )
}
