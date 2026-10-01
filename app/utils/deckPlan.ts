export const DECK_SUITE_STATUSES = ['available', 'hold', 'booked', 'selected'] as const

export type DeckSuiteStatus = typeof DECK_SUITE_STATUSES[number]

const STATUSES = new Set<string>(DECK_SUITE_STATUSES)

/**
 * Paints suite groups in a deck drawing. Missing and unknown statuses stay
 * booked, the dashed outline.
 */
export function paintDeck<Code extends string>(
  svg: string,
  codes: ReadonlyArray<Code>,
  statuses: Partial<Record<Code, DeckSuiteStatus>> = {}
): string {
  const allowed = new Set<string>(codes)

  return svg.replace(
    /id="suite-([^"]+)" class="suite"/g,
    (match, code: string) => {
      if (!allowed.has(code)) {
        return match
      }

      const requested = statuses[code as Code]
      const status = requested !== undefined && STATUSES.has(requested) ? requested : 'booked'
      const pressed = status === 'selected' ? 'true' : 'false'

      return `id="suite-${code}" class="suite is-${status}" aria-pressed="${pressed}"`
    }
  )
}
