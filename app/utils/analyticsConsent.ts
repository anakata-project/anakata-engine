export type AnalyticsConsent = 'unset' | 'accepted' | 'refused'

export const ANALYTICS_STORAGE_KEY = 'anakata-engine-analytics'

export function analyticsAllowed(consent: AnalyticsConsent, measurementId: string): boolean {
  return consent === 'accepted' && measurementId.trim() !== ''
}

export function readStoredConsent(storage?: Pick<Storage, 'getItem'>): AnalyticsConsent {
  if (!storage) {
    return 'unset'
  }

  try {
    const value = storage.getItem(ANALYTICS_STORAGE_KEY)

    if (value === 'accepted' || value === 'refused') {
      return value
    }
  } catch {
    return 'unset'
  }

  return 'unset'
}

export function writeStoredConsent(
  value: 'accepted' | 'refused',
  storage?: Pick<Storage, 'setItem'>
): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(ANALYTICS_STORAGE_KEY, value)
  } catch {
    // private mode / quota
  }
}
