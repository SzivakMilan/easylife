import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { AvatarStack } from '../../components/ui/Avatar'
import { toAvatarMember } from '../../lib/avatarMember'
import { formatFullDate, parseDate } from '../../lib/dateUtils'
import { useHousehold } from '../household/HouseholdContext'
import { useTrips } from './TripsContext'
import { TripForm } from './TripForm'
import { TripDetailSheet } from './TripDetailSheet'
import type { Trip } from '../../types'

export function TripsPage() {
  const { trips, createTrip, loading } = useTrips()
  const { members } = useHousehold()
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [adding, setAdding] = useState(false)

  function participantsOf(trip: Trip) {
    return members.filter((m) => trip.participantIds.includes(m.id)).map(toAvatarMember)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Utazás</h2>

      {trips.length === 0 && !loading ? (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-[15px] text-white/60">Még nincs rögzített utazásod.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="p-4" onClick={() => setSelectedTrip(trip)}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-white">{trip.name}</p>
                  {trip.destination && <p className="truncate text-[13px] text-white/50">{trip.destination}</p>}
                </div>
                <AvatarStack members={participantsOf(trip)} size={26} />
              </div>
              <p className="mt-2 text-[13px] text-white/45">
                {formatFullDate(parseDate(trip.startDate))}
                {trip.endDate && ` – ${formatFullDate(parseDate(trip.endDate))}`}
              </p>
            </Card>
          ))}
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10"
      >
        + Új utazás
      </button>

      <TripDetailSheet trip={selectedTrip} onClose={() => setSelectedTrip(null)} />

      <BottomSheet open={adding} onClose={() => setAdding(false)}>
        <h2 className="mb-4 text-center text-[17px] font-bold text-white">Új utazás</h2>
        <TripForm
          submitLabel="Utazás létrehozása"
          onCancel={() => setAdding(false)}
          onSubmit={async (input) => {
            await createTrip(input)
            setAdding(false)
          }}
        />
      </BottomSheet>
    </div>
  )
}
