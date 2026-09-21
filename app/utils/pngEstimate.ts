import type { EngineSettings } from '../types/api'

/** Andean Community members other than Ecuador. Mirrors App\Support\Guests\AndeanCommunity. */
const ANDEAN = ['CO', 'PE', 'BO'] as const

export type GuestFeeHint = {
  nationality: string | null
  ecuadorResident: boolean
  isChild: boolean
}

export function pngFeeForGuest(settings: EngineSettings, guest: GuestFeeHint): number {
  const png = settings.fees.png
  const code = guest.nationality

  // TODO(OPEN: I4) DOB is collected on the complete page — children use the ≤12 band until then.
  if (!code) {
    return guest.isChild ? png.foreign_12_and_under : png.foreign_over_12
  }

  if (code === 'EC' || guest.ecuadorResident) {
    return png.national_or_resident
  }

  if ((ANDEAN as ReadonlyArray<string>).includes(code)) {
    return guest.isChild ? png.can_minor : png.can_adult
  }

  return guest.isChild ? png.foreign_12_and_under : png.foreign_over_12
}

export function pngEstimate(
  settings: EngineSettings,
  guests: Array<GuestFeeHint>
): number {
  return guests.reduce((sum, guest) => sum + pngFeeForGuest(settings, guest), 0)
}
