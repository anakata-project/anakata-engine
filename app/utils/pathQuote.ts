import type { CheckoutPath } from '../types/api'

export function onlineDepositForPath(path: CheckoutPath): boolean {
  return path === 'PAY_DEPOSIT'
}

export function requiredDeclarations(path: CheckoutPath): Array<string> {
  if (path === 'PAY_DEPOSIT') {
    return ['TERMS', 'CANCELLATION', 'PRIVACY', 'INSURANCE']
  }

  return ['PRIVACY', 'INSURANCE']
}
