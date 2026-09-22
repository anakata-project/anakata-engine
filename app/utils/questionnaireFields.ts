export const PROVIDED_SENTINEL = 'provided'

export function questionnaireControlValue(restricted: boolean, stored: string): string {
  if (restricted && stored === PROVIDED_SENTINEL) {
    return ''
  }

  return stored
}

export function questionnaireShowsReplace(restricted: boolean, stored: string): boolean {
  return restricted && stored === PROVIDED_SENTINEL
}

/** The stored sentinel is never written back. An empty restricted answer keeps the previous value. */
export function questionnaireSubmitValue(restricted: boolean, entered: string): string {
  if (restricted && (entered === PROVIDED_SENTINEL || entered.trim() === '')) {
    return ''
  }

  return entered
}
