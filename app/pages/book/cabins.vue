<script setup lang="ts">
import type { EngineCabin, EngineDeparture, EngineEventParams } from '../../types/api'
import { cabProblems } from '../../utils/cabProblems'
import { deckCodeFor } from '../../utils/deckCode'
import { DECK_100_SUITES, type Deck100SuiteCode } from '../../utils/deck100'
import { DECK_200_SUITES, type Deck200SuiteCode } from '../../utils/deck200'
import type { DeckSuiteStatus } from '../../utils/deckPlan'
import { cabinCountRange, distributeGuests } from '../../utils/distributeGuests'
import { guestsFromCabins } from '../../composables/useBookingFlow'
import { estimatePrice } from '../../utils/priceEstimate'
import suitePhoto from '../../assets/images/suite.png'

const { t, locale } = useI18n()
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

const kicker = computed(() => {
  if (!itinerary.value || !departure.value) {
    return ''
  }

  const parts = departure.value.embark.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const date = new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)))
  const adults = t('search.adultsCount', { n: flow.value.adults })
  const children = flow.value.children > 0
    ? ` · ${t('search.childrenCount', { n: flow.value.children })}`
    : ''

  const suffix = selectionSummary.value

  return `${date} / ${adults}${children} / ${itinerary.value.name} / ${departure.value.yacht}${suffix}`
})

const selectionSummary = computed(() => {
  let standard = 0
  let owner = 0

  for (const cabin of flow.value.cabins) {
    if (!cabin.cabinCode) {
      continue
    }

    if (cabinCategories.value[cabin.cabinCode] === 'OWNER') {
      owner += 1
    } else {
      standard += 1
    }
  }

  const parts: Array<string> = []

  if (standard > 0) {
    parts.push(t('cabins.kickerStandard', { n: standard }))
  }

  if (owner > 0) {
    parts.push(t('cabins.kickerOwner', { n: owner }))
  }

  return parts.length ? ` / ${parts.join(' / ')}` : ''
})

function cabinNumber(code: string): number | null {
  const match = code.match(/(\d+)/)

  return match ? Number(match[1]) : null
}

function slotName(code: string | null): string {
  if (!code) {
    return t('cabins.pickOnDeck')
  }

  if (cabinCategories.value[code] === 'OWNER') {
    return t('cabins.ownerName')
  }

  const number = cabinNumber(code)

  return t('cabins.standardName', { n: number ?? code })
}

const standardPoints = computed(() => [
  t('cabins.pointKing'),
  t('cabins.pointShower'),
  t('cabins.upTo', { n: maxPerCabin.value })
])

const ownerPoints = computed(() => [
  t('cabins.pointKing'),
  t('cabins.pointCloset'),
  t('cabins.pointSofa'),
  t('cabins.pointButler'),
  t('cabins.pointShowerOwner')
])

type SuiteCard = {
  code: string
  category: 'SUITE' | 'OWNER'
  kicker: string
  title: string
  lead: string
  points: Array<string>
}

const selections = computed<Array<SuiteCard>>(() =>
  flow.value.cabins.flatMap((cabin) => {
    if (!cabin.cabinCode) {
      return []
    }

    const category = cabinCategories.value[cabin.cabinCode] ?? 'SUITE'
    const number = cabinNumber(cabin.cabinCode)

    if (category === 'OWNER') {
      return [{
        code: cabin.cabinCode,
        category,
        kicker: t('cabins.ownerSelected'),
        title: t('cabins.ownerName'),
        lead: t('cabins.ownerLead'),
        points: ownerPoints.value
      }]
    }

    return [{
      code: cabin.cabinCode,
      category,
      kicker: t('cabins.suiteSelected', { n: number ?? cabin.cabinCode }),
      title: t('cabins.standardTitle'),
      lead: t('cabins.standardLead'),
      points: standardPoints.value
    }]
  })
)

function focusSlot(index: number): void {
  flow.value.selectedCabinIndex = index
}

