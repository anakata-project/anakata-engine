export function charterGuestsOk(guests: number, capacity: number): boolean {
  return Number.isInteger(guests) && guests >= 1 && guests <= capacity
}

export function charterMessage(context: string, notes: string): string {
  const group = context.trim()
  const body = notes.trim()

  if (group && body) {
    return `${group}\n\n${body}`
  }

  return group || body
}
