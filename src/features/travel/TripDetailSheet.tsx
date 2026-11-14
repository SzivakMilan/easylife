import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { ConfirmDeleteButton } from '../../components/ui/ConfirmDeleteButton'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Card } from '../../components/ui/Card'
import { AvatarStack } from '../../components/ui/Avatar'
import { AttachmentViewer } from '../../components/ui/AttachmentViewer'
import { toAvatarMember } from '../../lib/avatarMember'
import { formatFullDate, parseDate } from '../../lib/dateUtils'
import { formatHUF } from '../../lib/currency'
import { useHousehold } from '../household/HouseholdContext'
import { useTrips } from './TripsContext'
import { TripForm } from './TripForm'
import { fetchDestinationIdeas, type WikivoyageListing, type WikivoyageResult } from '../../lib/wikivoyage'
import type { Trip, TripDocument, TripExpense, TripPackingItem } from '../../types'

interface TripDetailSheetProps {
  trip: Trip | null
  onClose: () => void
}

type Mode = 'view' | 'edit'
type Tab = 'packing' | 'expenses' | 'documents' | 'ideas'

export function TripDetailSheet({ trip, onClose }: TripDetailSheetProps) {
  const { members } = useHousehold()
  const {
    trips,
    packingItems,
    expenses,
    documents,
    updateTrip,
    removeTrip,
    addPackingItem,
    togglePackingItem,
    removePackingItem,
    clearCheckedPacking,
    addExpense,
    removeExpense,
    addDocument,
    openDocument,
    removeDocument,
  } = useTrips()
  const [mode, setMode] = useState<Mode>('view')
  const [tab, setTab] = useState<Tab>('packing')
  const lastRef = useRef<Trip | null>(trip)
  if (trip) lastRef.current = trip
  const displayTrip = trip ?? lastRef.current

  function handleClose() {
    setMode('view')
    setTab('packing')
    onClose()
  }

  const live = displayTrip ? (trips.find((t) => t.id === displayTrip.id) ?? displayTrip) : null
  const participants = live ? members.filter((m) => live.participantIds.includes(m.id)) : []
  const tripPackingItems = live ? packingItems.filter((p) => p.tripId === live.id) : []
  const tripExpenses = live ? expenses.filter((e) => e.tripId === live.id) : []
  const tripDocuments = live ? documents.filter((d) => d.tripId === live.id) : []

  return (
    <BottomSheet open={Boolean(trip)} onClose={handleClose}>
      {live && mode === 'edit' && (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">Utazás szerkesztése</h2>
          <TripForm
            initial={live}
            submitLabel="Mentés"
            onCancel={() => setMode('view')}
            onSubmit={async (input) => {
              await updateTrip(live.id, input)
              setMode('view')
            }}
          />
          <div className="mt-4">
            <ConfirmDeleteButton
              label="Utazás törlése"
              question={`Biztosan törlöd a(z) „${live.name}” utazást?`}
              warning="A csomaglista, a költségek és a feltöltött dokumentumok is törlődnek."
              onConfirm={async () => {
                await removeTrip(live.id)
                handleClose()
              }}
            />
          </div>
        </div>
      )}

      {live && mode === 'view' && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold text-white">{live.name}</h2>
                {live.destination && <p className="text-[14px] text-white/60">{live.destination}</p>}
              </div>
              <button onClick={() => setMode('edit')} className="shrink-0 text-[14px] font-medium text-white/60">
                Szerkesztés
              </button>
            </div>
            <p className="mt-1 text-[13px] text-white/45">
              {formatFullDate(parseDate(live.startDate))}
              {live.endDate && ` – ${formatFullDate(parseDate(live.endDate))}`}
            </p>
            {live.note && <p className="mt-2 text-[14px] text-white/70">{live.note}</p>}
            {participants.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <AvatarStack members={participants.map(toAvatarMember)} size={26} />
                <span className="text-[13px] text-white/50">{participants.map((m) => m.displayName).join(', ')}</span>
              </div>
            )}
          </div>

          <SegmentedControl
            segments={[
              { key: 'packing', label: 'Csomaglista' },
              { key: 'expenses', label: 'Költségek' },
              { key: 'documents', label: 'Dokumentumok' },
              { key: 'ideas', label: 'Ötletek' },
            ]}
            value={tab}
            onChange={(key) => setTab(key as Tab)}
            layoutId="trip-detail-tabs"
          />

          {tab === 'packing' && (
            <PackingTab
              items={tripPackingItems}
              onAdd={(name) => addPackingItem(live.id, name)}
              onToggle={togglePackingItem}
              onRemove={removePackingItem}
              onClearChecked={() => clearCheckedPacking(live.id)}
            />
          )}
          {tab === 'expenses' && (
            <ExpensesTab
              expenses={tripExpenses}
              onAdd={(input) => addExpense({ ...input, tripId: live.id })}
              onRemove={removeExpense}
            />
          )}
          {tab === 'documents' && (
            <DocumentsTab
              documents={tripDocuments}
              onUpload={(label, file) => addDocument(live.id, label, file)}
              onOpen={openDocument}
              onRemove={removeDocument}
            />
          )}
          {tab === 'ideas' && <IdeasTab destination={live.destination} />}
        </div>
      )}
    </BottomSheet>
  )
}

