import type { CharterProposalView } from '../types/api'

export type ProposalFormState = 'open' | 'accepted' | 'declined' | 'expired'

export function proposalFormState(view: Pick<CharterProposalView, 'state' | 'expired'>): ProposalFormState {
  if (view.state === 'ACCEPTED') {
    return 'accepted'
  }

  if (view.state === 'DECLINED' || view.state === 'CLOSED') {
    return 'declined'
  }

  if (view.expired || view.state !== 'QUOTED') {
    return 'expired'
  }

  return 'open'
}

export function acceptBlocked(name: string, terms: boolean): boolean {
  return name.trim() === '' || !terms
}
