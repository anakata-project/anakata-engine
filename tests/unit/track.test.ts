import { describe, expect, it, vi } from 'vitest'
import * as trackModule from '../../app/composables/useTrack'

describe('track', () => {
  it('is callable and does not throw', () => {
    const spy = vi.spyOn(trackModule, 'track')
    expect(() => trackModule.track('search_availability', { adults: 2 })).not.toThrow()
    expect(spy).toHaveBeenCalledWith('search_availability', { adults: 2 })
    spy.mockRestore()
  })
})
