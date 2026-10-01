import { paintDeck, type DeckSuiteStatus } from './deckPlan'

export const DECK_200_SUITES = ['owner', '3', '4', '5', '6', '7', '8'] as const

export type Deck200SuiteCode = typeof DECK_200_SUITES[number]

export type Deck200SuiteStatus = DeckSuiteStatus

export function paintDeck200(
  svg: string,
  statuses: Partial<Record<Deck200SuiteCode, Deck200SuiteStatus>> = {}
): string {
  return paintDeck(svg, DECK_200_SUITES, statuses)
}
