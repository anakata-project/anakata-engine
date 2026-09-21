import { describe, expect, it } from 'vitest'
import { confirmationScreen, POLL_CAP_MS } from '../../app/utils/confirmationPoll'

const start = Date.parse('2027-01-01T12:00:00.000Z')

describe('confirmationScreen', () => {
  it('stays on pay later without polling', () => {
    expect(confirmationScreen({
      path: 'PAY_LATER',
      now: start,
      pollStartedAt: start,
      bookings: [{ status: 'REQUESTED' }],
      stripeExpiresAt: null
    })).toBe('pay_later')
  })

  it('confirms only when every booking is CONFIRMED', () => {
    expect(confirmationScreen({
      path: 'PAY_DEPOSIT',
      now: start + 3_000,
      pollStartedAt: start,
      bookings: [{ status: 'CONFIRMED' }],
      stripeExpiresAt: '2027-01-01T12:30:00.000Z'
    })).toBe('confirmed')
  })

  it('shows expired when stripe_expires_at is past and still REQUESTED', () => {
    expect(confirmationScreen({
      path: 'PAY_DEPOSIT',
      now: start + 60_000,
      pollStartedAt: start,
      bookings: [{ status: 'REQUESTED' }],
      stripeExpiresAt: '2027-01-01T11:59:00.000Z'
    })).toBe('expired')
  })

  it('is confirming before the cap', () => {
    expect(confirmationScreen({
      path: 'PAY_DEPOSIT',
      now: start + 30_000,
      pollStartedAt: start,
      bookings: [{ status: 'REQUESTED' }],
      stripeExpiresAt: '2027-01-01T12:30:00.000Z'
    })).toBe('confirming')
  })

  it('stops confirming after two minutes', () => {
    expect(confirmationScreen({
      path: 'PAY_DEPOSIT',
      now: start + POLL_CAP_MS,
      pollStartedAt: start,
      bookings: [{ status: 'REQUESTED' }],
      stripeExpiresAt: '2027-01-01T12:30:00.000Z'
    })).toBe('processing')
  })
})
