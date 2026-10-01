import { describe, expect, it } from 'vitest'
import { stepMark } from '../../app/utils/flowStep'

describe('stepMark', () => {
  it('marks earlier steps done and the active step current', () => {
    expect(stepMark(2, 1)).toBe('done')
    expect(stepMark(2, 2)).toBe('current')
    expect(stepMark(2, 3)).toBe('upcoming')
  })

  it('marks every step upcoming when there is no flow step', () => {
    expect(stepMark(null, 1)).toBe('upcoming')
  })
})