function stepGuests(index: number, field: 'adults' | 'children', delta: number): void {
  const cabin = flow.value.cabins[index]

  if (!cabin) {
    return
  }

  const next = cabin[field] + delta

  if (field === 'adults' && (next < 1 || next > maxPerCabin.value)) {
    return
  }

  if (field === 'children' && (next < 0 || next > maxPerCabin.value)) {
    return
  }

  const adults = field === 'adults' ? next : cabin.adults
  const children = field === 'children' ? next : cabin.children

  if (adults + children > maxPerCabin.value) {
    return
  }

  flow.value.cabins[index] = { ...cabin, [field]: next }
  flow.value.selectedCabinIndex = index
}

function backToSelection(): void {
  document.getElementById('select-suite')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const partyLine = computed(() => {
  const adults = t('search.adultsCount', { n: flow.value.adults })
  if (flow.value.children === 0) {
    return adults
  }

  return `${adults} · ${t('search.childrenCount', { n: flow.value.children })}`
})

const chosenLabels = computed(() =>
  flow.value.cabins
    .map(cabin => cabin.cabinCode)
    .filter((code): code is string => Boolean(code))
)

function statusesFor<Code extends string>(codes: ReadonlyArray<Code>): Partial<Record<Code, DeckSuiteStatus>> {
  const statuses: Partial<Record<Code, DeckSuiteStatus>> = {}

  for (const cabin of deck.value ?? []) {
    const id = deckCodeFor(cabin.code)

    if (!id || !(codes as ReadonlyArray<string>).includes(id)) {
      continue
    }

    const chosen = flow.value.cabins.some(row => row.cabinCode === cabin.code)
    statuses[id as Code] = chosen ? 'selected' : cabin.bookable ? 'available' : 'booked'
  }

  return statuses
}

const deck100 = computed(() => statusesFor(DECK_100_SUITES))
const deck200 = computed(() => statusesFor(DECK_200_SUITES))

function pickDeck(code: Deck100SuiteCode | Deck200SuiteCode): void {
  const cabin = (deck.value ?? []).find(item => deckCodeFor(item.code) === code)

  if (!cabin) {
    return
  }

  const chosen = flow.value.cabins.some(row => row.cabinCode === cabin.code)

  if (!cabin.bookable && !chosen) {
    return
  }

  pick(cabin.code)
}

const counts = computed(() => {
  const list: Array<number> = []

  for (let n = range.value.min; n <= range.value.max; n += 1) {
    list.push(n)
  }

  return list
})

const countItems = computed(() => counts.value.map(n => ({
  label: t('cabins.count', { n }),
  value: n
})))

function onCount(value: string | number | null | undefined): void {
  const count = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(count)) {
    return
  }

  setCount(count)
}
</script>

