import { describe, expect, it } from 'vitest'
import {
  NETWORK_FAILURE_COPY,
  RATE_LIMIT_COPY,
  engineErrorMessage,
  fieldErrors
} from '../../app/utils/engineError'

describe('engine errors', () => {
  it('uses the rate-limit copy on 429', () => {
    expect(engineErrorMessage({ status: 429 })).toBe(RATE_LIMIT_COPY)
  })

  it('uses the network copy when there is no status', () => {
    expect(engineErrorMessage(new Error('Failed to fetch'))).toBe(NETWORK_FAILURE_COPY)
  })

  it('surfaces the API message otherwise', () => {
    expect(engineErrorMessage({ status: 422, data: { message: 'A yacht takes up to 16 guests.' } }))
      .toBe('A yacht takes up to 16 guests.')
  })

  it('flattens Laravel field errors', () => {
    expect(fieldErrors({
      status: 422,
      errors: { 'contact.email': ['Enter a valid email'] }
    })).toEqual({ 'contact.email': 'Enter a valid email' })
  })
})
