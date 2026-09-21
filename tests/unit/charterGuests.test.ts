import { describe, expect, it } from 'vitest'
import { charterGuestsOk, charterMessage } from '../../app/utils/charterGuests'

describe('charter guest limit', () => {
  it('accepts 1 through capacity and rejects more', () => {
    expect(charterGuestsOk(1, 16)).toBe(true)
    expect(charterGuestsOk(16, 16)).toBe(true)
    expect(charterGuestsOk(17, 16)).toBe(false)
    expect(charterGuestsOk(0, 16)).toBe(false)
    expect(charterGuestsOk(12.5, 16)).toBe(false)
  })

  it('joins group context and notes for the API message', () => {
    expect(charterMessage('Family', 'July week')).toBe('Family\n\nJuly week')
    expect(charterMessage('Family', '')).toBe('Family')
    expect(charterMessage('', 'July week')).toBe('July week')
  })
})
