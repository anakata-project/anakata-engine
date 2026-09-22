import type { EngineEventParams, EngineEventsInput } from '../types/api'
import { buildEngineEvent } from './engineEvents'
import { createSessionId, ensureSession, touchSession } from './engineSession'
import { redactPagePath } from './pagePath'

export const FLUSH_MS = 5000
export const BATCH_MAX = 25

type QueuedEvent = EngineEventsInput['events'][number]

type PostResult = number | 'network'

export type EngineQueueTransport = {
  post: (body: EngineEventsInput) => Promise<PostResult>
  beacon: (body: EngineEventsInput) => void
}

let queue: Array<QueuedEvent> = []
let held: Array<QueuedEvent> | null = null
let generation = 0
let timer: ReturnType<typeof setInterval> | null = null
let consented = false
let sessionId: string | null = null
let sessionStore: Pick<Storage, 'getItem' | 'setItem'> | undefined
let endpoint = ''
let transport: EngineQueueTransport = defaultTransport()

export function configureEngineQueue(apiBase: string, next?: EngineQueueTransport): void {
  endpoint = eventsUrl(apiBase)

  if (next) {
    transport = next
  }
}

export function resetEngineQueueForTests(): void {
  discardEngineQueue()
  consented = false
  sessionId = null
  sessionStore = undefined
  endpoint = ''
  transport = defaultTransport()
  generation = 0
}

export function bindSessionStore(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined): void {
  sessionStore = storage
}

export function setEngineConsent(accepted: boolean, id: string | null): void {
  consented = accepted && id !== null
  sessionId = consented ? id : null

  if (consented) {
    startFlushTimer()

    return
  }

  stopFlushTimer()
}

export function engineQueueConsented(): boolean {
  return consented
}

export function enqueueEngineEvent(name: string, params?: EngineEventParams): void {
  try {
    if (!consented || !sessionId) {
      return
    }

    refreshSession()

    if (!consented || !sessionId) {
      return
    }

    const built = buildEngineEvent(name, params)

    if (!built) {
      return
    }

    const eventId = createSessionId()

    if (!eventId) {
      return
    }

    queue.push({
      event_id: eventId,
      name: built.name,
      occurred_at: new Date().toISOString(),
      params: built.params
    })

    if (queue.length >= BATCH_MAX) {
      void flushEngineQueue('fetch')
    }
  } catch {
    // analytics must never break the booking flow
  }
}

export function queuePageView(path: string): void {
  const pagePath = redactPagePath(path)

  if (!pagePath) {
    return
  }

  enqueueEngineEvent('page_view', { page_path: pagePath })
}

/** Same path, including a hash-only change, is not another page view. */
export function isSamePagePath(fromPath: string, toPath: string): boolean {
  return fromPath === toPath
}

/**
 * Runs after the synchronous pagehide / visibilitychange listeners, so
 * abandon_cart queued on those events is already in the batch.
 */
export function scheduleUnloadFlush(): void {
  queueMicrotask(() => {
    flushBeacon()
  })
}

export function discardEngineQueue(): void {
  generation += 1
  queue = []
  held = null
  consented = false
  sessionId = null
  stopFlushTimer()
}

export function pendingEngineEvents(): Array<QueuedEvent> {
  return queue.map(event => ({ ...event, params: { ...event.params } }))
}

export async function flushEngineQueue(mode: 'fetch' | 'beacon'): Promise<void> {
  if (mode === 'beacon') {
    flushBeacon()

    return
  }

  await flushFetch()
}

async function flushFetch(): Promise<void> {
  if (held || !sessionId || queue.length === 0) {
    return
  }

  const batch = queue.splice(0, BATCH_MAX)
  held = batch
  const gen = generation
  const body = payload(batch)
  let status: PostResult

  try {
    status = await transport.post(body)
  } catch {
    status = 'network'
  }

  if (gen !== generation) {
    return
  }

  if (shouldRetry(status)) {
    try {
      await transport.post(body)
    } catch {
      // dropped after one retry
    }
  }

  if (gen === generation) {
    held = null
  }
}

function flushBeacon(): void {
  if (!sessionId || queue.length === 0) {
    return
  }

  const batch = queue.splice(0, BATCH_MAX)

  try {
    transport.beacon(payload(batch))
  } catch {
    // beacon is best-effort
  }
}

function refreshSession(): void {
  if (!sessionStore) {
    return
  }

  const now = Date.now()
  const next = ensureSession(sessionStore, now)

  if (!next) {
    consented = false
    sessionId = null
    stopFlushTimer()

    return
  }

  sessionId = next
  touchSession(sessionStore, now)
}

function shouldRetry(status: PostResult): boolean {
  return status === 'network' || (typeof status === 'number' && status >= 500)
}

function payload(events: Array<QueuedEvent>): EngineEventsInput {
  return {
    session_id: sessionId ?? '',
    events
  }
}

function startFlushTimer(): void {
  if (timer !== null || typeof setInterval !== 'function') {
    return
  }

  timer = setInterval(() => {
    void flushEngineQueue('fetch')
  }, FLUSH_MS)
}

function stopFlushTimer(): void {
  if (timer === null) {
    return
  }

  clearInterval(timer)
  timer = null
}

function eventsUrl(apiBase: string): string {
  return `${apiBase.replace(/\/$/, '')}/api/engine/events`
}

function defaultTransport(): EngineQueueTransport {
  return {
    async post(body) {
      if (!endpoint) {
        return 'network'
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        return response.status
      } catch {
        return 'network'
      }
    },
    beacon(body) {
      if (!endpoint || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
        return
      }

      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
      navigator.sendBeacon(endpoint, blob)
    }
  }
}
