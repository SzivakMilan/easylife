import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import type { ConnectedMember, HouseholdMember, Invite } from '../../types/household'

interface HouseholdContextValue {
  loading: boolean
  household: { id: string; name: string } | null
  myMember: HouseholdMember | null
  members: HouseholdMember[]
  connectedMembers: ConnectedMember[]
  refresh: () => Promise<void>
  createHousehold: (name: string, displayName: string, avatarColor: string) => Promise<{ error: string | null }>
  joinHousehold: (code: string, displayName: string, avatarColor: string) => Promise<{ error: string | null }>
  createInvite: (kind: 'member' | 'household_link') => Promise<{ invite: Invite | null; error: string | null }>
  redeemHouseholdLink: (code: string) => Promise<{ error: string | null }>
  updateHouseholdName: (name: string) => Promise<{ error: string | null }>
  updateMyMember: (displayName: string, avatarColor: string) => Promise<{ error: string | null }>
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

function toMember(row: {
  id: string
  household_id: string
  user_id: string
  display_name: string
  avatar_color: string
  role: string
}): HouseholdMember {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    role: row.role === 'owner' ? 'owner' : 'member',
  }
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<{ id: string; name: string } | null>(null)
  const [myMember, setMyMember] = useState<HouseholdMember | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [connectedMembers, setConnectedMembers] = useState<ConnectedMember[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setHousehold(null)
      setMyMember(null)
      setMembers([])
      setConnectedMembers([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: mine } = await supabase.from('household_members').select('*').eq('user_id', user.id).maybeSingle()

    if (!mine) {
      setHousehold(null)
      setMyMember(null)
      setMembers([])
      setConnectedMembers([])
      setLoading(false)
      return
    }

    const me = toMember(mine)
    setMyMember(me)

    const [{ data: householdRow }, { data: allMembers }] = await Promise.all([
      supabase.from('households').select('id, name').eq('id', me.householdId).maybeSingle(),
      supabase.from('household_members').select('*, households(name)'),
    ])

    setHousehold(householdRow ?? null)

    const own: HouseholdMember[] = []
    const connected: ConnectedMember[] = []
    for (const row of allMembers ?? []) {
      const member = toMember(row)
      const householdName = (row as { households?: { name: string } }).households?.name ?? ''
      if (member.householdId === me.householdId) {
        own.push(member)
      }
      connected.push({ ...member, householdName, isOwnHousehold: member.householdId === me.householdId })
    }
    setMembers(own)
    setConnectedMembers(connected)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createHousehold(name: string, displayName: string, avatarColor: string) {
    const { error } = await supabase.rpc('create_household', {
      p_name: name,
      p_display_name: displayName,
      p_avatar_color: avatarColor,
    })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function joinHousehold(code: string, displayName: string, avatarColor: string) {
    const { error } = await supabase.rpc('redeem_member_invite', {
      invite_code: code,
      p_display_name: displayName,
      p_avatar_color: avatarColor,
    })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function createInvite(kind: 'member' | 'household_link') {
    const { data, error } = await supabase.rpc('create_invite', { p_kind: kind })
    if (error || !data) return { invite: null, error: error?.message ?? 'Ismeretlen hiba' }
    const row = data as { id: string; kind: 'member' | 'household_link'; code: string; expires_at: string | null }
    const invite: Invite = { id: row.id, kind: row.kind, code: row.code, expiresAt: row.expires_at }
    return { invite, error: null }
  }

  async function redeemHouseholdLink(code: string) {
    const { error } = await supabase.rpc('redeem_household_link_invite', { invite_code: code })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function updateHouseholdName(name: string) {
    if (!household) return { error: 'Nincs háztartás' }
    const { error } = await supabase.from('households').update({ name }).eq('id', household.id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function updateMyMember(displayName: string, avatarColor: string) {
    if (!myMember) return { error: 'Nincs tagság' }
    const { error } = await supabase
      .from('household_members')
      .update({ display_name: displayName, avatar_color: avatarColor })
      .eq('id', myMember.id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return (
    <HouseholdContext.Provider
      value={{
        loading,
        household,
        myMember,
        members,
        connectedMembers,
        refresh,
        createHousehold,
        joinHousehold,
        createInvite,
        redeemHouseholdLink,
        updateHouseholdName,
        updateMyMember,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider')
  return ctx
}
