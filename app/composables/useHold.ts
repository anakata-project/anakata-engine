import { holdHasExpired, shouldExtendHold } from '../utils/holdTiming'

export function useHold() {
  const { request } = useApi()
  const { flow } = useBookingFlow()
  const config = useRuntimeConfig()
  const expired = ref(false)
  const releasedMessage = ref('')
  const keepHold = ref(false)

  function apiUrl(path: string): string {
    return `${String(config.public.apiBase).replace(/\/$/, '')}${path}`
  }

  function retain(): void {
    keepHold.value = true
  }

  async function release(token = flow.value.checkoutToken): Promise<void> {
    keepHold.value = false

    if (!token) {
      return
    }

    try {
      await request(`/api/engine/checkout/${token}`, { method: 'DELETE' })
    } catch {
      // already released / expired
    }

    flow.value.checkoutToken = null
    flow.value.checkoutExpiresAt = null
    flow.value.holdExtended = false
  }

  function releaseBeacon(token = flow.value.checkoutToken): void {
    if (keepHold.value || !token || !import.meta.client) {
      return
    }

    // sendBeacon is POST-only; keepalive fetch is the DELETE equivalent on page hide.
    void fetch(apiUrl(`/api/engine/checkout/${token}`), {
      method: 'DELETE',
      keepalive: true,
      credentials: 'include'
    })
    flow.value.checkoutToken = null
    flow.value.checkoutExpiresAt = null
    flow.value.holdExtended = false
  }

  async function extendIfDue(now = Date.now()): Promise<void> {
    const token = flow.value.checkoutToken
    const expires = flow.value.checkoutExpiresAt

    if (!token || !expires || !shouldExtendHold(expires, now, flow.value.holdExtended)) {
      return
    }

    try {
      const result = await request(`/api/engine/checkout/${token}/extend`, {
        method: 'POST'
      }) as { expires_at: string, extended: boolean }

      flow.value.checkoutExpiresAt = result.expires_at
      flow.value.holdExtended = true
    } catch (error) {
      const status = errorStatus(error)

      if (status === 409) {
        flow.value.holdExtended = true
      }
    }
  }

  function checkExpiry(now = Date.now()): boolean {
    const expires = flow.value.checkoutExpiresAt

    if (!expires) {
      return false
    }

    if (holdHasExpired(expires, now)) {
      expired.value = true
      releasedMessage.value = 'Your cabin hold expired and the cabins were released.'
      flow.value.checkoutToken = null
      flow.value.checkoutExpiresAt = null

      return true
    }

    return false
  }

  return reactive({
    expired,
    releasedMessage,
    retain,
    release,
    releaseBeacon,
    extendIfDue,
    checkExpiry
  })
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status
  }

  return undefined
}
