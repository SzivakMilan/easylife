const formatter = new Intl.NumberFormat('hu-HU', {
  style: 'currency',
  currency: 'HUF',
  maximumFractionDigits: 0,
})

export function formatHUF(amount: number): string {
  return formatter.format(amount)
}
