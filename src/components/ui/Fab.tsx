interface FabProps {
  onClick: () => void
  accent: string
}

export function Fab({ onClick, accent }: FabProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Gyors hozzáadás"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold text-black shadow-lg shadow-black/40 transition-transform active:scale-95"
      style={{ backgroundColor: accent }}
    >
      +
    </button>
  )
}
