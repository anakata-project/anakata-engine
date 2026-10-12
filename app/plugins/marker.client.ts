import markerSDK from '@marker.io/browser'

function markerProjectId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export default defineNuxtPlugin(() => {
  const project = markerProjectId(useRuntimeConfig().public.markerProjectId)

  if (project === '') {
    return
  }

  void markerSDK.loadWidget({
    project,
    customData: { app: 'engine' },
    networkRecording: {
      excludedKeys: ['password'],
      excludedDomains: ['api.stripe.com', 'js.stripe.com', 'm.stripe.com', 'hooks.stripe.com']
    }
  }).catch(() => {
    // A Marker outage must not block the app.
  })
})
