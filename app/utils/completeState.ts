export type DeclarationControl = {
  kind: 'locked' | 'live'
  version: string
}

export type PassportFieldState = {
  onFile: boolean
  value: ''
}

export function declarationControl(row: { accepted: boolean, version: string }): DeclarationControl {
  return {
    kind: row.accepted ? 'locked' : 'live',
    version: row.version
  }
}

export function completePayReady(canPay: boolean, payUrl: string | null): boolean {
  return canPay && Boolean(payUrl)
}

export function passportFieldState(onFile: boolean): PassportFieldState {
  return {
    onFile,
    value: ''
  }
}

export function invalidCompleteCopy(): 'neutral' {
  return 'neutral'
}

export function isMinorToday(dob: string | null, todayIso?: string): boolean {
  if (!dob) {
    return false
  }

  const today = todayIso ?? new Date().toISOString().slice(0, 10)
  const [birthYear, birthMonth, birthDay] = dob.split('-').map(Number)
  const [year, month, day] = today.split('-').map(Number)

  if (!birthYear || !birthMonth || !birthDay || !year || !month || !day) {
    return false
  }

  let age = year - birthYear

  if (month < birthMonth || (month === birthMonth && day < birthDay)) {
    age -= 1
  }

  return age < 18
}
