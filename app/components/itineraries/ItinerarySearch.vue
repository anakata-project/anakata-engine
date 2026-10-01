<script setup lang="ts">
import type { EngineSettings } from '../../types/api'
import {
  applyMonthClick,
  buildMonthGrid,
  formatMonthShort,
  MONTHS,
  parseYm,
  type MonthPick
} from '../../utils/engineFlow'

const props = defineProps<{
  settings: EngineSettings
}>()

const { t } = useI18n()
const { flow, hydrateFromSettings } = useBookingFlow()

hydrateFromSettings(props.settings)

const pickPhase = ref<MonthPick['phase']>(0)
const yearOverride = ref<number | null>(null)
const mOpen = ref<'dates' | 'guests' | null>(null)

const grid = computed(() =>
  buildMonthGrid(
    props.settings.calendar.first_bookable_month,
    props.settings.calendar.horizon_months
  )
)

const activeYear = computed(() => {
  if (yearOverride.value !== null) {
    return yearOverride.value
  }

  if (flow.value.fromMonth) {
    return parseYm(flow.value.fromMonth)[0]
  }

  return grid.value[0]?.year ?? 0
})

const yearBlock = computed(() =>
  grid.value.find(year => year.year === activeYear.value) ?? grid.value[0]
)

const childHint = computed(() => t('search.childAgesLabel'))

const dateLabel = computed(() => {
  const from = flow.value.fromMonth
  const to = flow.value.toMonth

  if (!from || !to) {
    return ''
  }

  if (from === to) {
    return formatMonthShort(from)
  }

  return `${formatMonthShort(from)} — ${formatMonthShort(to)}`
})

const guestLabel = computed(() => {
  const adults = t('search.adultsCount', { n: flow.value.adults })

  if (flow.value.children === 0) {
    return adults
  }

  return `${adults} · ${t('search.childrenCount', { n: flow.value.children })}`
})

const maxParty = computed(() => props.settings.guests.max_per_yacht)

function toggleMobile(which: 'dates' | 'guests'): void {
  mOpen.value = mOpen.value === which ? null : which
}

function showYear(year: number): void {
  yearOverride.value = year
}

function pickMonth(ym: string, disabled: boolean): void {
  if (disabled) {
    return
  }

  const next = applyMonthClick({
    from: flow.value.fromMonth || ym,
    to: flow.value.toMonth || ym,
    phase: pickPhase.value
  }, ym)

  flow.value.fromMonth = next.from
  flow.value.toMonth = next.to
  pickPhase.value = next.phase
}

function stepAdults(delta: number): void {
  const next = flow.value.adults + delta
  flow.value.adults = Math.max(1, Math.min(maxParty.value, next))
}

function stepChildren(delta: number): void {
  const next = flow.value.children + delta
  const room = Math.max(0, maxParty.value - flow.value.adults)
  flow.value.children = Math.max(0, Math.min(room, next))
}

function monthClass(ym: string, disabled: boolean): string {
  if (disabled) {
    return 'mn dis'
  }

  const from = flow.value.fromMonth
  const to = flow.value.toMonth

  if (!from || !to) {
    return 'mn'
  }

  if (ym === from || ym === to) {
    return 'mn sel'
  }

  if (ym > from && ym < to) {
    return 'mn inrange'
  }

  return 'mn'
}

