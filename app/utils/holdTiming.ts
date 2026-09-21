export const EXTEND_WINDOW_MS = 2 * 60 * 1000

export function remainingHoldMs(expiresAt: string, now: number): number {
  return new Date(expiresAt).getTime() - now
}

export function shouldExtendHold(
  expiresAt: string,
  now: number,
  alreadyExtended: boolean
): boolean {
  if (alreadyExtended) {
    return false
  }

  const remaining = remainingHoldMs(expiresAt, now)

  return remaining > 0 && remaining <= EXTEND_WINDOW_MS
}

export function holdHasExpired(expiresAt: string, now: number): boolean {
  return remainingHoldMs(expiresAt, now) <= 0
}
