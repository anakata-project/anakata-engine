<script setup lang="ts">
import type { EngineDeparture } from '../../types/api'
import {
  formatMonthRange,
  minCabins
} from '../../utils/engineFlow'

const { t } = useI18n()
const { data: feed, error } = useEngineFeed()
const { flow, party, hydrateFromSettings } = useBookingFlow()
const waitlist = useWaitlist()

useHead({ title: t('pages.itineraries') })

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

const windowLine = computed(() => {
  if (!feed.value) {
    return ''
  }

  const cabins = minCabins(party.value, feed.value.settings.guests.max_per_cabin)
  const children = flow.value.children > 0
    ? t('itineraries.plusChildren', { n: flow.value.children })
    : ''

  return t('itineraries.window', {
    n: cabins,
    range: formatMonthRange(flow.value.fromMonth, flow.value.toMonth),
    party: party.value,
    adults: t('search.adultsCount', { n: flow.value.adults }),
    children,
    cabins
  })
})

function onSelect(dep: EngineDeparture): void {
  const itin = feed.value?.itineraries.find(item => item.code === dep.itinerary)

  flow.value.itineraryCode = dep.itinerary
  flow.value.departureId = dep.id
  track('select_departure', {
    itinerary_name: itin?.name ?? dep.itinerary,
    departure: dep.embark,
    yacht: dep.yacht
  })
  void navigateTo(`/itineraries/${itin?.slug ?? dep.itinerary.toLowerCase()}`)
}

function onWaitlist(dep: EngineDeparture): void {
  waitlist.open(dep)
}

watch(feed, () => {
  nextTick(() => watchReveals())
}, { immediate: true })
</script>

<template>
  <div>
    <p
      v-if="error"
      class="bbnote"
    >
      {{ error.message }}
    </p>
    <template v-else-if="feed">
      <span class="mono klabel">{{ windowLine }}</span>
      <h1 class="disp">
        {{ t('itineraries.title') }}
      </h1>
      <p class="sub">
        {{ t('itineraries.sub') }}
      </p>
      <div class="itins">
        <ItinerariesItineraryCard
          v-for="itin in feed.itineraries"
          :key="itin.code"
          :itinerary="itin"
          :departures="feed.departures"
          :rates="feed.rates"
          :offers="feed.offers"
          :from-month="flow.fromMonth"
          :to-month="flow.toMonth"
          :party="party"
          :max-per-cabin="feed.settings.guests.max_per_cabin"
          @select="onSelect"
          @waitlist="onWaitlist"
        />
      </div>
    </template>
    <WaitlistStub />
  </div>
</template>
