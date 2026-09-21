import { describe, expect, it } from 'vitest'
import { onlineDepositForPath, requiredDeclarations } from '../../app/utils/pathQuote'

describe('path switching', () => {
  it('requotes with the online advantage only on PAY_DEPOSIT', () => {
    expect(onlineDepositForPath('PAY_LATER')).toBe(false)
    expect(onlineDepositForPath('PAY_DEPOSIT')).toBe(true)
  })

  it('requires four declarations for the deposit path', () => {
    expect(requiredDeclarations('PAY_DEPOSIT')).toEqual([
      'TERMS',
      'CANCELLATION',
      'PRIVACY',
      'INSURANCE'
    ])
    expect(requiredDeclarations('PAY_LATER')).toEqual(['PRIVACY', 'INSURANCE'])
  })
})
