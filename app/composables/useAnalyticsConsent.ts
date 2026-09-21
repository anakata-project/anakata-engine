import type { AnalyticsConsent } from '../utils/analyticsConsent'
import { analyticsAllowed, readStoredConsent, writeStoredConsent } from '../utils/analyticsConsent'
import { configureTrack, loadGtag } from './useTrack'

export function useAnalyticsConsent() {
  const config = useRuntimeConfig()
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

    if (import.meta.client && analyticsAllowed(next, measurementId.value)) {
      loadGtag(measurementId.value, document)
    }
  }

  function accept(): void {
    writeStoredConsent('accepted', import.meta.client ? localStorage : undefined)
    apply('accepted')
  }

  function refuse(): void {
    writeStoredConsent('refused', import.meta.client ? localStorage : undefined)
    apply('refused')
  }

  onMounted(() => {
    apply(readStoredConsent(localStorage))
  })

  const showBanner = computed(() =>
    measurementId.value !== '' && consent.value === 'unset'
  )

  return {
    consent,
    measurementId,
    showBanner,
    accept,
    refuse
  }
}
