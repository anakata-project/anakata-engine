import { describe, expect, it } from 'vitest'
import { buildEngineEvent } from '../../app/utils/engineEvents'
import type { EngineEventParams } from '../../app/types/api'

describe('engine event payloads', () => {
  it('sends search_availability with empty params when no itinerary code is known', () => {
    expect(buildEngineEvent('search_availability', {})).toEqual({
      name: 'search_availability',
      params: {}
    })
  })

  it('returns null when a required key is missing', () => {
    expect(buildEngineEvent('select_departure', { itinerary_code: 'WEST' })).toBeNull()
    expect(buildEngineEvent('select_departure', { departure_id: 12 })).toBeNull()
    expect(buildEngineEvent('page_view', {})).toBeNull()
  })

  it('drops an invalid optional value and keeps the event', () => {
    const built = buildEngineEvent('submit_booking_request', {
      itinerary_code: 'WEST',
      departure_id: 12,
      cabin_count: 1,
      path: 'PAY_LATER',
      currency: 'USD',
      value: 211500.5
    })

    expect(built).not.toBeNull()
    expect(built?.params.value).toBeUndefined()
    expect(built?.params.currency).toBe('USD')
    expect(built?.params.path).toBe('PAY_LATER')
  })

  it('drops unknown keys and unknown names', () => {
    const params = {
      itinerary_code: 'WEST',
      adults: 2
    } as EngineEventParams

    expect(buildEngineEvent('view_itinerary', params)?.params).toEqual({
      itinerary_code: 'WEST'
    })
    expect(buildEngineEvent('purchase', {})).toBeNull()
    expect(buildEngineEvent('identity.stitched', { count: 1 } as EngineEventParams)).toBeNull()
  })

  it('rejects a payment path that is not the checkout enum', () => {
    expect(buildEngineEvent('select_payment_path', {
      path: 'online' as 'PAY_LATER'
    })).toBeNull()
  })

  it('redacts a complete-page path and strips the query', () => {
    expect(buildEngineEvent('page_view', {
      page_path: '/complete/secret-token?utm_source=meta'
    })?.params.page_path).toBe('/complete/[token]')
  })

  it('redacts questionnaire and survey paths and strips the query', () => {
    expect(buildEngineEvent('page_view', {
      page_path: '/questionnaire/secret-token?utm_source=mail'
    })?.params.page_path).toBe('/questionnaire/[token]')
    expect(buildEngineEvent('page_view', {
      page_path: '/survey/secret-token?utm_source=mail'
    })?.params.page_path).toBe('/survey/[token]')
  })
})
