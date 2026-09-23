import { describe, expect, it } from 'vitest'
import { acceptBlocked, proposalFormState } from '../../app/utils/charterProposal'

describe('charter proposal page', () => {
  it('refuses an empty name or an unticked box before posting', () => {
    expect(acceptBlocked('', true)).toBe(true)
    expect(acceptBlocked('   ', true)).toBe(true)
    expect(acceptBlocked('Ada Lovelace', false)).toBe(true)
    expect(acceptBlocked('Ada Lovelace', true)).toBe(false)
  })

  it('renders expired and already-accepted states from the API status', () => {
    expect(proposalFormState({ state: 'ACCEPTED', expired: false })).toBe('accepted')
    expect(proposalFormState({ state: 'QUOTED', expired: true })).toBe('expired')
    expect(proposalFormState({ state: 'DECLINED', expired: false })).toBe('declined')
    expect(proposalFormState({ state: 'QUOTED', expired: false })).toBe('open')
  })
})
