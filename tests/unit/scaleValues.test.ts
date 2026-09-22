import { describe, expect, it } from 'vitest'
import { scaleInBounds, scaleValues } from '../../app/utils/scaleValues'

describe('survey scale bounds', () => {
  it('builds the inclusive range and rejects a value outside it', () => {
    expect(scaleValues(1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(scaleInBounds(1, 10, 1)).toBe(true)
    expect(scaleInBounds(1, 10, 10)).toBe(true)
    expect(scaleInBounds(1, 10, 0)).toBe(false)
    expect(scaleInBounds(1, 10, 11)).toBe(false)

    expect(scaleValues(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(scaleInBounds(0, 10, 0)).toBe(true)
    expect(scaleInBounds(0, 10, 11)).toBe(false)
  })
})
