<script setup lang="ts">
import type { EngineDeparture } from '../../types/api'
import { parseYm } from '../../utils/engineFlow'

const { t, locale } = useI18n()
const { data: feed, error } = useEngineFeed()
const { flow, party, hydrateFromSettings } = useBookingFlow()
const waitlist = useWaitlist()

useHead({ title: t('pages.itineraries') })

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

function monthYear(ym: string): string {
  const [year, month] = parseYm(ym)

  return new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month, 1)))
}

const windowLine = computed(() => {
  if (!flow.value.fromMonth || !flow.value.toMonth) {
    return ''
  }

  const from = monthYear(flow.value.fromMonth)
  const to = monthYear(flow.value.toMonth)
  const range = flow.value.fromMonth === flow.value.toMonth ? from : `${from} — ${to}`
  const adults = t('search.adultsCount', { n: flow.value.adults })
  const children = flow.value.children > 0
    ? ` · ${t('search.childrenCount', { n: flow.value.children })}`
    : ''

  return `${range} / ${adults}${children}`
})

function onSelect(dep: EngineDeparture): void {
  const itin = feed.value?.itineraries.find(item => item.code === dep.itinerary)

  flow.value.itineraryCode = dep.itinerary
  flow.value.departureId = dep.id
  track('select_departure', {
    itinerary_name: itin?.name ?? dep.itinerary,
    departure: dep.embark,
    yacht: dep.yacht
  }, {
    itinerary_code: dep.itinerary,
    departure_id: dep.id
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
      <span class="mono itin-kicker">{{ windowLine }}</span>
      <h1 class="disp">
        {{ t('itineraries.title') }}
      </h1>
      <p class="sub">
        {{ t('itineraries.sub') }}
      </p>
      <div class="itin-layout">
        <ItinerariesItinerarySearch :settings="feed.settings" />
        <div
          id="itinerary-results"
          class="itins"
        >
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
      </div>
    </template>
    <WaitlistStub />
  </div>
</template>
