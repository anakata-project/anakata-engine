import { ANALYTICS_STORAGE_KEY, readStoredConsent, remoteConsentRevoked } from '../utils/analyticsConsent'
import { captureLanding } from '../utils/attribution'
import { ensureSession } from '../utils/engineSession'
import { bindSessionStore, configureEngineQueue, isSamePagePath, queuePageView, scheduleUnloadFlush, setEngineConsent } from '../utils/engineQueue'
import { configureTrack, revokeTracking, trackingConsent } from '../composables/useTrack'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const router = useRouter()
  const measurement = config.public.gaMeasurementId
  const measurementId = typeof measurement === 'string' ? measurement.trim() : ''

  configureEngineQueue(String(config.public.apiBase))
  bindSessionStore(localStorage)

  if (readStoredConsent(localStorage) === 'accepted') {
    configureTrack('accepted', measurementId)
    setEngineConsent(true, ensureSession(localStorage, Date.now()))
  }

  let opened = false

  router.afterEach((to, from) => {
    captureLanding(
      to.query,
      to.path,
      new Date().toISOString(),
      trackingConsent() === 'accepted',
      sessionStorage,
      localStorage
    )

    if (!opened) {
      opened = true
      queuePageView(to.path)

      return
    }

    if (isSamePagePath(from.path, to.path)) {
      return
    }

    queuePageView(to.path)
  })

  window.addEventListener('pagehide', () => {
    scheduleUnloadFlush()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      scheduleUnloadFlush()
    }
  })

  window.addEventListener('storage', (event) => {
    if (event.key !== ANALYTICS_STORAGE_KEY) {
      return
    }

    if (!remoteConsentRevoked(event.newValue)) {
      return
    }

    revokeTracking()
  })
})
