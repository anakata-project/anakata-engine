import { describe, expect, it } from 'vitest'
import type { UnsubscribeView } from '../../app/types/api'
import { unsubscribeConfirmed, unsubscribeScreen } from '../../app/utils/unsubscribePage'

function view(flag: UnsubscribeView['already_unsubscribed']): UnsubscribeView {
  return { valid: true, already_unsubscribed: flag }
}

describe('unsubscribe page', () => {
  it('confirms a runtime boolean and the generated string', () => {
    expect(unsubscribeConfirmed('true')).toBe(true)
    expect(unsubscribeConfirmed('false')).toBe(false)
    expect(unsubscribeConfirmed(true as unknown as UnsubscribeView['already_unsubscribed'])).toBe(true)
    expect(unsubscribeConfirmed(false as unknown as UnsubscribeView['already_unsubscribed'])).toBe(false)
  })

  it('maps a valid token, a withdrawn token, and an unknown token', () => {
    expect(unsubscribeScreen(view('false'), false)).toBe('prompt')
    expect(unsubscribeScreen(view('true'), false)).toBe('confirmed')
    expect(unsubscribeScreen(null, true)).toBe('unknown')
    expect(unsubscribeScreen(null, false)).toBeNull()
  })
})
