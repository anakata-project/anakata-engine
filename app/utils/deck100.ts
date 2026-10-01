import { paintDeck, type DeckSuiteStatus } from './deckPlan'

export const DECK_100_SUITES = ['1', '2'] as const

export type Deck100SuiteCode = typeof DECK_100_SUITES[number]

export type Deck100SuiteStatus = DeckSuiteStatus

export function paintDeck100(
  svg: string,
  statuses: Partial<Record<Deck100SuiteCode, Deck100SuiteStatus>> = {}
): string {
  return paintDeck(svg, DECK_100_SUITES, statuses)
}
