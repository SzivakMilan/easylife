import { useState } from 'react'

interface ConfirmDeleteButtonProps {
  /** A gomb felirata, pl. "Törlés" vagy "Kategória törlése" */
  label?: string
  /** Megerősítő kérdés, pl. "Biztosan törlöd ezt a határidőt?" */
  question: string
  /** Opcionális figyelmeztetés a kérdés alatt */
  warning?: string
  onConfirm: () => Promise<void>
}

/** Kétlépéses törlés: első koppintásra rákérdez, csak a megerősítés után töröl. */
export function ConfirmDeleteButton({ label = 'Törlés', question, warning, onConfirm }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-pill border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[14px] font-semibold text-red-300 active:bg-red-500/20"
      >
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-card border border-red-400/40 bg-red-500/10 p-4">
      <p className="text-center text-[15px] font-semibold text-white">{question}</p>
      {warning && <p className="mt-1 text-center text-[13px] text-white/60">{warning}</p>}
      {error && <p className="mt-2 text-center text-[13px] text-red-300">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
          className="flex-1 rounded-pill border border-white/20 bg-white/5 px-4 py-2.5 text-[14px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
        >
          Mégse
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              await onConfirm()
            } catch (err) {
              setError(
                err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Nem sikerült törölni',
              )
              setBusy(false)
            }
          }}
          className="flex-1 rounded-pill bg-red-500 px-4 py-2.5 text-[14px] font-semibold text-white active:bg-red-600 disabled:opacity-50"
        >
          {busy ? 'Törlés...' : 'Igen, törlöm'}
        </button>
      </div>
    </div>
  )
}
