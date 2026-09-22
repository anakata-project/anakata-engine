export function scaleValues(min: number | null, max: number | null): Array<number> {
  if (min === null || max === null || !Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    return []
  }

  const values: Array<number> = []

  for (let value = min; value <= max; value += 1) {
    values.push(value)
  }

  return values
}

export function scaleInBounds(min: number | null, max: number | null, value: number): boolean {
  return scaleValues(min, max).includes(value)
}
