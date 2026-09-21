<script setup lang="ts">
import type { EngineSettings } from '../../types/api'
import {
  applyMonthClick,
  buildMonthGrid,
  formatMonthShort,
  MONTHS,
  type MonthPick
} from '../../utils/engineFlow'

const props = defineProps<{
  settings: EngineSettings
}>()

const emit = defineEmits<{
  search: []
}>()

const { t } = useI18n()
const { flow, hydrateFromSettings } = useBookingFlow()

hydrateFromSettings(props.settings)

const pickPhase = ref<MonthPick['phase']>(0)
const openPop = ref<'dates' | 'guests' | null>(null)

const grid = computed(() =>
  buildMonthGrid(
    props.settings.calendar.first_bookable_month,
    props.settings.calendar.horizon_months
  )
)

const dateLabel = computed(() =>
  flow.value.fromMonth && flow.value.toMonth
    ? `${formatMonthShort(flow.value.fromMonth)} — ${formatMonthShort(flow.value.toMonth)}`
    : ''
)

const guestLabel = computed(() => {
  const adults = t('search.adultsCount', { n: flow.value.adults })
  if (flow.value.children === 0) {
    return adults
  }

  return `${adults} · ${t('search.childrenCount', { n: flow.value.children })}`
})

const dateHint = computed(() => {
  if (pickPhase.value === 1) {
    return t('search.hintEnd')
  }

  if (flow.value.fromMonth) {
    return t('search.hintSet')
  }

  return t('search.hintStart')
})

const childHint = computed(() =>
  t('search.childAges', {
    min: props.settings.guests.child_min_age,
    max: props.settings.guests.child_max_age,
    under: props.settings.guests.under_age_message
  })
)

const maxParty = computed(() => props.settings.guests.max_per_yacht)

function toggle(which: 'dates' | 'guests'): void {
  openPop.value = openPop.value === which ? null : which
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
  emit('search')
}

function onDocClick(): void {
  openPop.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div>
    <span class="mono klabel">{{ t('search.find') }}</span>
    <div class="bookwrap">
      <div class="bookbar">
        <div
          class="bb"
          :class="{ open: openPop === 'dates' }"
          @click.stop="toggle('dates')"
        >
          <label>{{ t('search.dates') }}</label>
          <div class="val">
            {{ dateLabel }}
          </div>
          <div
            v-if="openPop === 'dates'"
            class="pop on"
            @click.stop
          >
            <template
              v-for="year in grid"
              :key="year.year"
            >
              <div class="yr">
                {{ year.year }}
              </div>
              <div class="mgrid">
                <button
                  v-for="cell in year.months"
                  :key="cell.ym"
                  type="button"
                  :class="monthClass(cell.ym, cell.disabled)"
                  :disabled="cell.disabled"
                  @click="pickMonth(cell.ym, cell.disabled)"
                >
                  {{ MONTHS[cell.month] }}
                </button>
              </div>
            </template>
            <div class="hint">
              {{ dateHint }}
            </div>
          </div>
        </div>
        <div
          class="bb"
          :class="{ open: openPop === 'guests' }"
          @click.stop="toggle('guests')"
        >
          <label>{{ t('search.guests') }}</label>
          <div class="val">
            {{ guestLabel }}
          </div>
          <div
            v-if="openPop === 'guests'"
            class="pop gpop on"
            @click.stop
          >
            <div class="grow">
              <div class="gl">
                {{ t('search.adults') }}
              </div>
              <div class="stepper">
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
                  ＋
                </button>
              </div>
            </div>
            <div class="grow">
              <div class="gl">
                {{ t('search.children') }}
                <small>{{ childHint }}</small>
              </div>
              <div class="stepper">
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
                  ＋
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="bb act">
          <button
            type="button"
            @click="onSearch"
          >
            {{ t('search.check') }}
          </button>
        </div>
      </div>
    </div>
    <p class="bbnote">
      {{ t('search.footnote', {
        maxCabin: settings.guests.max_per_cabin,
        maxYacht: settings.guests.max_per_yacht
      }) }}
      <template v-if="settings.guests.adult_required_with_children">
        {{ t('search.footnoteAdult') }}
      </template>
    </p>
  </div>
</template>
