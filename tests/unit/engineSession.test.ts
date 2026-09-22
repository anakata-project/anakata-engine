import { describe, expect, it, vi } from 'vitest'
import {
  clearSession,
  createSessionId,
  ensureSession,
  readSession,
  SESSION_IDLE_MS,
  SESSION_STORAGE_KEY
} from '../../app/utils/engineSession'

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

describe('engine session id', () => {
  it('does not throw when randomUUID is missing or throws', () => {
    const cryptoObj = globalThis.crypto
    vi.stubGlobal('crypto', { randomUUID: undefined })
    expect(createSessionId()).toBeNull()
    expect(() => ensureSession(memory(), Date.now())).not.toThrow()
    expect(ensureSession(memory(), Date.now())).toBeNull()

    vi.stubGlobal('crypto', {
      randomUUID() {
        throw new Error('insecure')
      }
    })
    expect(createSessionId()).toBeNull()
    expect(() => ensureSession(memory(), Date.now())).not.toThrow()

    vi.stubGlobal('crypto', cryptoObj)
    vi.unstubAllGlobals()
  })

  it('rotates after 30 days of inactivity and clears on withdrawal', () => {
    const storage = memory()
    const now = Date.now()
    const id = ensureSession(storage, now)

    expect(id).toMatch(/^[A-Za-z0-9_-]{16,64}$/)
    expect(readSession(storage, now + SESSION_IDLE_MS)).toBe(id)
    expect(readSession(storage, now + SESSION_IDLE_MS + 1)).toBeNull()

    const rotated = ensureSession(storage, now + SESSION_IDLE_MS + 1)

    expect(rotated).not.toBe(id)
    expect(storage.getItem(SESSION_STORAGE_KEY)).toContain(rotated)

    clearSession(storage)
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
