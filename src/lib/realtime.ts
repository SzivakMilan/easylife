import { useEffect } from 'react'
import { supabase } from './supabaseClient'

/**
 * Feliratkozik egy tábla háztartás-szűrt változásaira, és minden beszúrás/
 * módosítás/törlés esetén újra lefuttatja a megadott refresh-t - enélkül a
 * Context-ek csak egyszer, a háztartás betöltésekor olvasnák be az adatot,
 * és más tagok módosításai csak teljes appújraindításkor jelennének meg.
 */
export function useRealtimeRefresh(table: string, householdId: string | null | undefined, refresh: () => void) {
  useEffect(() => {
    if (!householdId) return
    const channel = supabase
      .channel(`${table}-${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, householdId, refresh])
}
