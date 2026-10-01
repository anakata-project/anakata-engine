const DECK_NUMBERS = new Set(['1', '2', '3', '4', '5', '6', '7', '8'])

/** Maps an engine cabin label (`Suite 01`, `Owner's Suite`) onto a deck drawing id. */
export function deckCodeFor(label: string): string | null {
  if (/owner/i.test(label)) {
    return 'owner'
  }

  const match = label.match(/(\d+)/)
  const number = match?.[1] ? String(Number(match[1])) : null

  if (number && DECK_NUMBERS.has(number)) {
    return number
  }

  return null
}
