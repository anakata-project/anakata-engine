export type FlowStep = 1 | 2 | 3 | 4 | 5 | 6

export type StepMark = 'done' | 'current' | 'upcoming'

export function stepMark(current: FlowStep | null, item: FlowStep): StepMark {
  if (current === item) {
    return 'current'
  }

  if (current !== null && item < current) {
    return 'done'
  }

  return 'upcoming'
}
