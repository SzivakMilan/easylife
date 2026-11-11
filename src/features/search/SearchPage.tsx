export function SearchPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Keresés</h2>
      <input
        placeholder="Keresés a háztartásban..."
        className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  )
}
