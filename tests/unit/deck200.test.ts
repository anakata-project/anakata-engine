import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DECK_200_SUITES, paintDeck200, type Deck200SuiteStatus } from '../../app/utils/deck200'

const svg = readFileSync(new URL('../../app/assets/svg/yacht-deck-200.svg', import.meta.url), 'utf8')

describe('paintDeck200', () => {
  it('paints every suite booked, the suite 4 and suite 7 outline', () => {
    const painted = paintDeck200(svg)

    for (const code of DECK_200_SUITES) {
      expect(painted).toContain(`id="suite-${code}" class="suite is-booked" aria-pressed="false"`)
    }
  })

  it('applies a live status and leaves the other suites booked', () => {
    const painted = paintDeck200(svg, {
      4: 'available',
      6: 'hold',
      owner: 'selected'
    })

    expect(painted).toContain('id="suite-4" class="suite is-available" aria-pressed="false"')
    expect(painted).toContain('id="suite-6" class="suite is-hold" aria-pressed="false"')
    expect(painted).toContain('id="suite-owner" class="suite is-selected" aria-pressed="true"')
    expect(painted).toContain('id="suite-7" class="suite is-booked" aria-pressed="false"')
    expect(painted).toContain('id="suite-3" class="suite is-booked" aria-pressed="false"')
  })

  it('ignores an unknown status', () => {
    const painted = paintDeck200(svg, { 3: 'nope' as Deck200SuiteStatus })

    expect(painted).toContain('id="suite-3" class="suite is-booked" aria-pressed="false"')
  })
})
