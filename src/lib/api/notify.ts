import { supabase } from '../supabaseClient'

type NotifiableTable = 'deadlines' | 'events' | 'bills'

/**
 * Azonnali push értesítést indít az új tételről (nem várja meg a 15 perces
 * cron-t). Szándékosan "fire-and-forget": ha a hívás elhasal (pl. nincs
 * hálózat), a tétel létrehozása attól még sikeres marad.
 */
export function notifyNewItem(table: NotifiableTable, id: string): void {
  supabase.functions.invoke('notify-new-item', { body: { table, id } }).catch(() => {})
}
