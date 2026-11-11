import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import { toAvatarMember } from '../../lib/avatarMember'

export function FamilyPage() {
  const { signOut } = useAuth()
  const { household, members, connectedMembers, createInvite, redeemHouseholdLink } = useHousehold()
  const [memberInviteCode, setMemberInviteCode] = useState<string | null>(null)
  const [linkInviteCode, setLinkInviteCode] = useState<string | null>(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const otherHouseholds = new Map<string, { name: string; members: typeof connectedMembers }>()
  for (const m of connectedMembers) {
    if (m.isOwnHousehold) continue
    const entry = otherHouseholds.get(m.householdId) ?? { name: m.householdName, members: [] }
    entry.members.push(m)
    otherHouseholds.set(m.householdId, entry)
  }

  async function handleGenerateMemberInvite() {
    setBusy(true)
    const { invite, error: err } = await createInvite('member')
    setBusy(false)
    if (err) setError(err)
    else setMemberInviteCode(invite?.code ?? null)
  }

  async function handleGenerateLinkInvite() {
    setBusy(true)
    const { invite, error: err } = await createInvite('household_link')
    setBusy(false)
    if (err) setError(err)
    else setLinkInviteCode(invite?.code ?? null)
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (!redeemCode.trim()) return
    setBusy(true)
    const { error: err } = await redeemHouseholdLink(redeemCode.trim())
    setBusy(false)
    if (err) setError(err)
    else setRedeemCode('')
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <div className="px-1">
        <h2 className="text-[20px] font-bold text-white">Családtagok</h2>
        {household && <p className="text-[14px] text-white/50">{household.name}</p>}
      </div>

      <Card className="overflow-hidden">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 border-t border-white/8 px-4 py-3.5 first:border-t-0">
            <Avatar member={toAvatarMember(member)} size={40} />
            <span className="text-[16px] font-semibold text-white">{member.displayName}</span>
            {member.role === 'owner' && (
              <span className="ml-auto rounded-pill bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white/60">
                Tulajdonos
              </span>
            )}
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h3 className="text-[15px] font-semibold text-white">Családtag meghívása</h3>
        <p className="text-[13px] text-white/50">
          Generálj egy kódot, amit a meghívott családtag a csatlakozáskor megad.
        </p>
        {memberInviteCode ? (
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-[22px] font-bold tracking-[0.3em] text-white">
            {memberInviteCode}
          </div>
        ) : (
          <button
            onClick={handleGenerateMemberInvite}
            disabled={busy}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
          >
            + Meghívó kód generálása
          </button>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h3 className="text-[15px] font-semibold text-white">Összekapcsolt háztartások</h3>
        <p className="text-[13px] text-white/50">
          Kapcsold össze a háztartásod egy másikkal (pl. a másik szülő háztartásával), hogy tételenként
          megoszthasd velük a határidőket, időpontokat és számlákat.
        </p>

        {[...otherHouseholds.values()].map((entry) => (
          <div key={entry.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-[13px] font-semibold text-white/60">{entry.name}</p>
            <div className="flex flex-wrap gap-2">
              {entry.members.map((m) => (
                <span key={m.id} className="flex items-center gap-1.5 rounded-pill bg-white/10 px-2.5 py-1">
                  <Avatar member={toAvatarMember(m)} size={18} />
                  <span className="text-[13px] text-white">{m.displayName}</span>
                </span>
              ))}
            </div>
          </div>
        ))}

        {linkInviteCode ? (
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-[22px] font-bold tracking-[0.3em] text-white">
            {linkInviteCode}
          </div>
        ) : (
          <button
            onClick={handleGenerateLinkInvite}
            disabled={busy}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
          >
            + Összekapcsolási kód generálása
          </button>
        )}

        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            placeholder="Másik háztartás kódja"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] uppercase tracking-widest text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-pill bg-[var(--accent)] px-4 text-[14px] font-semibold text-black disabled:opacity-50"
          >
            Összekapcsolás
          </button>
        </form>
      </Card>

      {error && <p className="px-1 text-[14px] text-red-400">{error}</p>}

      <button onClick={signOut} className="text-center text-[14px] font-medium text-white/40">
        Kijelentkezés
      </button>
    </div>
  )
}