function PackingTab({
  items,
  onAdd,
  onToggle,
  onRemove,
  onClearChecked,
}: {
  items: TripPackingItem[]
  onAdd: (name: string) => Promise<void>
  onToggle: (id: string, checked: boolean) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClearChecked: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    await onAdd(trimmed)
    setName('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          placeholder="Új tétel (pl. Töltő)"
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
        <div className="rounded-card border border-white/10 bg-black/20 px-4 py-6 text-center text-[14px] text-white/50">
          Üres a csomaglista.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-white/10 bg-black/20">
          {[...unchecked, ...checked].map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-t border-white/8 px-4 py-3 first:border-t-0">
              <button
                onClick={() => onToggle(item.id, !item.checked)}
                aria-label={item.checked ? 'Visszajelölés' : 'Kész'}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  item.checked ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/25'
                }`}
              >
                {item.checked && '✓'}
              </button>
              <span
                className={`flex-1 truncate text-[15px] font-medium ${
                  item.checked ? 'text-white/40 line-through' : 'text-white'
                }`}
              >
                {item.name}
              </span>
              <button onClick={() => onRemove(item.id)} aria-label="Törlés" className="text-white/30 active:text-red-400">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {checked.length > 0 && (
        <button onClick={onClearChecked} className="text-center text-[14px] font-medium text-white/40">
          Kész tételek törlése ({checked.length})
        </button>
      )}
    </div>
  )
}

function ExpensesTab({
  expenses,
  onAdd,
  onRemove,
}: {
  expenses: TripExpense[]
  onAdd: (input: { amount: number; note?: string; occurredOn: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [busy, setBusy] = useState(false)

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return
    setBusy(true)
    await onAdd({ amount: value, note: note.trim() || undefined, occurredOn })
    setAmount('')
    setNote('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4 text-center">
        <p className="text-[12px] font-medium text-white/45">Eddigi összes költség</p>
        <p className="mt-0.5 text-[22px] font-bold text-white">{formatHUF(total)}</p>
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Összeg (Ft)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
          />
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
          />
        </div>
        <input
          placeholder="Megjegyzés (opcionális)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !amount}
          className="rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          Rögzítés
        </button>
      </form>

      {expenses.length === 0 ? (
        <div className="rounded-card border border-white/10 bg-black/20 px-4 py-6 text-center text-[14px] text-white/50">
          Még nincs rögzített költség.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-white/10 bg-black/20">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 first:border-t-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-white">{expense.note ?? 'Költség'}</span>
                <span className="block text-[13px] text-white/45">{formatFullDate(parseDate(expense.occurredOn))}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-white">{formatHUF(expense.amount)}</span>
                <button
                  onClick={() => onRemove(expense.id)}
                  aria-label="Törlés"
                  className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-[16px] text-white/60 active:bg-red-500/20 active:text-red-400"
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentsTab({
  documents,
  onUpload,
  onOpen,
  onRemove,
}: {
  documents: TripDocument[]
  onUpload: (label: string, file: File) => Promise<void>
  onOpen: (document: TripDocument) => Promise<string>
  onRemove: (document: TripDocument) => Promise<void>
}) {
  const [label, setLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [viewerIsPdf, setViewerIsPdf] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await onUpload(label.trim() || file.name, file)
      setLabel('')
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nem sikerült feltölteni')
    } finally {
      setBusy(false)
    }
  }

  async function handleOpen(document: TripDocument) {
    try {
      const url = await onOpen(document)
      setViewerIsPdf(document.filePath.toLowerCase().endsWith('.pdf'))
      setViewerUrl(url)
    } catch {
      setError('Nem sikerült megnyitni a fájlt')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleUpload} className="flex flex-col gap-2">
        <input
          placeholder="Címke (pl. Repülőjegy)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white/70 file:mr-3 file:rounded-pill file:border-0 file:bg-white/15 file:px-3 file:py-1.5 file:text-white"
        />
        <button
          type="submit"
          disabled={busy || !file}
          className="rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          {busy ? 'Feltöltés...' : 'Feltöltés'}
        </button>
      </form>

      {error && <p className="text-[14px] text-red-400">{error}</p>}

      {documents.length === 0 ? (
        <div className="rounded-card border border-white/10 bg-black/20 px-4 py-6 text-center text-[14px] text-white/50">
          Még nincs feltöltött dokumentum.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-white/10 bg-black/20">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 first:border-t-0"
            >
              <button
                onClick={() => handleOpen(document)}
                className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-white"
              >
                {document.label}
              </button>
              <button onClick={() => onRemove(document)} aria-label="Törlés" className="text-white/30 active:text-red-400">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <AttachmentViewer url={viewerUrl} isPdf={viewerIsPdf} onClose={() => setViewerUrl(null)} />
    </div>
  )
}

function IdeasTab({ destination }: { destination?: string }) {
  const [result, setResult] = useState<WikivoyageResult | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!destination) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDestinationIdeas(destination)
      setResult(data)
    } catch {
      setError('Nem sikerült lekérni az ötleteket. Próbáld meg később.')
    } finally {
      setLoading(false)
    }
  }

  if (!destination) {
    return (
      <div className="rounded-card border border-white/10 bg-black/20 px-4 py-6 text-center text-[14px] text-white/50">
        Adj meg egy úti célt az utazás szerkesztésénél, hogy ötleteket kérhess.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleSearch}
        disabled={loading}
        className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
      >
        {loading ? 'Keresés...' : result === undefined ? `Ötletek kérése: ${destination}` : 'Frissítés'}
      </button>

      <p className="text-[12px] text-white/35">A tartalom a Wikivoyage-ról érkezik, angol nyelven.</p>

      {error && <p className="text-[14px] text-red-400">{error}</p>}

      {result === null && (
        <p className="text-[14px] text-white/50">
          Nem találtam ehhez az úti célhoz Wikivoyage cikket - próbáld meg egy közelebbi nagyobb város nevével.
        </p>
      )}

      {result && (
        <>
          {result.see.length === 0 && result.do.length === 0 && (
            <p className="text-[14px] text-white/50">
              Van cikk a Wikivoyage-on, de nem sikerült belőle listát kinyerni -{' '}
              <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="underline">
                nézd meg közvetlenül
              </a>
              .
            </p>
          )}
          {result.see.length > 0 && <ListingSection title="Látnivalók" items={result.see} />}
          {result.do.length > 0 && <ListingSection title="Elfoglaltságok" items={result.do} />}
          <a
            href={result.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-[13px] font-medium text-white/40"
          >
            Teljes cikk megnyitása a Wikivoyage-on
          </a>
        </>
      )}
    </div>
  )
}

function ListingSection({ title, items }: { title: string; items: WikivoyageListing[] }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">{title}</h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <Card key={i} className="p-3">
            <p className="text-[15px] font-semibold text-white">{item.name}</p>
            {item.address && <p className="text-[12px] text-white/45">{item.address}</p>}
            {item.description && <p className="mt-1 text-[13px] text-white/65">{item.description}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
