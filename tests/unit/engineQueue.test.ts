import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EngineEventsInput } from '../../app/types/api'
import {
  configureEngineQueue,
  discardEngineQueue,
  enqueueEngineEvent,
  flushEngineQueue,
  isSamePagePath,
  pendingEngineEvents,
  queuePageView,
  resetEngineQueueForTests,
  scheduleUnloadFlush,
  setEngineConsent
} from '../../app/utils/engineQueue'

const SESSION = 'session-id-abc123'

function harness() {
  const bodies: Array<EngineEventsInput> = []
  const post = vi.fn(async (body: EngineEventsInput) => {
    bodies.push(body)

    return 204 as const
  })
  const beacon = vi.fn((body: EngineEventsInput) => {
    bodies.push(body)
  })

  configureEngineQueue('http://api.test', { post, beacon })
  setEngineConsent(true, SESSION)

  return { post, beacon, bodies }
}

describe('engine event queue', () => {
  afterEach(() => {
    resetEngineQueueForTests()
    vi.useRealTimers()
  })

  it('does not queue a page view before consent, and does on accept', () => {
    resetEngineQueueForTests()
    queuePageView('/itineraries')
    expect(pendingEngineEvents()).toHaveLength(0)

    setEngineConsent(true, SESSION)
    queuePageView('/itineraries')
    queuePageView('/complete/secret')

    const pending = pendingEngineEvents()

    expect(pending.map(event => event.name)).toEqual(['page_view', 'page_view'])
    expect(pending[0]?.params.page_path).toBe('/itineraries')
    expect(pending[1]?.params.page_path).toBe('/complete/[token]')
    expect(isSamePagePath('/itineraries', '/itineraries')).toBe(true)
    expect(isSamePagePath('/', '/itineraries')).toBe(false)
  })

  it('retries a 5xx or a network error once and drops a 422', async () => {
    const { post } = harness()
    post.mockResolvedValueOnce(500).mockResolvedValueOnce(204)
    enqueueEngineEvent('search_availability')
    await flushEngineQueue('fetch')

    expect(post).toHaveBeenCalledTimes(2)
    const first = post.mock.calls[0]?.[0]
    const second = post.mock.calls[1]?.[0]
    expect(first?.events[0]?.event_id).toBe(second?.events[0]?.event_id)

    post.mockClear()
    post.mockResolvedValueOnce(422)
    enqueueEngineEvent('search_availability')
    await flushEngineQueue('fetch')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('retries a thrown network error once and does not throw', async () => {
    const { post } = harness()
    post.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(204)
    enqueueEngineEvent('search_availability')

    await expect(flushEngineQueue('fetch')).resolves.toBeUndefined()
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('discards a batch held for retry when consent is withdrawn', async () => {
    let resolvePost: (status: number) => void = () => {}
    const post = vi.fn(() => new Promise<number>((resolve) => {
      resolvePost = resolve
    }))
    configureEngineQueue('http://api.test', { post, beacon: vi.fn() })
    setEngineConsent(true, SESSION)
    enqueueEngineEvent('search_availability')

    const pending = flushEngineQueue('fetch')
    await Promise.resolve()
    expect(post).toHaveBeenCalledTimes(1)

    discardEngineQueue()
    resolvePost(500)
    await pending

    expect(post).toHaveBeenCalledTimes(1)
    expect(pendingEngineEvents()).toHaveLength(0)
  })

  it('cancels the flush timer on refuse', async () => {
    vi.useFakeTimers()
    const { post } = harness()
    enqueueEngineEvent('search_availability')
    discardEngineQueue()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(post).not.toHaveBeenCalled()
  })

  it('sends abandon_cart that was queued before the unload flush runs', async () => {
    const { beacon } = harness()
    scheduleUnloadFlush()
    enqueueEngineEvent('abandon_cart', {
      itinerary_code: 'WEST',
      departure_id: 12,
      step: 'details',
      cabin_count: 1
    })
    expect(beacon).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(beacon).toHaveBeenCalledTimes(1)
    expect(beacon.mock.calls[0]?.[0].events[0]?.name).toBe('abandon_cart')
  })

  it('flushes pagehide and visibilitychange once', async () => {
    const { beacon } = harness()
    enqueueEngineEvent('search_availability')
    scheduleUnloadFlush()
    scheduleUnloadFlush()
    await Promise.resolve()
    await Promise.resolve()
    expect(beacon).toHaveBeenCalledTimes(1)
  })
})
