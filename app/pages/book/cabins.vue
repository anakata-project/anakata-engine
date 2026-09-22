<script setup lang="ts">
import type { EngineCabin, EngineDeparture, EngineEventParams } from '../../types/api'
import { cabProblems } from '../../utils/cabProblems'
import { cabinCountRange, distributeGuests } from '../../utils/distributeGuests'
import { formatIsoDate, suitePpDouble } from '../../utils/engineFlow'
import { guestsFromCabins } from '../../composables/useBookingFlow'
import { estimatePrice, ownerPpDouble } from '../../utils/priceEstimate'

const { t } = useI18n()
const { data: feed } = useEngineFeed()
const { flow, party, hydrateFromSettings } = useBookingFlow()
const checkout = useCheckout()
const hold = useHold()
const { request } = useApi()

useHead({ title: t('pages.cabins') })

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

const departure = computed<EngineDeparture | null>(() =>
  feed.value?.departures.find(item => item.id === flow.value.departureId) ?? null
)

const itinerary = computed(() =>
  feed.value?.itineraries.find(item => item.code === (departure.value?.itinerary ?? flow.value.itineraryCode)) ?? null
)

if (import.meta.client && !flow.value.departureId) {
  await navigateTo('/itineraries')
}

const { data: deck, refresh: refreshDeck } = await useAsyncData(
  () => `engine-cabins-${flow.value.departureId}`,
  () => {
    if (!flow.value.departureId) {
      return Promise.resolve([] as Array<EngineCabin>)
    }

    return request(`/api/engine/departures/${flow.value.departureId}/cabins`) as Promise<Array<EngineCabin>>
  }
)

const settings = computed(() => feed.value?.settings ?? null)
const maxPerCabin = computed(() => settings.value?.guests.max_per_cabin ?? 3)
const range = computed(() => {
  if (!settings.value) {
    return { min: 1, max: 1 }
  }

  return cabinCountRange(party.value, maxPerCabin.value, settings.value.guests.max_per_yacht)
})

onMounted(() => {
  if (!departure.value) {
    return
  }

  if (flow.value.cabins.length === 0) {
    flow.value.cabins = distributeGuests(
      flow.value.adults,
      flow.value.children,
      range.value.min,
      maxPerCabin.value
    )
  }

  const checkoutEvent: EngineEventParams = {
    cabin_count: flow.value.cabins.length
  }

  if (itinerary.value?.code) {
    checkoutEvent.itinerary_code = itinerary.value.code
  }

  if (departure.value?.id) {
    checkoutEvent.departure_id = departure.value.id
  }

  track('begin_checkout', {
    itinerary_name: itinerary.value?.name ?? '',
    value: 0,
    currency: 'USD'
  }, checkoutEvent)

  void hold.extendIfDue()

  const timer = setInterval(() => {
    void hold.extendIfDue()
    hold.checkExpiry()
  }, 15_000)

  function onHide(): void {
    if (document.visibilityState === 'hidden' || document.visibilityState === undefined) {
      hold.releaseBeacon()
    }
  }

  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', onHide)

  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('pagehide', onHide)
    document.removeEventListener('visibilitychange', onHide)
  })
})

watch(() => hold.expired, (expired) => {
  if (!expired || !itinerary.value) {
    return
  }

  void navigateTo(`/itineraries/${itinerary.value.slug}`)
})

const problems = computed(() => {
  if (!settings.value) {
    return []
  }

  return cabProblems(flow.value.cabins, flow.value.adults, flow.value.children, maxPerCabin.value)
})

const cabinCategories = computed<Record<string, 'SUITE' | 'OWNER'>>(() => {
  const map: Record<string, 'SUITE' | 'OWNER'> = {}

  for (const cabin of deck.value ?? []) {
    map[cabin.code] = cabin.category === 'OWNER' ? 'OWNER' : 'SUITE'
  }

  return map
})

const estimate = computed(() => {
  if (!feed.value || !departure.value || !settings.value) {
    return null
  }

  return estimatePrice({
    cabins: flow.value.cabins,
    cabinCategories: cabinCategories.value,
    rates: feed.value.rates,
    year: departure.value.rate_year,
    festive: departure.value.festive,
    offers: feed.value.offers,
    offerCodes: departure.value.offers,
    settings: settings.value,
    guests: flow.value.guests.map(guest => ({
      nationality: guest.nationality || null,
      ecuadorResident: guest.ecuadorResident,
      isChild: guest.isChild
    })),
    onlineDeposit: false
  })
})

watch(() => flow.value.cabins, async () => {
  if (problems.value.length === 0) {
    await checkout.quote()
  }
}, { deep: true })

function setCount(n: number): void {
  flow.value.cabins = distributeGuests(
    flow.value.adults,
    flow.value.children,
    n,
    maxPerCabin.value,
    flow.value.cabins
  )
  flow.value.selectedCabinIndex = 0
}

