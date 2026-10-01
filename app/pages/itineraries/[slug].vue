<script setup lang="ts">
import type { EngineDeparture } from '../../types/api'
import {
  fromPrice,
  inWindow,
  suitesFrom
} from '../../utils/engineFlow'
import { itineraryPhoto } from '../../utils/itineraryPhoto'
import { routeMapFor } from '../../utils/routeMaps'
import prowMark from '../../assets/svg/logo.svg'

const route = useRoute()
const { t, locale } = useI18n()
const { data: feed, error } = useEngineFeed()
const { flow, party, hydrateFromSettings } = useBookingFlow()
const waitlist = useWaitlist()

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

const itinerary = computed(() =>
  feed.value?.itineraries.find(item => item.slug === route.params.slug) ?? null
)

if (import.meta.server) {
  if (feed.value && !itinerary.value) {
    throw createError({ statusCode: 404, statusMessage: t('pages.notFound') })
  }
}

watch(itinerary, (itin) => {
  if (feed.value && !itin) {
    throw createError({ statusCode: 404, statusMessage: t('pages.notFound') })
  }
}, { immediate: true })

const itineraryDeps = computed(() => {
  if (!feed.value || !itinerary.value) {
    return []
  }

  return feed.value.departures
    .filter(dep => dep.itinerary === itinerary.value?.code)
    .slice()
    .sort((a, b) => a.embark.localeCompare(b.embark))
})

const selected = computed<EngineDeparture | null>(() => {
  const byId = itineraryDeps.value.find(dep => dep.id === flow.value.departureId)
  if (byId) {
    return byId
  }

  const inWin = itineraryDeps.value.filter(dep =>
    inWindow(dep.embark, flow.value.fromMonth, flow.value.toMonth)
  )

  return inWin[0] ?? itineraryDeps.value[0] ?? null
})

watch(selected, (dep) => {
  if (dep && flow.value.departureId !== dep.id) {
    flow.value.departureId = dep.id
    flow.value.itineraryCode = dep.itinerary
  }
}, { immediate: true })

const mapData = computed(() =>
  itinerary.value ? routeMapFor(itinerary.value.code) : null
)

const tab = ref<'overview' | 'itinerary' | 'includes' | 'faqs' | 'route'>('overview')
const openFaq = ref<string | null>(null)

watch(() => [route.query.tab, mapData.value] as const, () => {
  const value = route.query.tab

  if (value === 'overview' || value === 'itinerary' || value === 'includes' || value === 'faqs') {
    tab.value = value
    return
  }

  if (value === 'route' && mapData.value) {
    tab.value = 'route'
  }
}, { immediate: true })

const tabs = computed(() => {
  const list: Array<{ id: typeof tab.value, label: string }> = [
    { id: 'overview', label: t('trip.tabOverview') },
    { id: 'itinerary', label: t('trip.tabItinerary') }
  ]

  if (mapData.value) {
    list.push({ id: 'route', label: t('trip.tabRoute') })
  }

  list.push(
    { id: 'includes', label: t('trip.tabIncludes') },
    { id: 'faqs', label: t('trip.tabFaqs') }
  )

  return list
})

const kicker = computed(() => {
  if (!itinerary.value || !selected.value) {
    return ''
  }

  const parts = selected.value.embark.split('-')
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

  return `${date} / ${adults}${children} / ${itinerary.value.name} / ${selected.value.yacht}`
})

const routeLine = computed(() =>
  itinerary.value?.card.highlights.join(' — ') ?? ''
)

const photo = computed(() => {
  if (!itinerary.value) {
    return null
  }

  return itinerary.value.card.hero_image || itineraryPhoto(itinerary.value.code)
})

function toggleFaq(question: string): void {
  openFaq.value = openFaq.value === question ? null : question
}

const railFrom = computed(() => {
  if (!feed.value || !selected.value) {
    return 0
  }

  return fromPrice(selected.value, feed.value.rates, feed.value.offers).now
    || suitesFrom([selected.value], feed.value.rates)
    || 0
})

