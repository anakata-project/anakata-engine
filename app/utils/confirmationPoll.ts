export const POLL_INTERVAL_MS = 3_000
export const POLL_CAP_MS = 120_000

export type ConfirmationScreen
  = | 'pay_later'
    | 'confirming'
    | 'confirmed'
    | 'expired'
    | 'processing'

export type ConfirmationPollInput = {
  path: 'PAY_LATER' | 'PAY_DEPOSIT' | null
  now: number
  pollStartedAt: number
  bookings: Array<{ status: string }>
  stripeExpiresAt: string | null
}

export function confirmationScreen(input: ConfirmationPollInput): ConfirmationScreen {
  if (input.path !== 'PAY_DEPOSIT') {
    return 'pay_later'
  }

  if (input.bookings.length > 0 && input.bookings.every(booking => booking.status === 'CONFIRMED')) {
    return 'confirmed'
  }

  if (input.stripeExpiresAt && new Date(input.stripeExpiresAt).getTime() <= input.now) {
    return 'expired'
  }

  if (input.now - input.pollStartedAt >= POLL_CAP_MS) {
    return 'processing'
  }

  return 'confirming'
}
