import { describe, expect, it } from 'vitest'
import { cabProblems } from '../../app/utils/cabProblems'

describe('cabProblems', () => {
  it('is empty for a valid single cabin', () => {
    expect(cabProblems(
      [{ adults: 2, children: 0, cabinCode: 'Suite 01' }],
      2,
      0,
      3
    )).toEqual([])
  })

  it('flags every prototype rule', () => {
    expect(cabProblems([{ adults: 0, children: 0, cabinCode: 'Suite 01' }], 0, 0, 3))
      .toContain('Cabin 1 is empty.')
    expect(cabProblems([{ adults: 2, children: 2, cabinCode: 'Suite 01' }], 2, 2, 3))
      .toContain('Cabin 1 exceeds 3 guests.')
    expect(cabProblems([{ adults: 0, children: 1, cabinCode: 'Suite 01' }], 0, 1, 3))
      .toContain('Cabin 1 has children without an adult.')
    expect(cabProblems([{ adults: 2, children: 0, cabinCode: null }], 2, 0, 3))
      .toContain('Cabin 1: pick a cabin on the deck plan.')
    expect(cabProblems([{ adults: 1, children: 0, cabinCode: 'Suite 01' }], 2, 0, 3))
      .toContain('Adults placed (1) must equal your party (2).')
    expect(cabProblems([{ adults: 2, children: 0, cabinCode: 'Suite 01' }], 2, 1, 3))
      .toContain('Children placed (0) must equal your party (1).')
    expect(cabProblems([
      { adults: 1, children: 0, cabinCode: 'Suite 01' },
      { adults: 1, children: 0, cabinCode: 'Suite 01' }
    ], 2, 0, 3)).toContain('Two cabins point at the same deck cabin.')
  })
})
