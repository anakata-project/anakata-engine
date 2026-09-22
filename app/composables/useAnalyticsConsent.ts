import type { AnalyticsConsent } from '../utils/analyticsConsent'
import { analyticsAllowed, readStoredConsent, showConsentBanner, writeStoredConsent } from '../utils/analyticsConsent'
import { clearPersistedTouches, promoteSessionTouch } from '../utils/attribution'
import { clearSession, ensureSession } from '../utils/engineSession'
import { bindSessionStore, configureEngineQueue, queuePageView, setEngineConsent } from '../utils/engineQueue'
import { configureTrack, loadGtag, revokeTracking } from './useTrack'

export function useAnalyticsConsent() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const measurementId = computed(() => {
    const value = config.public.gaMeasurementId

    if (typeof value !== 'string') {
      return ''
    }

    const id = value.trim()

    return id === 'undefined' || id === 'null' ? '' : id
  })
  const consent = useState<AnalyticsConsent>('engine-analytics-consent', () => 'unset')

  function apply(next: AnalyticsConsent): void {
    consent.value = next
    configureTrack(next, measurementId.value)

    if (!import.meta.client) {
      return
    }

    configureEngineQueue(String(config.public.apiBase))
    bindSessionStore(localStorage)

    if (next === 'accepted') {
      const id = ensureSession(localStorage, Date.now())
      setEngineConsent(true, id)
      promoteSessionTouch(sessionStorage, localStorage)
    } else if (next === 'refused') {
      clearSession(localStorage)
      clearPersistedTouches(localStorage)
      revokeTracking()
    } else {
      setEngineConsent(false, null)
    }

    if (analyticsAllowed(next, measurementId.value)) {
      loadGtag(measurementId.value, document)
    }
  }

  function accept(): void {
    writeStoredConsent('accepted', import.meta.client ? localStorage : undefined)
    apply('accepted')

    if (import.meta.client) {
      queuePageView(route.path)
    }
  }

  function refuse(): void {
    writeStoredConsent('refused', import.meta.client ? localStorage : undefined)
    apply('refused')
  }

  onMounted(() => {
    apply(readStoredConsent(localStorage))
  })

  const showBanner = computed(() => showConsentBanner(consent.value))

  return {
    consent,
    measurementId,
    showBanner,
    accept,
    refuse
  }
}
