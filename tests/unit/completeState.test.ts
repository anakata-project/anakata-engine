import { describe, expect, it } from 'vitest'
import {
  completePayReady,
  declarationControl,
  invalidCompleteCopy,
  isMinorToday,
  passportFieldState
} from '../../app/utils/completeState'

describe('complete-page section states', () => {
  it('locks an already-accepted declaration with its version', () => {
    expect(declarationControl({ accepted: true, version: 'v3' })).toEqual({
      kind: 'locked',
      version: 'v3'
    })
  })

  it('keeps an unaccepted declaration as a live checkbox', () => {
    expect(declarationControl({ accepted: false, version: 'v3' })).toEqual({
      kind: 'live',
      version: 'v3'
    })
  })

  it('enables payment only when can_pay and a pay_url exist', () => {
    expect(completePayReady(true, 'https://pay.example/s')).toBe(true)
    expect(completePayReady(true, null)).toBe(false)
    expect(completePayReady(false, 'https://pay.example/s')).toBe(false)
  })

  it('never prefills a passport value, even when one is on file', () => {
    expect(passportFieldState(true)).toEqual({ onFile: true, value: '' })
    expect(passportFieldState(false)).toEqual({ onFile: false, value: '' })
  })

  it('uses one neutral invalid-link state', () => {
    expect(invalidCompleteCopy()).toBe('neutral')
  })

  it('shows the guardian block for a guest under 18 today', () => {
    expect(isMinorToday('2010-01-01', '2026-09-21')).toBe(true)
    expect(isMinorToday('2000-01-01', '2026-09-21')).toBe(false)
    expect(isMinorToday(null, '2026-09-21')).toBe(false)
  })
})