function onSearch(): void {
  const target = document.getElementById('itinerary-results')
  if (!target) {
    return
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
}
</script>

<template>
  <aside class="itin-search">
    <div class="itin-desk">
      <section class="itin-panel">
        <div class="mono">
          {{ t('search.dates') }}
        </div>
        <div
          class="yr-tabs"
          role="tablist"
        >
          <button
            v-for="year in grid"
            :key="year.year"
            type="button"
            class="yr-tab"
            role="tab"
            :class="{ on: year.year === activeYear }"
            :aria-selected="year.year === activeYear"
            @click="showYear(year.year)"
          >
            {{ year.year }}
          </button>
        </div>
        <div
          v-if="yearBlock"
          class="mgrid"
        >
          <button
            v-for="cell in yearBlock.months"
            :key="cell.ym"
            type="button"
            :class="monthClass(cell.ym, cell.disabled)"
            :disabled="cell.disabled"
            :aria-pressed="cell.ym === flow.fromMonth || cell.ym === flow.toMonth"
            @click="pickMonth(cell.ym, cell.disabled)"
          >
            {{ MONTHS[cell.month] }}
          </button>
        </div>
      </section>
      <section class="itin-panel">
        <div class="mono">
          {{ t('search.guests') }}
        </div>
        <div class="itin-guest">
          <div class="itin-gl">
            {{ t('search.adults') }}
          </div>
          <div class="gstep">
            <button
              type="button"
              @click="stepAdults(-1)"
            >
              −
            </button>
            <span class="n">{{ flow.adults }}</span>
            <button
              type="button"
              @click="stepAdults(1)"
            >
              +
            </button>
          </div>
        </div>
        <div class="itin-guest">
          <div class="itin-gl">
            {{ t('search.children') }}
            <small>{{ childHint }}</small>
          </div>
          <div class="gstep">
            <button
              type="button"
              @click="stepChildren(-1)"
            >
              −
            </button>
            <span class="n">{{ flow.children }}</span>
            <button
              type="button"
              @click="stepChildren(1)"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="button"
          class="search-btn"
          @click="onSearch"
        >
          {{ t('search.search') }}
        </button>
      </section>
    </div>
    <div class="itin-mfind">
      <div class="itin-mbox">
        <button
          type="button"
          class="itin-mrow"
          :aria-expanded="mOpen === 'dates'"
          @click="toggleMobile('dates')"
        >
          <span class="mono">{{ t('search.date') }}</span>
          <span class="itin-mval">{{ dateLabel }}</span>
        </button>
        <div
          v-if="mOpen === 'dates'"
          class="itin-mpop"
        >
          <div
            class="yr-tabs"
            role="tablist"
          >
            <button
              v-for="year in grid"
              :key="year.year"
              type="button"
              class="yr-tab"
              role="tab"
              :class="{ on: year.year === activeYear }"
              :aria-selected="year.year === activeYear"
              @click="showYear(year.year)"
            >
              {{ year.year }}
            </button>
          </div>
          <div
            v-if="yearBlock"
            class="mgrid"
          >
            <button
              v-for="cell in yearBlock.months"
              :key="cell.ym"
              type="button"
              :class="monthClass(cell.ym, cell.disabled)"
              :disabled="cell.disabled"
              :aria-pressed="cell.ym === flow.fromMonth || cell.ym === flow.toMonth"
              @click="pickMonth(cell.ym, cell.disabled)"
            >
              {{ MONTHS[cell.month] }}
            </button>
          </div>
        </div>
        <button
          type="button"
          class="itin-mrow"
          :aria-expanded="mOpen === 'guests'"
          @click="toggleMobile('guests')"
        >
          <span class="mono">{{ t('search.guests') }}</span>
          <span class="itin-mval">{{ guestLabel }}</span>
        </button>
        <div
          v-if="mOpen === 'guests'"
          class="itin-mpop"
        >
          <div class="itin-guest">
            <div class="itin-gl">
              {{ t('search.adults') }}
            </div>
            <div class="gstep">
              <button
                type="button"
                @click="stepAdults(-1)"
              >
                −
              </button>
              <span class="n">{{ flow.adults }}</span>
              <button
                type="button"
                @click="stepAdults(1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="itin-guest">
            <div class="itin-gl">
              {{ t('search.children') }}
              <small>{{ childHint }}</small>
            </div>
            <div class="gstep">
              <button
                type="button"
                @click="stepChildren(-1)"
              >
                −
              </button>
              <span class="n">{{ flow.children }}</span>
              <button
                type="button"
                @click="stepChildren(1)"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="search-btn"
          @click="onSearch"
        >
          {{ t('search.check') }}
        </button>
      </div>
      <p class="itin-mnote">
        {{ t('search.footnote', {
          maxCabin: settings.guests.max_per_cabin,
          maxYacht: settings.guests.max_per_yacht
        }) }}
        <template v-if="settings.guests.adult_required_with_children">
          {{ t('search.footnoteAdult') }}
        </template>
      </p>
    </div>
  </aside>
</template>
