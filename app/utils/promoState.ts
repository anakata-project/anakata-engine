export type PromoPhase = 'empty' | 'invalid' | 'applied' | 'removed'

export type PromoState = {
  phase: PromoPhase
  code: string | null
  message: string
  locked: boolean
}

export function emptyPromo(): PromoState {
  return {
    phase: 'empty',
    code: null,
    message: '',
    locked: false
  }
}

export function applyPromoResult(
  current: PromoState,
  input: string,
  valid: boolean,
  reason: string | null,
  saveLabel: string | null
): PromoState {
  if (current.phase === 'applied') {
    return emptyPromo()
  }

  const code = input.trim().toUpperCase()

  if (!code) {
    return {
      phase: 'invalid',
      code: null,
      message: 'Enter a code',
      locked: false
    }
  }

  if (!valid) {
    return {
      phase: 'invalid',
      code: null,
      message: reason || 'This code is not valid',
      locked: false
    }
  }

  return {
    phase: 'applied',
    code,
    message: saveLabel ?? '',
    locked: true
  }
}

export function removePromoForReason(reason: string): PromoState {
  return {
    phase: 'removed',
    code: null,
    message: reason,
    locked: false
  }
}
