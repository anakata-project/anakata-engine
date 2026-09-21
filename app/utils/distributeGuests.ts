import type { CabinSelection } from './cabProblems'

export function distributeGuests(
  adults: number,
  children: number,
  cabinCount: number,
  maxPerCabin: number,
  previous: Array<CabinSelection> = []
): Array<CabinSelection> {
  if (cabinCount < 1) {
    return []
  }

  const cabins: Array<CabinSelection> = Array.from({ length: cabinCount }, (_, index) => ({
    adults: previous[index]?.adults ?? 0,
    children: previous[index]?.children ?? 0,
    cabinCode: previous[index]?.cabinCode ?? null
  }))

  let adultsLeft = adults

  cabins.forEach((cabin, index) => {
    const remainingCabins = cabinCount - index
    const share = Math.max(1, Math.min(maxPerCabin, Math.ceil(adultsLeft / remainingCabins)))
    cabin.adults = share
    adultsLeft -= cabin.adults

    if (adultsLeft < 0) {
      cabin.adults += adultsLeft
      adultsLeft = 0
    }
  })

  let childrenLeft = children

  cabins.forEach((cabin) => {
    const room = Math.max(0, maxPerCabin - cabin.adults)
    const take = Math.min(room, childrenLeft)
    cabin.children = take
    childrenLeft -= take
  })

  return cabins
}

export function cabinCountRange(party: number, maxPerCabin: number, maxCabins: number): {
  min: number
  max: number
} {
  const min = Math.ceil(party / maxPerCabin)

  return {
    min,
    max: Math.min(maxCabins, party)
  }
}
