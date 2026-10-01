<script setup lang="ts">
import type { EngineDeparture, EngineItinerary, EngineOffer, EngineRates } from '../../types/api'
import {
  cardDealbar,
  fromPrice,
  inWindow,
  isDimmedRow,
  labelToneClass,
  minCabins,
  rowAction,
  suitesFrom
} from '../../utils/engineFlow'
import { itineraryPhoto } from '../../utils/itineraryPhoto'
import { routeMapFor } from '../../utils/routeMaps'
import yachtMark from '../../assets/svg/yacht.svg'

const props = defineProps<{
  itinerary: EngineItinerary
  departures: Array<EngineDeparture>
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
const open = ref(false)
const pickedId = ref<number | null>(null)

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const inWindowDeps = computed(() =>
  props.departures
    .filter(dep =>
      dep.itinerary === props.itinerary.code && inWindow(dep.embark, props.fromMonth, props.toMonth)
    )
    .slice()
    .sort((a, b) => a.embark.localeCompare(b.embark))
)

const groupedDeps = computed(() => {
  const groups: Array<{ year: number, rows: Array<EngineDeparture> }> = []

  for (const dep of inWindowDeps.value) {
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

watch(inWindowDeps, (rows) => {
  if (pickedId.value !== null && !rows.some(dep => dep.id === pickedId.value)) {
    pickedId.value = null
  }
})

const min = computed(() => minCabins(props.party, props.maxPerCabin))

const dealbar = computed(() =>
  cardDealbar(inWindowDeps.value, props.rates, props.offers)
)

const fromAmount = computed(() =>
  suitesFrom(inWindowDeps.value, props.rates)
)

const photo = computed(() =>
  props.itinerary.card.hero_image || itineraryPhoto(props.itinerary.code)
)

const hasMap = computed(() => routeMapFor(props.itinerary.code) !== null)

const specChips = computed(() =>
  props.itinerary.card.chips.filter(chip => !/nights?/i.test(chip) && !chip.includes('↔'))
)

const showTagline = computed(() => {
  const line = props.itinerary.tagline.trim().toLowerCase()
  if (!line) {
    return false
  }

  const days = `${props.itinerary.days} day`
  const nights = `${props.itinerary.nights} night`

  return !(line.includes(days) && line.includes(nights))
})

const heroStyle = computed(() => {
  if (photo.value) {
    return {}
  }

  return { background: props.itinerary.card.fallback_gradient }
})

function toggle(): void {
  open.value = !open.value

  if (open.value) {
    track('view_itinerary', {
      itinerary_name: props.itinerary.name,
      duration_nights: props.itinerary.nights
    }, {
      itinerary_code: props.itinerary.code
    })
  }
}

function onWaitlist(dep: EngineDeparture): void {
  emit('waitlist', dep)
}

function pick(dep: EngineDeparture): void {
  pickedId.value = dep.id
}

function continueOn(): void {
  const dep = inWindowDeps.value.find(item => item.id === pickedId.value)
  if (dep) {
    emit('select', dep)
  }
}

function formatDepDay(iso: string): string {
  const parts = iso.split('-')
  const month = Number(parts[1])
  const day = Number(parts[2])

  return `${SHORT_MONTHS[month - 1] ?? ''} ${day}`
}

function money(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function onMap(): void {
  void navigateTo(`/itineraries/${props.itinerary.slug}?tab=route`)
}
</script>

<template>
  <div
    class="itin"
    :class="{ open }"
  >
    <div class="itin-main">
      <div class="img">
        <img
          v-if="photo"
          class="photo"
          :src="photo"
          :alt="itinerary.card.hero_alt || itinerary.name"
        >
        <div
          v-else
          class="grad"
          :style="heroStyle"
        />
        <button
          v-if="hasMap"
          type="button"
          class="map-btn"
          @click="onMap"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <path d="M9 4.5 15 6.5 21 4.5v15l-6 2-6-2-6 2v-15l6-2Z" />
            <path d="M9 4.5v15M15 6.5v15" />
          </svg>
          {{ t('itineraries.map') }}
        </button>
      </div>
      <div class="bd">
        <span class="mono dur">
          {{ t('itineraries.nightsDays', { nights: itinerary.nights, days: itinerary.days }) }}
        </span>
        <h3>{{ itinerary.name }}</h3>
        <p
          v-if="showTagline"
          class="tagline"
        >
          {{ itinerary.tagline }}
        </p>
        <p>{{ itinerary.card.description }}</p>
        <ul
          v-if="specChips.length"
          class="specs"
        >
          <li
            v-for="chip in specChips"
            :key="chip"
          >
            {{ chip }}
          </li>
        </ul>
        <div
          v-if="dealbar"
          class="dealbar"
        >
          <span v-if="dealbar.bestPct !== null">
            {{ t('itineraries.dealbarPct', {
              n: dealbar.count,
              pct: dealbar.bestPct,
              from: formatUsd(dealbar.from)
            }) }}
          </span>
          <span v-else>
            {{ t('itineraries.dealbar', {
              n: dealbar.count,
              from: formatUsd(dealbar.from)
            }) }}
          </span>
        </div>
        <div class="foot">
          <div class="price">
            <div class="f">
              {{ t('itineraries.suitesFrom') }}
            </div>
            <div
              v-if="fromAmount !== null"
              class="v"
            >
              {{ formatUsd(fromAmount) }}
            </div>
            <div class="occ">
              {{ t('itineraries.ppdo') }}
            </div>
          </div>
          <button
            type="button"
            class="see-dates"
            :aria-expanded="open"
            @click="toggle"
          >
            {{ open ? t('itineraries.hideDates') : t('itineraries.departures') }}
            <span
              class="chev"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
    <div
      class="depsList"
      :class="{ on: open }"
    >
      <div class="dlInner">
        <div
          v-if="inWindowDeps.length === 0"
          class="depRow"
        >
          <div class="y">
            {{ t('itineraries.empty') }}
          </div>
        </div>
        <template
          v-for="group in groupedDeps"
          :key="group.year"
        >
          <div class="dep-year">
            {{ group.year }}
          </div>
          <div
            v-for="dep in group.rows"
            :key="dep.id"
            class="depRow"
          >
            <div class="d">
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
            </div>
            <div class="y">
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
              <template v-if="rowAction(dep, min).type === 'waitlist' && !isDimmedRow(dep.label)">
                {{ t('itineraries.notEnough') }}
              </template>
            </div>
            <div class="pr">
              <span :class="{ was: fromPrice(dep, rates, offers).pct }">
                {{ t('itineraries.rowFrom', { amount: money(fromPrice(dep, rates, offers).base) }) }}{{ fromPrice(dep, rates, offers).festive ? t('itineraries.plusFestive') : '' }}
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
            <div class="dep-act">
              <button
                v-if="rowAction(dep, min).type === 'select'"
                type="button"
                class="dep-pick"
                :class="{ on: pickedId === dep.id }"
                @click="pick(dep)"
              >
                {{ pickedId === dep.id ? t('itineraries.selected') : t('itineraries.select') }}
              </button>
              <button
                v-else-if="rowAction(dep, min).type === 'waitlist' || rowAction(dep, min).type === 'waitlist_contact'"
                type="button"
                class="dep-pick"
                @click="onWaitlist(dep)"
              >
                {{ t('itineraries.waitlist') }}
              </button>
              <a
                v-if="rowAction(dep, min).type === 'waitlist_contact' || rowAction(dep, min).type === 'contact'"
                class="dep-pick"
                :href="`mailto:${t('search.contactEmail')}`"
              >
                {{ t('itineraries.contact') }}
              </a>
              <NuxtLink
                v-if="rowAction(dep, min).type === 'charter'"
                to="/charter"
                class="dep-pick"
              >
                {{ t('itineraries.charter') }}
              </NuxtLink>
            </div>
          </div>
        </template>
        <button
          v-if="inWindowDeps.length > 0"
          type="button"
          class="dep-continue"
          :disabled="pickedId === null"
          @click="continueOn"
        >
          {{ t('itineraries.continueTrip') }}
          <span
            class="dep-go"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>
