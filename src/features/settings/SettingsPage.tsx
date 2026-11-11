import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import { detectPlatform, isStandalone } from '../../lib/platform'
import { getExistingSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../../lib/api/push'
import { supabase } from '../../lib/supabaseClient'
import { InstallGuideSheet } from './InstallGuideSheet'
import { ProfileSheet } from './ProfileSheet'
import { HouseholdSheet } from './HouseholdSheet'
import { AboutSheet } from './AboutSheet'

type SettingsRow = 'Profil' | 'Háztartás' | 'Névjegy'
const ROWS: SettingsRow[] = ['Profil', 'Háztartás', 'Névjegy']

export function SettingsPage() {
  const { passkeySupported, registerPasskey } = useAuth()
  const { myMember } = useHousehold()
  const [passkeyStatus, setPasskeyStatus] = useState<'checking' | 'idle' | 'busy' | 'done'>('checking')
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  useEffect(() => {
    if (!passkeySupported) return
    supabase.auth.passkey.list().then(({ data }) => {
      setPasskeyStatus(data && data.length > 0 ? 'done' : 'idle')
    })
  }, [passkeySupported])
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const [openRow, setOpenRow] = useState<SettingsRow | null>(null)
  const [installed] = useState(() => isStandalone())
  const [platform] = useState(() => detectPlatform())

  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPushSupported()) {
      setPushSubscribed(false)
      return
    }
    getExistingSubscription().then((sub) => setPushSubscribed(Boolean(sub)))
  }, [])

  async function handlePasskeyRegister() {
    setPasskeyError(null)
    setPasskeyStatus('busy')
    const { error: err } = await registerPasskey()
    if (err) {
      setPasskeyError(err)
      setPasskeyStatus('idle')
      return
    }
    setPasskeyStatus('done')
  }

  async function handleTogglePush() {
    if (!myMember) return
    setPushError(null)
    setPushBusy(true)
    const { error } = pushSubscribed ? await unsubscribeFromPush() : await subscribeToPush(myMember.id)
    setPushBusy(false)
    if (error) {
      setPushError(error)
      return
    }
    setPushSubscribed((v) => !v)
  }

  const iosNeedsInstall = platform === 'ios' && !installed

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Beállítások</h2>

      {!installed && (
        <Card className="flex flex-col gap-2 p-4">
          <h3 className="text-[15px] font-semibold text-white">Telepítsd a kezdőképernyődre</h3>
          <p className="text-[13px] text-white/50">
            Gyorsabb indulás, teljes képernyős nézet, és iOS-en csak így működnek a push értesítések.
          </p>
          <button
            onClick={() => setInstallGuideOpen(true)}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10"
          >
            + Telepítési útmutató
          </button>
        </Card>
      )}

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="text-[15px] font-semibold text-white">Értesítések</h3>
        <p className="text-[13px] text-white/50">
          Kapj értesítést, mielőtt lejár egy határidő, kezdődik egy időpont, vagy esedékessé válik egy számla.
        </p>
        {iosNeedsInstall ? (
          <p className="text-[13px] text-amber-400">
            iPhone-on a push értesítések csak akkor működnek, ha az appot hozzáadtad a kezdőképernyőhöz. Előbb
            telepítsd a fenti útmutató alapján.
          </p>
        ) : pushSubscribed === null ? (
          <p className="text-[13px] text-white/40">Ellenőrzés...</p>
        ) : (
          <button
            onClick={handleTogglePush}
            disabled={pushBusy}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
          >
            {pushBusy
              ? 'Folyamatban...'
              : pushSubscribed
                ? 'Értesítések kikapcsolása'
                : '+ Értesítések bekapcsolása'}
          </button>
        )}
        {pushError && <p className="text-[13px] text-red-400">{pushError}</p>}
      </Card>

      {passkeySupported && (
        <Card className="flex flex-col gap-2 p-4">
          <h3 className="text-[15px] font-semibold text-white">Face ID / Touch ID bejelentkezés</h3>
          <p className="text-[13px] text-white/50">
            Kapcsold be, hogy ezen a készüléken legközelebb e-mail nélkül, Face ID-val vagy Touch ID-val
            léphess be.
          </p>
          {passkeyStatus === 'checking' ? (
            <p className="text-[13px] text-white/40">Ellenőrzés...</p>
          ) : passkeyStatus === 'done' ? (
            <p className="text-[14px] font-semibold text-emerald-400">Bekapcsolva</p>
          ) : (
            <button
              onClick={handlePasskeyRegister}
              disabled={passkeyStatus === 'busy'}
              className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
            >
              {passkeyStatus === 'busy' ? 'Folyamatban...' : '+ Face ID / Touch ID bekapcsolása'}
            </button>
          )}
          {passkeyError && <p className="text-[13px] text-red-400">{passkeyError}</p>}
        </Card>
      )}

      <Card className="overflow-hidden">
        {ROWS.map((row) => (
          <button
            key={row}
            onClick={() => setOpenRow(row)}
            className="flex w-full items-center justify-between border-t border-white/8 px-4 py-3.5 text-left first:border-t-0 active:bg-white/5"
          >
            <span className="text-[16px] font-medium text-white">{row}</span>
            <span className="text-white/30">›</span>
          </button>
        ))}
      </Card>

      <InstallGuideSheet open={installGuideOpen} onClose={() => setInstallGuideOpen(false)} />
      <ProfileSheet open={openRow === 'Profil'} onClose={() => setOpenRow(null)} />
      <HouseholdSheet open={openRow === 'Háztartás'} onClose={() => setOpenRow(null)} />
      <AboutSheet open={openRow === 'Névjegy'} onClose={() => setOpenRow(null)} />
    </div>
  )
}