<template>
  <div
    v-if="feed && departure && settings && estimate"
    class="suite-page"
  >
    <div class="suite-layout">
      <div>
        <span class="mono trip-kicker">{{ kicker }}</span>
        <div class="suite-head">
          <div>
            <h1 class="disp">
              {{ t('cabins.title') }}
            </h1>
            <p class="sub">
              {{ t('cabins.sub') }}
            </p>
          </div>
          <div class="suite-status">
            {{ chosenLabels.length ? chosenLabels.join(' · ') : t('cabins.noneSelected') }}
          </div>
        </div>
        <div class="suite-picks">
          <div class="suite-field">
            <USelect
              class="suite-count"
              :model-value="flow.cabins.length || range.min"
              :items="countItems"
              :content="{ align: 'start', side: 'bottom', sideOffset: 0 }"
              :ui="{
                content: 'suite-count-menu',
                item: 'suite-count-item',
                itemLabel: 'suite-count-label'
              }"
              @update:model-value="onCount"
            >
              <template #leading>
                <span>{{ t('cabins.number') }}</span>
              </template>
            </USelect>
          </div>
          <div class="suite-field">
            <span>{{ t('cabins.party') }}</span>
            <b>{{ partyLine }}</b>
          </div>
        </div>
        <div class="suite-slots">
          <article
            v-for="(cabin, index) in flow.cabins"
            :key="index"
            class="suite-slot"
            :class="{ cur: flow.selectedCabinIndex === index }"
            @click="focusSlot(index)"
          >
            <span class="slot-kicker">{{ t('cabins.slot', { n: index + 1 }) }}</span>
            <span class="slot-name">{{ slotName(cabin.cabinCode) }}</span>
            <div class="guest-line">
              <span>{{ t('cabins.adults') }}</span>
              <span class="guest-step">
                <button
                  type="button"
                  :aria-label="t('cabins.fewerAdults')"
                  @click.stop="stepGuests(index, 'adults', -1)"
                >
                  −
                </button>
                <b>{{ cabin.adults }}</b>
                <button
                  type="button"
                  :aria-label="t('cabins.moreAdults')"
                  @click.stop="stepGuests(index, 'adults', 1)"
                >
                  +
                </button>
              </span>
            </div>
            <div class="guest-line">
              <span>
                {{ t('cabins.children') }}
                <small>{{ t('search.childAgesLabel') }}</small>
              </span>
              <span class="guest-step">
                <button
                  type="button"
                  :aria-label="t('cabins.fewerChildren')"
                  @click.stop="stepGuests(index, 'children', -1)"
                >
                  −
                </button>
                <b>{{ cabin.children }}</b>
                <button
                  type="button"
                  :aria-label="t('cabins.moreChildren')"
                  @click.stop="stepGuests(index, 'children', 1)"
                >
                  +
                </button>
              </span>
            </div>
          </article>
        </div>
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
        <section
          id="select-suite"
          class="suite-board"
        >
          <h2>{{ t('cabins.selectSuite') }}</h2>
          <div class="deck-block">
            <div class="deck-kicker">
              <b>{{ t('cabins.deck200') }}</b>
              <span>{{ t('cabins.deckCount', { n: DECK_200_SUITES.length }) }}</span>
            </div>
            <CabinsYachtDeck200
              :statuses="deck200"
              @select="pickDeck"
            />
          </div>
          <div class="deck-block">
            <div class="deck-kicker">
              <b>{{ t('cabins.deck100') }}</b>
              <span>{{ t('cabins.deckCount', { n: DECK_100_SUITES.length }) }}</span>
            </div>
            <CabinsYachtDeck100
              :statuses="deck100"
              @select="pickDeck"
            />
          </div>
          <ul class="deck-key">
            <li><i class="swatch av" />{{ t('cabins.legendAvailable') }}</li>
            <li><i class="swatch hold" />{{ t('cabins.legendHold') }}</li>
            <li><i class="swatch booked" />{{ t('cabins.legendBooked') }}</li>
            <li><i class="swatch sel" />{{ t('cabins.legendSelected') }}</li>
          </ul>
        </section>
        <section
          v-if="selections.length"
          class="your-selection"
        >
          <h2>{{ t('cabins.yourSelection') }}</h2>
          <article
            v-for="card in selections"
            :key="card.code"
            class="pick-card"
          >
            <img
              :src="suitePhoto"
              :alt="card.title"
            >
            <div class="pick-copy">
              <span class="pick-kicker">{{ card.kicker }}</span>
              <h3>{{ card.title }}</h3>
              <p>{{ card.lead }}</p>
              <ul class="pick-points">
                <li
                  v-for="point in card.points"
                  :key="point"
                >
                  {{ point }}
                </li>
              </ul>
            </div>
          </article>
        </section>
        <div class="suite-actions">
          <button
            type="button"
            class="btn o"
            @click="backToSelection"
          >
            <span
              class="dep-go go-back"
              aria-hidden="true"
            />
            {{ t('cabins.back') }}
          </button>
          <button
            type="button"
            class="btn cta"
            :disabled="problems.length > 0"
            @click="continueToDetails"
          >
            {{ t('cabins.next') }}
            <span
              class="dep-go"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <PricePanel
        class="suite-rail"
        :quote="flow.serverQuote"
        :estimate="estimate"
        :settings="settings"
        path="PAY_LATER"
        :title="t('cabins.priceLive')"
      >
        <div class="rail-cta">
          <button
            type="button"
            class="btn cta"
            :disabled="problems.length > 0"
            @click="continueToDetails"
          >
            {{ t('cabins.toDetails') }}
            <span
              class="dep-go"
              aria-hidden="true"
            />
          </button>
        </div>
      </PricePanel>
    </div>
  </div>
</template>