function pick(code: string): void {
  flow.value.cabins = flow.value.cabins.map((cabin, index) => {
    if (cabin.cabinCode === code) {
      return { ...cabin, cabinCode: null }
    }

    if (index === flow.value.selectedCabinIndex) {
      return { ...cabin, cabinCode: code }
    }

    return cabin
  })

  if (flow.value.selectedCabinIndex < flow.value.cabins.length - 1) {
    flow.value.selectedCabinIndex += 1
  }
}

async function continueToDetails(): Promise<void> {
  if (problems.value.length) {
    return
  }

  flow.value.guests = guestsFromCabins(flow.value.cabins, flow.value.guests)
  const ok = await checkout.placeHold()

  if (!ok) {
    await refreshDeck()

    return
  }

  hold.retain()
  await navigateTo('/book/details')
}

async function back(): Promise<void> {
  if (flow.value.checkoutToken) {
    await hold.release()
  }

  if (itinerary.value) {
    await navigateTo(`/itineraries/${itinerary.value.slug}`)

    return
  }

  await navigateTo('/itineraries')
}

const label = computed(() => {
  if (!itinerary.value || !departure.value) {
    return ''
  }

  const offer = departure.value.offers[0]
  const festive = departure.value.festive ? ` · ${t('cabins.festive')}` : ''
  const offerBit = offer ? ` · ${offer}` : ''

  return `${itinerary.value.name} · ${departure.value.yacht} · ${formatIsoDate(departure.value.embark)}${festive}${offerBit}`
})

const counts = computed(() => {
  const list: Array<number> = []

  for (let n = range.value.min; n <= range.value.max; n += 1) {
    list.push(n)
  }

  return list
})
</script>

<template>
  <div v-if="feed && departure && settings && estimate">
    <span class="mono klabel">{{ label }}</span>
    <h1 class="disp">
      {{ t('cabins.title') }}
    </h1>
    <p class="sub">
      {{ t('cabins.sub') }}
    </p>
    <div class="cabgrid">
      <div>
        <div class="selrow">
          <div class="selbox">
            <label>{{ t('cabins.number') }}</label>
            <select
              :value="flow.cabins.length || range.min"
              @change="setCount(Number(($event.target as HTMLSelectElement).value))"
            >
              <option
                v-for="n in counts"
                :key="n"
                :value="n"
              >
                {{ t('cabins.count', { n }) }}
              </option>
            </select>
          </div>
          <div class="selbox grow">
            <label>{{ t('cabins.party') }}</label>
            <div class="partyline">
              {{ flow.adults }} {{ t('search.adultsCount', { n: flow.adults }) }}
              <template v-if="flow.children">
                + {{ flow.children }} {{ t('search.childrenCount', { n: flow.children }) }}
              </template>
            </div>
          </div>
        </div>
        <CabinsCabinTabs
          :cabins="flow.cabins"
          :selected="flow.selectedCabinIndex"
          :max-per-cabin="maxPerCabin"
          @select="flow.selectedCabinIndex = $event"
          @adults="(index, value) => { flow.cabins[index] = { ...flow.cabins[index]!, adults: value } }"
          @children="(index, value) => { flow.cabins[index] = { ...flow.cabins[index]!, children: value } }"
        />
        <div
          v-if="hold.expired || problems.length || checkout.cabinConflict || checkout.submitError"
          class="cabwarn"
        >
          <template v-if="hold.expired">
            ⚠ {{ hold.releasedMessage }}<br>
          </template>
          <template v-if="checkout.submitError">
            ⚠ {{ checkout.submitError }}<br>
          </template>
          <template v-if="checkout.cabinConflict">
            ⚠ {{ checkout.cabinConflict.message }}
            <template v-if="checkout.cabinConflict.labels.length">
              — {{ checkout.cabinConflict.labels.join(', ') }}
            </template>
            <br>
          </template>
          <template
            v-for="problem in problems"
            :key="problem"
          >
            ⚠ {{ problem }}<br>
          </template>
        </div>
        <CabinsDeckPlan
          :cabins="deck ?? []"
          :selection="flow.cabins"
          :selected-index="flow.selectedCabinIndex"
          :suite-rate="suitePpDouble(feed.rates, departure.rate_year)"
          :owner-rate="ownerPpDouble(feed.rates, departure.rate_year)"
          @pick="pick"
        />
        <div class="dt-actions">
          <button
            type="button"
            class="btn o"
            @click="back"
          >
            {{ t('cabins.back') }}
          </button>
          <button
            type="button"
            class="btn cta"
            :disabled="problems.length > 0"
            @click="continueToDetails"
          >
            <span class="lb">{{ t('cabins.next') }}</span>
            <span class="ico">→</span>
          </button>
        </div>
      </div>
      <PricePricePanel
        :quote="flow.serverQuote"
        :estimate="estimate"
        :settings="settings"
        path="PAY_LATER"
        :title="t('cabins.priceLive')"
      />
    </div>
  </div>
</template>
