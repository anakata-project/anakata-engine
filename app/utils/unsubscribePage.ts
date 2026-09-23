import type { UnsubscribeView } from '../types/api'

export type UnsubscribeScreen = 'prompt' | 'confirmed' | 'unknown'

/**
 * The generated field is `string`. The JSON value is a boolean.
 * `String(true) === 'true'`. Comparing with `true` does not typecheck.
 */
export function unsubscribeConfirmed(flag: UnsubscribeView['already_unsubscribed']): boolean {
  return String(flag) === 'true'
}

export function unsubscribeScreen(
  view: UnsubscribeView | null,
  invalid: boolean
): UnsubscribeScreen | null {
  if (invalid) {
    return 'unknown'
  }

  if (!view) {
    return null
  }

  return unsubscribeConfirmed(view.already_unsubscribed) ? 'confirmed' : 'prompt'
}
