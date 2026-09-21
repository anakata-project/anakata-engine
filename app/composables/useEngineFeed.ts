import type { EngineFeed } from '../types/api'

const FEED_KEY = 'engine-feed'
const REVALIDATE_MS = 15_000

export function useEngineFeed() {
  const { useFetch } = useApi()
  const result = useFetch<EngineFeed>('/api/engine/feed', {
    key: FEED_KEY,
    server: true
  })

  onMounted(() => {
    function refresh(): void {
      void result.refresh()
    }

    const timer = setInterval(refresh, REVALIDATE_MS)

    function onVisibility(): void {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    onUnmounted(() => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    })
  })

  return result
}
