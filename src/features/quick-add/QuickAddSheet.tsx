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
import { useShopping } from '../shopping/ShoppingContext'

export type QuickAddKind = 'deadline' | 'event' | 'bill' | 'expense' | 'shopping-item'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
  forcedKind?: QuickAddKind | null
}

const OPTIONS: { key: QuickAddKind; label: string; icon: string }[] = [
  { key: 'deadline', label: 'Határidő', icon: 'flag' },
  { key: 'event', label: 'Időpont', icon: 'calendar' },
  { key: 'bill', label: 'Számla', icon: 'receipt' },
  { key: 'expense', label: 'Kiadás', icon: 'wallet' },
  { key: 'shopping-item', label: 'Bevásárló tétel', icon: 'cart' },
]

export function QuickAddSheet({ open, onClose, forcedKind = null }: QuickAddSheetProps) {
  const [kind, setKind] = useState<QuickAddKind | null>(null)
  const { create: createDeadline } = useDeadlines()
  const { create: createEvent } = useEvents()
  const { categories, createItem } = useBudget()
  const { create: createBill } = useBills()
  const { create: createShoppingItem } = useShopping()
  const [shoppingName, setShoppingName] = useState('')

  const effectiveKind = forcedKind ?? kind

  function handleClose() {
    setKind(null)
    setShoppingName('')
    onClose()
  }

  // Ha az oldal eleve egy adott típusra korlátoz (pl. Határidők oldalon csak
  // határidő), nincs választómenü, amihez vissza lehetne lépni - ilyenkor a
  // form "Mégse" gombja egyből zárja az egész lapot.
  function handleBack() {
    if (forcedKind) handleClose()
    else setKind(null)
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      {!effectiveKind ? (
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
            Új {OPTIONS.find((o) => o.key === effectiveKind)?.label.toLowerCase()}
          </h2>
          {effectiveKind === 'deadline' && (
            <DeadlineForm
              onSubmit={async (input) => {
                await createDeadline(input)
                handleClose()
              }}
              onCancel={handleBack}
              submitLabel="Határidő létrehozása"
            />
          )}
          {effectiveKind === 'event' && (
            <EventForm
              onSubmit={async (input) => {
                await createEvent(input)
                handleClose()
              }}
              onCancel={handleBack}
              submitLabel="Időpont létrehozása"
            />
          )}
          {effectiveKind === 'expense' &&
            (categories.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-[14px] text-white/50">
                  Először hozz létre egy költségvetési kategóriát a Költségvetés oldalon.
                </p>
                <button onClick={handleBack} className="text-[14px] font-medium text-white/50">
                  Vissza
                </button>
              </div>
            ) : (
              <BudgetItemForm
                categories={categories}
                submitLabel="Tétel rögzítése"
                onCancel={handleBack}
                onSubmit={async (input) => {
                  await createItem(input)
                  handleClose()
                }}
              />
            ))}
          {effectiveKind === 'bill' && (
            <BillForm
              submitLabel="Számla rögzítése"
              onCancel={handleBack}
              onSubmit={async (input) => {
                await createBill(input)
                handleClose()
              }}
            />
          )}
          {effectiveKind === 'shopping-item' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const trimmed = shoppingName.trim()
                if (!trimmed) return
                await createShoppingItem(trimmed)
                handleClose()
              }}
              className="flex flex-col gap-3"
            >
              <input
                autoFocus
                placeholder="Tétel neve (pl. Tej)"
                value={shoppingName}
                onChange={(e) => setShoppingName(e.target.value)}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!shoppingName.trim()}
                className="mt-1 rounded-pill bg-white px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
              >
                Hozzáadás
              </button>
              <button type="button" onClick={handleBack} className="text-[14px] font-medium text-white/50">
                Mégse
              </button>
            </form>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
