import type { AnalyticsConsent } from '../utils/analyticsConsent'
import { analyticsAllowed } from '../utils/analyticsConsent'

export type TrackParams = Record<string, string | number | boolean | undefined>

type GtagFn = (...args: Array<unknown>) => void

let consent: AnalyticsConsent = 'unset'
let measurementId = ''
let gtagLoaded = false

export function configureTrack(nextConsent: AnalyticsConsent, id: string): void {
  consent = nextConsent
  measurementId = id.trim()
}

export function resetTrackForTests(): void {
  consent = 'unset'
  measurementId = ''
  gtagLoaded = false
}

export function loadGtag(id: string, doc?: Document): void {
  const measurement = id.trim()

  if (!measurement || gtagLoaded || !doc) {
    return
  }

  const win = doc.defaultView as (Window & { dataLayer?: Array<unknown>, gtag?: GtagFn }) | null

  if (!win) {
    return
  }

  win.dataLayer = win.dataLayer ?? []
  win.gtag = function gtag(...args: Array<unknown>) {
    win.dataLayer?.push(args)
  }
  win.gtag('js', new Date())
  win.gtag('config', measurement)

  const script = doc.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurement)}`
  doc.head.appendChild(script)
  gtagLoaded = true
}

export function track(event: string, params?: TrackParams): void {
  if (!analyticsAllowed(consent, measurementId)) {
    return
  }

  const win = typeof window === 'undefined'
    ? undefined
    : (window as Window & { gtag?: GtagFn })

  if (typeof win?.gtag !== 'function') {
    return
  }

  win.gtag('event', event, params ?? {})
}
