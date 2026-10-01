import { describe, expect, it } from 'vitest'
import { deckCodeFor } from '../../app/utils/deckCode'

describe('deckCodeFor', () => {
  it('maps suite labels onto the deck drawing', () => {
    expect(deckCodeFor('Suite 01')).toBe('1')
    expect(deckCodeFor('Suite 08')).toBe('8')
    expect(deckCodeFor("Owner's Suite")).toBe('owner')
  })

  it('returns null for a label the drawings do not have', () => {
    expect(deckCodeFor('Charter')).toBeNull()
    expect(deckCodeFor('Suite 12')).toBeNull()
  })
})
