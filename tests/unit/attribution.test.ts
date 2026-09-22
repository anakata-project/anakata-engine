import { describe, expect, it } from 'vitest'
import {
  attributionForCheckout,
  attributionWithoutConsent,
  captureLanding,
  clearPersistedTouches,
  FIRST_TOUCH_KEY,
  LAST_TOUCH_KEY,
  promoteSessionTouch,
  SESSION_TOUCH_KEY,
  writeSessionTouch
} from '../../app/utils/attribution'

function memory(): Storage {
  const items = new Map<string, string>()

  return {
    get length() {
      return items.size
    },
    clear() {
      items.clear()
    },
    getItem(key: string) {
      return items.get(key) ?? null
    },
    key() {
      return null
    },
    removeItem(key: string) {
      items.delete(key)
    },
    setItem(key: string, value: string) {
      items.set(key, value)
    }
  }
}

describe('utm attribution', () => {
  it('keeps the session touch without consent and does not persist first touch', () => {
    const session = memory()
    const local = memory()

    captureLanding(
      { utm_source: 'meta', utm_campaign: 'west' },
      '/itineraries?utm_source=meta',
      '2026-09-21T12:00:00.000Z',
      false,
      session,
      local
    )

    expect(session.getItem(SESSION_TOUCH_KEY)).toContain('meta')
    expect(local.getItem(FIRST_TOUCH_KEY)).toBeNull()
    expect(local.getItem(LAST_TOUCH_KEY)).toBeNull()

    const sent = attributionForCheckout(false, session, local)

    expect(sent).toEqual(attributionWithoutConsent(JSON.parse(session.getItem(SESSION_TOUCH_KEY) ?? 'null')))
    expect(sent?.first_touch?.source).toBe('meta')
    expect(sent?.last_touch?.source).toBe('meta')
    expect(sent?.first_touch?.landing_path).toBe('/itineraries')
  })

  it('writes first touch once and updates last touch on a new utm landing', () => {
    const session = memory()
    const local = memory()

    captureLanding({ utm_source: 'meta' }, '/', '2026-09-21T12:00:00.000Z', true, session, local)
    captureLanding({ utm_source: 'newsletter' }, '/charter', '2026-09-22T12:00:00.000Z', true, session, local)
    captureLanding({}, '/book/cabins', '2026-09-23T12:00:00.000Z', true, session, local)

    const first = JSON.parse(local.getItem(FIRST_TOUCH_KEY) ?? '{}') as { source?: string }
    const last = JSON.parse(local.getItem(LAST_TOUCH_KEY) ?? '{}') as { source?: string }

    expect(first.source).toBe('meta')
    expect(last.source).toBe('newsletter')
  })

  it('promotes the session touch when consent is given later', () => {
    const session = memory()
    const local = memory()
    const touch = {
      source: 'meta',
      landing_path: '/',
      captured_at: '2026-09-21T12:00:00.000Z'
    }

    writeSessionTouch(touch, session)
    promoteSessionTouch(session, local)

    expect(JSON.parse(local.getItem(FIRST_TOUCH_KEY) ?? '{}')).toEqual(touch)
  })

  it('clears persisted touches on withdrawal and still sends the session touch', () => {
    const session = memory()
    const local = memory()

    captureLanding({ utm_source: 'meta' }, '/', '2026-09-21T12:00:00.000Z', true, session, local)
    clearPersistedTouches(local)

    expect(local.getItem(FIRST_TOUCH_KEY)).toBeNull()
    expect(local.getItem(LAST_TOUCH_KEY)).toBeNull()
    expect(attributionForCheckout(false, session, local)?.first_touch?.source).toBe('meta')
  })

  it('omits attribution when there is no session touch and no consent', () => {
    expect(attributionWithoutConsent(null)).toBeNull()
    expect(attributionForCheckout(false, memory(), memory())).toBeNull()
  })
})
