import { describe, expect, it } from 'vitest'
import {
  questionnaireControlValue,
  questionnaireShowsReplace,
  questionnaireSubmitValue
} from '../../app/utils/questionnaireFields'

describe('restricted questionnaire fields', () => {
  it('never pre-fills a provided answer and never sends the sentinel back', () => {
    expect(questionnaireControlValue(true, 'provided')).toBe('')
    expect(questionnaireShowsReplace(true, 'provided')).toBe(true)
    expect(questionnaireSubmitValue(true, 'provided')).toBe('')
    expect(questionnaireSubmitValue(true, '')).toBe('')
    expect(questionnaireSubmitValue(true, 'a ramp at the dock')).toBe('a ramp at the dock')
  })

  it('keeps an ordinary answer in the field', () => {
    expect(questionnaireControlValue(false, 'Soft')).toBe('Soft')
    expect(questionnaireShowsReplace(false, 'provided')).toBe(false)
    expect(questionnaireSubmitValue(false, 'Soft')).toBe('Soft')
  })
})
