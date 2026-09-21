import type { EngineOffer, EngineQuote, EngineRates, EngineSettings } from '../types/api'
import type { CabinSelection } from './cabProblems'
import type { GuestFeeHint } from './pngEstimate'
import { pngEstimate } from './pngEstimate'
import { departureOffers, suitePpDouble } from './engineFlow'

export type EstimateLine = {
  label: string
  amount: number
  kind: 'base' | 'neg' | 'info' | 'total'
}

export type EstimateGroup = {
  name: string
  lines: Array<EstimateLine>
  total: number
}

export type PriceEstimate = {
  groups: Array<EstimateGroup>
  extras: Array<EstimateLine>
  invoiceTotal: number
  deposit: number
  balance: number
  depositPct: number
  balanceDays: number
}

function halfUp(value: number): number {
  return Math.round(value)
}

export function ownerPpDouble(rates: EngineRates, year: number): number {
  const table = rates.owner_pp_double as Record<string, number> | Array<number>

  if (Array.isArray(table)) {
    const index = rates.years.indexOf(year)

    return table[index] ?? 0
  }

  return table[String(year)] ?? 0
}

function cabinBase(
  rates: EngineRates,
  year: number,
  category: 'SUITE' | 'OWNER'
): number {
  return category === 'OWNER' ? ownerPpDouble(rates, year) : suitePpDouble(rates, year)
}

export function estimateCabin(
  rates: EngineRates,
  year: number,
  festive: boolean,
  category: 'SUITE' | 'OWNER',
  adults: number,
  children: number,
  offerPct: number | null,
  offerLabel: string | null
): EstimateGroup {
  const base = cabinBase(rates, year, category)
  const guests = adults + children
  const rules = rates.rules
  const lines: Array<EstimateLine> = []
  let total = base * guests

  const who = `${adults} adult${adults !== 1 ? 's' : ''}${children ? ` + ${children} child${children > 1 ? 'ren' : ''}` : ''}`
  lines.push({
    label: `${who} @ USD ${base.toLocaleString('en-US')} ppdo`,
    amount: base * guests,
    kind: 'base'
  })

  if (offerPct && offerLabel) {
    const discount = halfUp(base * offerPct / 100) * guests
    lines.push({ label: `${offerLabel} × ${guests}`, amount: -discount, kind: 'neg' })
    total -= discount
  }

  let childCount = 0

  if (!festive && children > 0) {
    childCount = Math.min(
      children,
      adults * rules.child_discounts_per_adult,
      rules.child_discounts_per_cabin
    )

    if (childCount > 0) {
      const discount = halfUp(base * rules.child_discount_pct / 100) * childCount
      lines.push({
        label: `Child discount −${rules.child_discount_pct}% ppdo × ${childCount}`,
        amount: -discount,
        kind: 'neg'
      })
      total -= discount
    }
  }

  if (guests === 1) {
    const supplement = halfUp(base * rules.single_supplement_pct / 100)
    lines.push({
      label: `Single supplement +${rules.single_supplement_pct}% ppdo`,
      amount: supplement,
      kind: 'base'
    })
    total += supplement
  }

  if (guests === 3 && !festive && childCount === 0) {
    const discount = halfUp(base * rules.triple_discount_pct / 100) * 3
    lines.push({
      label: `Triple sharing −${rules.triple_discount_pct}% ppdo × 3`,
      amount: -discount,
      kind: 'neg'
    })
    total -= discount
  }

  if (festive) {
    const extra = rules.festive_supplement_pp * guests
    lines.push({
      label: `Festive supplement +USD ${rules.festive_supplement_pp.toLocaleString('en-US')} × ${guests}`,
      amount: extra,
      kind: 'base'
    })
    total += extra
  }

  return { name: category === 'OWNER' ? 'Owner\'s Suite' : 'Suite', lines, total }
}

export function estimatePrice(input: {
  cabins: Array<CabinSelection>
  cabinCategories: Record<string, 'SUITE' | 'OWNER'>
  rates: EngineRates
  year: number
  festive: boolean
  offers: Array<EngineOffer>
  offerCodes: Array<string>
  settings: EngineSettings
  guests: Array<GuestFeeHint>
  onlineDeposit: boolean
}): PriceEstimate {
  const applied = departureOffers({ offers: input.offerCodes }, input.offers)
    .find(offer => offer.type === 'PCT' && offer.value !== null)
  const groups: Array<EstimateGroup> = []
  let cabinTotal = 0

  input.cabins.forEach((cabin, index) => {
    if (cabin.adults + cabin.children === 0) {
      return
    }

    const category = cabin.cabinCode
      ? (input.cabinCategories[cabin.cabinCode] ?? 'SUITE')
      : 'SUITE'
    const group = estimateCabin(
      input.rates,
      input.year,
      input.festive,
      category,
      cabin.adults,
      cabin.children,
      applied?.value ?? null,
      applied?.price_line ?? applied?.badge ?? null
    )
    const phys = cabin.cabinCode ? ` (${cabin.cabinCode})` : ' (Suite — pick on deck)'
    group.name = `Cabin ${index + 1}${phys}`
    groups.push(group)
    cabinTotal += group.total
  })

  const extras: Array<EstimateLine> = []
  const party = input.guests.length || input.cabins.reduce((sum, cabin) => sum + cabin.adults + cabin.children, 0)

  if (input.settings.fees.show_in_price_panel) {
    extras.push({
      label: `TCT transit card × ${party} — arranged with our team`,
      amount: input.settings.fees.tct_pp * party,
      kind: 'info'
    })
    extras.push({
      label: 'PNG entry fee (est.) — final category depends on each guest’s date of birth',
      amount: pngEstimate(input.settings, input.guests),
      kind: 'info'
    })
  }

  if (input.onlineDeposit) {
    // Preview only — the server quote replaces this line and amount (K7).
    extras.push({
      label: input.settings.copy.online_deposit_advantage,
      amount: 0,
      kind: 'neg'
    })
  }

  const depositPct = input.rates.terms.cabin_deposit_pct
  const deposit = halfUp(cabinTotal * depositPct / 100)

  return {
    groups,
    extras,
    invoiceTotal: cabinTotal,
    deposit,
    balance: cabinTotal - deposit,
    depositPct,
    balanceDays: input.rates.terms.cabin_balance_days
  }
}

export function quoteIsFinal(quote: EngineQuote | null): quote is EngineQuote {
  return quote !== null && quote.total !== null
}
