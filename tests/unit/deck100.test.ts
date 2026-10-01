import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DECK_100_SUITES, paintDeck100, type Deck100SuiteStatus } from '../../app/utils/deck100'

const svg = readFileSync(new URL('../../app/assets/svg/yacht-deck-100.svg', import.meta.url), 'utf8')

describe('paintDeck100', () => {
  it('paints both suites booked, the dashed outline', () => {
    const painted = paintDeck100(svg)

    for (const code of DECK_100_SUITES) {
      expect(painted).toContain(`id="suite-${code}" class="suite is-booked" aria-pressed="false"`)
    }
  })

  it('applies a live status and leaves the other suite booked', () => {
    const painted = paintDeck100(svg, { 1: 'available', 2: 'selected' })

    expect(painted).toContain('id="suite-1" class="suite is-available" aria-pressed="false"')
    expect(painted).toContain('id="suite-2" class="suite is-selected" aria-pressed="true"')
  })

  it('ignores an unknown status', () => {
    const painted = paintDeck100(svg, { 1: 'nope' as Deck100SuiteStatus })

    expect(painted).toContain('id="suite-1" class="suite is-booked" aria-pressed="false"')
  })
})
