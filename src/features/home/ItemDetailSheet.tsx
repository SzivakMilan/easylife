import { useRef, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { AttachmentViewer } from '../../components/ui/AttachmentViewer'
import { AvatarStack } from '../../components/ui/Avatar'
import { formatHUF } from '../../lib/currency'
import { formatFullDate, parseDate, formatTime } from '../../lib/dateUtils'
import { TYPE_META } from '../../lib/sections'
import { toAvatarMember } from '../../lib/avatarMember'
import { getBillFileSignedUrl } from '../../lib/api/bills'
import { useHousehold } from '../household/HouseholdContext'
import { useDeadlines } from '../deadlines/DeadlinesContext'
import { DeadlineForm } from '../deadlines/DeadlineForm'
import { useEvents } from '../events/EventsContext'
import { EventForm } from '../events/EventForm'
import { useBills } from '../bills/BillsContext'
import { BillForm } from '../bills/BillForm'
import type { AgendaItem } from '../../types'

interface ItemDetailSheetProps {
  item: AgendaItem | null
  onClose: () => void
}

export function ItemDetailSheet({ item, onClose }: ItemDetailSheetProps) {
  const lastItemRef = useRef<AgendaItem | null>(item)
  if (item) lastItemRef.current = item
  const displayItem = item ?? lastItemRef.current

  const meta = displayItem ? TYPE_META[displayItem.type] : null
  const gradient = meta
    ? `linear-gradient(170deg, color-mix(in srgb, ${meta.accent} 55%, #0a0a0c) 0%, #0a0a0c 65%)`
    : undefined

  return (
    <BottomSheet open={Boolean(item)} onClose={onClose} gradient={gradient}>
      {displayItem && <DetailContent key={displayItem.id} item={displayItem} onClose={onClose} />}
    </BottomSheet>
  )
}

function DetailContent({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const { members } = useHousehold()
  const { deadlines, markDone, update: updateDeadline } = useDeadlines()
  const { events, update: updateEvent } = useEvents()
  const { bills, markPaid, update: updateBill } = useBills()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [fileError, setFileError] = useState<string | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  if (item.type === 'deadline') {
    const deadline = deadlines.find((d) => d.id === item.id)
    if (!deadline) return null

    if (mode === 'edit') {
      return (
        <DeadlineForm
          initial={deadline}
          submitLabel="Mentés"
          onCancel={() => setMode('view')}
          onSubmit={async (input) => {
            await updateDeadline(deadline.id, input)
            setMode('view')
          }}
        />
      )
    }

    const assignees = deadline.assigneeIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map(toAvatarMember)

    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-white/50">Határidő</p>
          <h2 className="mt-1 text-[22px] font-bold text-white">{deadline.title}</h2>
          <p className="mt-1 text-[15px] text-white/70">
            {formatFullDate(parseDate(deadline.dueDate))}
            {deadline.dueTime ? ` · ${deadline.dueTime}` : ''}
          </p>
          {deadline.description && <p className="mt-3 text-[15px] text-white/80">{deadline.description}</p>}
          {assignees.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <AvatarStack members={assignees} size={26} />
              <span className="text-[14px] text-white/60">{assignees.map((m) => m.name).join(', ')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <ActionButton
            primary
            onClick={async () => {
              await markDone(deadline.id, !deadline.done)
              onClose()
            }}
          >
            {deadline.done ? 'Visszaállítás' : 'Kész'}
          </ActionButton>
          <ActionButton onClick={() => setMode('edit')}>Szerkesztés</ActionButton>
        </div>
      </div>
    )
  }

  if (item.type === 'event') {
    const event = events.find((e) => e.id === item.id)
    if (!event) return null

    if (mode === 'edit') {
      return (
        <EventForm
          initial={event}
          submitLabel="Mentés"
          onCancel={() => setMode('view')}
          onSubmit={async (input) => {
            await updateEvent(event.id, input)
            setMode('view')
          }}
        />
      )
    }

    const participants = event.participantIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map(toAvatarMember)

    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-white/50">Időpont</p>
          <h2 className="mt-1 text-[22px] font-bold text-white">{event.title}</h2>
          <p className="mt-1 text-[15px] text-white/70">
            {formatFullDate(parseDate(event.startAt))} · {formatTime(parseDate(event.startAt))}
            {event.endAt ? `–${formatTime(parseDate(event.endAt))}` : ''}
          </p>
          {event.location && <p className="mt-1 text-[14px] text-white/60">{event.location}</p>}
          {event.note && <p className="mt-3 text-[15px] text-white/80">{event.note}</p>}
          {participants.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <AvatarStack members={participants} size={26} />
              <span className="text-[14px] text-white/60">{participants.map((m) => m.name).join(', ')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <ActionButton primary onClick={() => setMode('edit')}>
            Szerkesztés
          </ActionButton>
        </div>
      </div>
    )
  }

  const bill = bills.find((b) => b.id === item.id)
  if (!bill) return null

  if (mode === 'edit') {
    return (
      <BillForm
        initial={bill}
        submitLabel="Mentés"
        onCancel={() => setMode('view')}
        onSubmit={async (input) => {
          await updateBill(bill.id, input)
          setMode('view')
        }}
      />
    )
  }

  const history = bills
    .filter((b) => b.issuer === bill.issuer && b.id !== bill.id)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  const isPdf = (bill.filePath ?? '').toLowerCase().endsWith('.pdf')

  async function handleOpenFile() {
    if (!bill!.filePath) return
    setFileError(null)
    try {
      const url = await getBillFileSignedUrl(bill!.filePath)
      setViewerUrl(url)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Nem sikerült megnyitni a mellékletet')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-medium text-white/50">Számla</p>
        <h2 className="mt-1 text-[22px] font-bold text-white">{bill.issuer}</h2>
        <p className="mt-1 text-[34px] font-bold tracking-tight text-white">{formatHUF(bill.amount)}</p>
        <p className="mt-1 text-[15px] text-white/70">
          Esedékes: {formatFullDate(parseDate(bill.dueDate))} ·{' '}
          <span className={bill.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
            {bill.status === 'paid' ? 'Befizetve' : 'Fizetendő'}
          </span>
        </p>
        {bill.filePath && (
          <button onClick={handleOpenFile} className="mt-2 text-[14px] font-medium text-white underline underline-offset-2">
            Melléklet megnyitása
          </button>
        )}
        {fileError && <p className="mt-1 text-[13px] text-red-400">{fileError}</p>}
      </div>
      <div className="flex gap-2">
        <ActionButton
          primary
          disabled={bill.status === 'paid'}
          onClick={async () => {
            await markPaid(bill)
            onClose()
          }}
        >
          Befizetve
        </ActionButton>
        <ActionButton onClick={() => setMode('edit')}>Szerkesztés</ActionButton>
      </div>
      {history.length > 0 && (
        <div className="rounded-card border border-white/10 bg-black/20 p-4">
          <h3 className="text-center text-[15px] font-semibold text-white">Előzmények</h3>
          <div className="mt-3 flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-t border-white/8 pt-2 first:border-t-0 first:pt-0">
                <span className="text-[14px] text-white/70">{formatFullDate(parseDate(h.dueDate))}</span>
                <span className="text-[14px] font-semibold text-white">{formatHUF(h.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <AttachmentViewer url={viewerUrl} isPdf={isPdf} onClose={() => setViewerUrl(null)} />
    </div>
  )
}

function ActionButton({
  children,
  primary,
  disabled,
  onClick,
}: {
  children: string
  primary?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-pill px-4 py-2.5 text-[14px] font-semibold transition-colors disabled:opacity-50 ${
        primary ? 'bg-white text-black' : 'border border-white/20 bg-white/5 text-white active:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
