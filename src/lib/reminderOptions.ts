// Több is kiválasztható egyszerre (pl. "1 nappal előtte" ÉS "1 órával előtte"
// is) - ennyiszer kap külön push értesítést a tétel.
export const REMINDER_OPTIONS = [
  { value: 15, label: '15 perccel előtte' },
  { value: 30, label: '30 perccel előtte' },
  { value: 60, label: '1 órával előtte' },
  { value: 1440, label: '1 nappal előtte' },
]