const heroStyle = computed(() => {
  if (!itinerary.value) {
    return {}
  }

  if (itinerary.value.card.hero_image) {
    return {
      backgroundImage: `url(${itinerary.value.card.hero_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }

  return { background: itinerary.value.card.fallback_gradient }
})

useHead(() => ({
  title: itinerary.value?.seo.title || itinerary.value?.name || t('pages.tripDetails'),
  meta: itinerary.value?.seo.description
    ? [{ name: 'description', content: itinerary.value.seo.description }]
    : []
}))

onMounted(() => {
  if (itinerary.value && selected.value) {
    track('view_itinerary_detail', {
      itinerary_name: itinerary.value.name,
      departure: selected.value.embark
    }, {
      itinerary_code: itinerary.value.code
    })
  }
  watchReveals()
})

watch(() => selected.value?.id, (id) => {
  if (!id || !itinerary.value) {
    return
  }

  track('view_departure', undefined, {
    itinerary_code: itinerary.value.code,
    departure_id: id
  })
}, { immediate: true })

function onSelect(dep: EngineDeparture): void {
  flow.value.departureId = dep.id
  flow.value.itineraryCode = dep.itinerary
  track('select_departure', {
    itinerary_name: itinerary.value?.name ?? dep.itinerary,
    departure: dep.embark,
    yacht: dep.yacht
  }, {
    itinerary_code: dep.itinerary,
    departure_id: dep.id
  })
}

function onWaitlist(dep: EngineDeparture): void {
  waitlist.open(dep)
}

function continueToCabins(): void {
  void navigateTo('/book/cabins')
}
</script>

<template>
  <div>
    <p
      v-if="error"
      class="bbnote"
    >
      {{ error.message }}
    </p>
    <div
      v-else-if="itinerary && selected && feed"
      class="detgrid"
    >
      <div class="trip-main">
        <span class="mono trip-kicker">{{ kicker }}</span>
        <div class="dt-head">
          <div>
            <h1 class="disp">
              {{ itinerary.name }}
            </h1>
            <p
              v-if="routeLine"
              class="route-line"
            >
              {{ routeLine }}
            </p>
          </div>
          <div class="badges">
            <div class="badge">
              <b>{{ itinerary.days }}</b>
              <span>{{ t('trip.days') }}</span>
            </div>
            <div class="badge">
              <b>{{ itinerary.nights }}</b>
              <span>{{ t('trip.nights') }}</span>
            </div>
          </div>
        </div>
        <div class="hero">
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
        </div>
        <p class="desc">
          {{ itinerary.detail.long_description || itinerary.overview }}
        </p>
        <div
          v-if="itinerary.detail.facts.length"
          class="facts"
        >
          <div
            v-for="fact in itinerary.detail.facts"
            :key="fact[0]"
            class="fact"
          >
            <img
              class="fact-mark"
              :src="prowMark"
              alt=""
              width="25"
              height="13"
            >
            <div class="fl">
              {{ fact[0] }}
            </div>
            <div class="fv">
              {{ fact[1] }}
            </div>
          </div>
        </div>

        <TripDepartureSwitcher
          :departures="itineraryDeps"
          :selected-id="selected.id"
          :rates="feed.rates"
          :offers="feed.offers"
          :from-month="flow.fromMonth"
          :to-month="flow.toMonth"
          :party="party"
          :max-per-cabin="feed.settings.guests.max_per_cabin"
          @select="onSelect"
          @waitlist="onWaitlist"
        />

        <div
          class="trip-sheet"
          :data-open="tab"
        >
          <div class="tabs">
            <button
              v-for="item in tabs"
              :key="item.id"
              type="button"
              class="tab"
              :data-id="item.id"
              :class="{ cur: tab === item.id }"
              @click="tab = item.id"
            >
              {{ item.label }}
            </button>
          </div>
          <div class="tabbody">
            <template v-if="tab === 'overview'">
              <h6>{{ t('trip.highlights') }}</h6>
              <div
                v-for="row in itinerary.card.highlights"
                :key="row"
                class="hlrow"
              >
                {{ row }}
              </div>
            </template>
            <template v-else-if="tab === 'route' && mapData">
              <ClientOnly>
                <TripRouteMap
                  :data="mapData"
                  :itinerary-name="itinerary.name"
                  :itinerary-code="itinerary.code"
                />
              </ClientOnly>
            </template>
            <template v-else-if="tab === 'itinerary'">
              <h6>{{ t('trip.dayByDay') }}</h6>
              <div
                v-for="day in itinerary.detail.day_by_day"
                :key="day[0]"
                class="hlrow"
              >
                <b>{{ day[0] }}</b>
                {{ day[1] }}
              </div>
            </template>
            <template v-else-if="tab === 'includes'">
              <h6>{{ t('trip.included') }}</h6>
              <div
                v-for="row in itinerary.detail.included"
                :key="row"
                class="hlrow"
              >
                {{ row }}
              </div>
              <h6 class="spaced">
                {{ t('trip.excluded') }}
              </h6>
              <div
                v-for="row in itinerary.detail.excluded"
                :key="row"
                class="hlrow"
              >
                {{ row }}
              </div>
            </template>
            <template v-else>
              <h6>{{ t('trip.faqs') }}</h6>
              <div
                v-for="faq in itinerary.detail.faqs"
                :key="faq[0]"
                class="faq"
              >
                <button
                  type="button"
                  class="faq-q"
                  :aria-expanded="openFaq === faq[0]"
                  @click="toggleFaq(faq[0])"
                >
                  {{ faq[0] }}
                  <span
                    class="faq-plus"
                    aria-hidden="true"
                  />
                </button>
                <p
                  v-if="openFaq === faq[0]"
                  class="faq-a"
                >
                  {{ faq[1] }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <div class="dt-actions">
          <NuxtLink
            to="/itineraries"
            class="btn o"
          >
            <span
              class="dep-go go-back"
              aria-hidden="true"
            />
            {{ t('trip.back') }}
          </NuxtLink>
          <button
            type="button"
            class="btn cta"
            @click="continueToCabins"
          >
            <span class="lb">{{ t('trip.selectCabins') }}</span>
            <span
              class="dep-go"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <TripRail
        :from="railFrom"
        :festive="selected.festive"
        :departure="selected"
        :settings="feed.settings"
        :adults="flow.adults"
        :children="flow.children"
        :party="party"
        @continue="continueToCabins"
      />
    </div>
    <WaitlistStub />
  </div>
</template>
