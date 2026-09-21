import { describe, expect, it } from 'vitest'
import { cabinCountRange, distributeGuests } from '../../app/utils/distributeGuests'

describe('distributeGuests', () => {
  it('fills the minimum cabins for two adults', () => {
    const cabins = distributeGuests(2, 0, 1, 3)
    expect(cabins).toHaveLength(1)
    expect(cabins[0]?.adults).toBe(2)
    expect(cabins[0]?.children).toBe(0)
  })

  it('keeps leftover children in remaining slots', () => {
    const cabins = distributeGuests(2, 2, 2, 3)
    const adults = cabins.reduce((sum, cabin) => sum + cabin.adults, 0)
    const children = cabins.reduce((sum, cabin) => sum + cabin.children, 0)
    expect(adults).toBe(2)
    expect(children).toBe(2)
    expect(cabins.every(cabin => cabin.adults + cabin.children <= 3)).toBe(true)
    expect(cabins.every(cabin => cabin.adults >= 1)).toBe(true)
  })

  it('keeps previously picked deck cabins', () => {
    const cabins = distributeGuests(2, 0, 2, 3, [
      { adults: 1, children: 0, cabinCode: 'Suite 01' }
    ])
    expect(cabins[0]?.cabinCode).toBe('Suite 01')
  })
})

describe('cabinCountRange', () => {
  it('uses ceil(party / max) as the minimum', () => {
    expect(cabinCountRange(4, 3, 9)).toEqual({ min: 2, max: 4 })
  })
})
