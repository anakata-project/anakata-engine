<script setup lang="ts">
import type { EngineDeparture, EngineItinerary, EngineOffer, EngineRates } from '../../types/api'
import {
  cardDealbar,
  formatIsoDate,
  formatUsd,
  fromPrice,
  inWindow,
  isDimmedRow,
  labelToneClass,
  minCabins,
  rowAction,
  suitesFrom
} from '../../utils/engineFlow'

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

const inWindowDeps = computed(() =>
  props.departures.filter(dep =>
    dep.itinerary === props.itinerary.code && inWindow(dep.embark, props.fromMonth, props.toMonth)
  )
)

const min = computed(() => minCabins(props.party, props.maxPerCabin))

const dealbar = computed(() =>
  cardDealbar(inWindowDeps.value, props.rates, props.offers)
)

const fromAmount = computed(() =>
  suitesFrom(inWindowDeps.value, props.rates)
)

const heroStyle = computed(() => {
  if (props.itinerary.card.hero_image) {
    return {
      backgroundImage: `url(${props.itinerary.card.hero_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }

  return { background: props.itinerary.card.fallback_gradient }
})

function toggle(): void {
  open.value = !open.value

  if (open.value) {
    track('view_itinerary', {
      itinerary_name: props.itinerary.name,
      duration_nights: props.itinerary.nights
    })
  }
}

function onSelect(dep: EngineDeparture): void {
  emit('select', dep)
}

function onWaitlist(dep: EngineDeparture): void {
  emit('waitlist', dep)
}
</script>

<template>
  <div
    class="itin"
    data-reveal
  >
    <div class="img">
      <div
        class="grad"
        :style="heroStyle"
      />
      <div class="tag">
        {{ t('itineraries.tag') }}
      </div>
    </div>
    <div class="bd">
      <h3>{{ itinerary.name }}</h3>
      <p
        v-if="itinerary.tagline"
        class="tagline"
      >
        {{ itinerary.tagline }}
      </p>
      <p>{{ itinerary.card.description }}</p>
      <div class="chips">
        <span
          v-for="chip in itinerary.card.chips"
          :key="chip"
          class="chip"
        >{{ chip }}</span>
      </div>
      <div
        v-if="dealbar"
        class="dealbar"
      >
        ◆
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
            <small>{{ t('itineraries.ppdo') }}</small>
          </div>
        </div>
        <button
          type="button"
          class="btn o"
          @click="toggle"
        >
          {{ t('itineraries.departures', { n: inWindowDeps.length }) }} ▾
        </button>
      </div>
    </div>
    <div
      class="depsList"
      :class="{ on: open }"
    >
      <div class="dlInner">
        <div class="overview">
          <b>{{ t('itineraries.overview') }}</b>
          {{ itinerary.overview || itinerary.card.highlights.join(' · ') }}
        </div>
        <div
          v-if="inWindowDeps.length === 0"
          class="depRow"
        >
          <div class="y">
            {{ t('itineraries.empty') }}
          </div>
        </div>
        <div
          v-for="dep in inWindowDeps"
          :key="dep.id"
          class="depRow"
          :class="{
            'full': isDimmedRow(dep.label),
            'deal-on': dep.offers.length > 0
          }"
        >
          <div class="d">
            {{ formatIsoDate(dep.embark) }} → {{ formatIsoDate(dep.disembark) }}
          </div>
          <div class="y">
            {{ dep.yacht }}{{ dep.note ? ` · ${dep.note}` : '' }}
          </div>
          <div :class="labelToneClass(dep.label)">
            {{ dep.label }}
            <template v-if="rowAction(dep, min).type === 'waitlist' && !isDimmedRow(dep.label)">
              {{ t('itineraries.notEnough') }}
            </template>
          </div>
          <ItinerariesPriceCell :price="fromPrice(dep, rates, offers)" />
          <ItinerariesDepartureActions
            :action="rowAction(dep, min)"
            :departure="dep"
            @select="onSelect"
            @waitlist="onWaitlist"
          />
        </div>
      </div>
    </div>
  </div>
</template>
