export type CabinSelection = {
  adults: number
  children: number
  cabinCode: string | null
}

export function cabProblems(
  cabins: Array<CabinSelection>,
  partyAdults: number,
  partyChildren: number,
  maxPerCabin: number
): Array<string> {
  const probs: Array<string> = []
  let adults = 0
  let children = 0

  cabins.forEach((cabin, index) => {
    const n = index + 1
    adults += cabin.adults
    children += cabin.children

    if (cabin.adults + cabin.children === 0) {
      probs.push(`Cabin ${n} is empty.`)
    }

    if (cabin.adults + cabin.children > maxPerCabin) {
      probs.push(`Cabin ${n} exceeds ${maxPerCabin} guests.`)
    }

    if (cabin.children > 0 && cabin.adults === 0) {
      probs.push(`Cabin ${n} has children without an adult.`)
    }

    if (!cabin.cabinCode) {
      probs.push(`Cabin ${n}: pick a cabin on the deck plan.`)
    }
  })

  if (adults !== partyAdults) {
    probs.push(`Adults placed (${adults}) must equal your party (${partyAdults}).`)
  }

  if (children !== partyChildren) {
    probs.push(`Children placed (${children}) must equal your party (${partyChildren}).`)
  }

  const used = cabins.map(cabin => cabin.cabinCode).filter((code): code is string => Boolean(code))

  if (new Set(used).size !== used.length) {
    probs.push('Two cabins point at the same deck cabin.')
  }

  return probs
}
