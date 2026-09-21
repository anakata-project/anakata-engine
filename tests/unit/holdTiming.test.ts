import { describe, expect, it } from 'vitest'
import { shouldExtendHold } from '../../app/utils/holdTiming'

describe('shouldExtendHold', () => {
  const now = Date.parse('2027-01-01T12:00:00.000Z')

  it('extends once inside the two-minute window', () => {
    expect(shouldExtendHold('2027-01-01T12:01:30.000Z', now, false)).toBe(true)
  })

  it('does not extend before the window', () => {
    expect(shouldExtendHold('2027-01-01T12:10:00.000Z', now, false)).toBe(false)
  })

  it('skips when already extended', () => {
    expect(shouldExtendHold('2027-01-01T12:01:00.000Z', now, true)).toBe(false)
  })
})
