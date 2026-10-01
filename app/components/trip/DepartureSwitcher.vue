<script setup lang="ts">
import type { EngineDeparture, EngineOffer, EngineRates } from '../../types/api'
import {
  fromPrice,
  inWindow,
  labelToneClass,
  minCabins,
  rowAction
} from '../../utils/engineFlow'
import yachtMark from '../../assets/svg/yacht.svg'

const props = defineProps<{
  departures: Array<EngineDeparture>
  selectedId: number
  rates: EngineRates
  offers: Array<EngineOffer>
  fromMonth: string
  toMonth: string
  party: number
  maxPerCabin: number
}>()

const emit = defineEmits<{
  select: [departure: EngineDeparture]
  waitlist: [departure: EngineDeparture]
}>()

const { t } = useI18n()
const min = computed(() => minCabins(props.party, props.maxPerCabin))
const showAll = ref(false)

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ordered = computed(() => {
  const rows = props.departures.slice().sort((a, b) => a.embark.localeCompare(b.embark))
  const inside = rows.filter(dep => inWindow(dep.embark, props.fromMonth, props.toMonth))
  const outside = rows.filter(dep => !inWindow(dep.embark, props.fromMonth, props.toMonth))

  return [...inside, ...outside]
})

const visible = computed(() =>
  showAll.value ? ordered.value : ordered.value.slice(0, 3)
)

const grouped = computed(() => {
  const groups: Array<{ year: number, rows: Array<EngineDeparture> }> = []

  for (const dep of visible.value) {
    const year = Number(dep.embark.slice(0, 4))
    const last = groups.at(-1)

    if (last && last.year === year) {
      last.rows.push(dep)
    } else {
      groups.push({ year, rows: [dep] })
    }
  }

  return groups
})

function formatDepDay(iso: string): string {
  const parts = iso.split('-')
  const month = Number(parts[1])
  const day = Number(parts[2])

  return `${SHORT_MONTHS[month - 1] ?? ''} ${day}`
}

function money(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}
</script>

<template>
  <div class="dth">
    {{ t('trip.chooseDate') }}
  </div>
  <div class="dtable">
    <template
      v-for="group in grouped"
      :key="group.year"
    >
      <div class="dep-year">
        {{ group.year }}
      </div>
      <div
        v-for="dep in group.rows"
        :key="dep.id"
        class="drow"
      >
        <div class="dd">
          <span>{{ formatDepDay(dep.embark) }}</span>
          <svg
            class="dep-arrow"
            width="16"
            height="8"
            viewBox="0 0 16 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 4h14M10.5 1 14 4l-3.5 3"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
          <span>{{ formatDepDay(dep.disembark) }}</span>
          <span
            v-if="!inWindow(dep.embark, fromMonth, toMonth)"
            class="outside"
          >· {{ t('itineraries.outside') }}</span>
        </div>
        <div class="dy">
          <img
            class="yacht-ico"
            :src="yachtMark"
            alt=""
            width="28"
            height="12"
          >
          <span>{{ dep.yacht }}{{ dep.note ? ` · ${dep.note}` : '' }}</span>
        </div>
        <div :class="labelToneClass(dep.label)">
          {{ dep.label }}
        </div>
        <div class="pr">
          <span :class="{ was: fromPrice(dep, rates, offers).pct }">
            {{ t('itineraries.rowFrom', { amount: money(fromPrice(dep, rates, offers).base) }) }}
          </span>
          <span
            v-if="fromPrice(dep, rates, offers).pct"
            class="nowpr"
          >
            {{ t('itineraries.rowDeal', {
              pct: fromPrice(dep, rates, offers).pct,
              amount: money(fromPrice(dep, rates, offers).now)
            }) }}
          </span>
        </div>
        <ItinerariesDepartureActions
          :action="rowAction(dep, min)"
          :departure="dep"
          :selected="dep.id === selectedId"
          compact
          @select="emit('select', $event)"
          @waitlist="emit('waitlist', $event)"
        />
      </div>
    </template>
  </div>
  <button
    v-if="ordered.length > 3"
    type="button"
    class="dates-more"
    :aria-expanded="showAll"
    @click="showAll = !showAll"
  >
    {{ t('trip.viewMore') }}
    <span
      class="dep-go"
      :class="{ open: showAll }"
      aria-hidden="true"
    />
  </button>
</template>
