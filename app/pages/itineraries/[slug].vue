<script setup lang="ts">
import type { EngineDeparture } from '../../types/api'
import {
  fromPrice,
  inWindow,
  suitesFrom
} from '../../utils/engineFlow'
import { routeMapFor } from '../../utils/routeMaps'

const route = useRoute()
const { t } = useI18n()
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

const tabs = computed(() => {
  const list: Array<{ id: typeof tab.value, label: string }> = [
    { id: 'overview', label: t('trip.tabOverview') },
    { id: 'itinerary', label: t('trip.tabItinerary') },
    { id: 'includes', label: t('trip.tabIncludes') },
    { id: 'faqs', label: t('trip.tabFaqs') }
  ]

  if (mapData.value) {
    list.push({ id: 'route', label: t('trip.tabRoute') })
  }

  return list
})

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
    })
  }
  watchReveals()
})

function onSelect(dep: EngineDeparture): void {
  flow.value.departureId = dep.id
  flow.value.itineraryCode = dep.itinerary
  track('select_departure', {
    itinerary_name: itinerary.value?.name ?? dep.itinerary,
    departure: dep.embark,
    yacht: dep.yacht
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
      <div>
        <span class="mono klabel">{{ t('trip.eyebrow') }}</span>
        <div class="dt-head">
          <h1 class="disp">
            {{ itinerary.name }}
          </h1>
          <div class="badges">
            <div class="badge">
              <b>{{ itinerary.days }}</b>
              <span>{{ t('trip.days') }}</span>
            </div>
            <div class="badge hl">
              <b>{{ itinerary.nights }}</b>
              <span>{{ t('trip.nights') }}</span>
            </div>
          </div>
        </div>
        <div
          class="hero"
          :style="heroStyle"
        >
          <div class="tagg">
            {{ itinerary.card.highlights.join(' · ').toUpperCase() }}
          </div>
        </div>
        <div
          v-if="itinerary.detail.facts.length"
          class="facts"
        >
          <div
            v-for="fact in itinerary.detail.facts"
            :key="fact[0]"
            class="fact"
          >
            <div class="fl">
              {{ fact[0] }}
            </div>
            <div class="fv">
              {{ fact[1] }}
            </div>
          </div>
        </div>
        <p class="desc">
          {{ itinerary.detail.long_description || itinerary.overview }}
        </p>

        <TripDepartureSwitcher
          :departures="itineraryDeps"
          :selected-id="selected.id"
          :rates="feed.rates"
          :offers="feed.offers"
          :from-month="flow.fromMonth"
          :to-month="flow.toMonth"
          :party="party"
          :max-per-cabin="feed.settings.guests.max_per_cabin"
          :days="itinerary.days"
          :nights="itinerary.nights"
          @select="onSelect"
          @waitlist="onWaitlist"
        />

        <div data-reveal>
          <div class="tabs">
            <button
              v-for="item in tabs"
              :key="item.id"
              type="button"
              class="tab"
              :class="{ cur: tab === item.id }"
              @click="tab = item.id"
            >
              {{ item.label }}
            </button>
          </div>
          <div
            v-if="tab !== 'route'"
            class="tabbody"
          >
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
                class="hlrow"
              >
                <b>{{ faq[0] }}</b>
                {{ faq[1] }}
              </div>
            </template>
          </div>
          <ClientOnly v-if="tab === 'route' && mapData">
            <TripRouteMap
              :data="mapData"
              :itinerary-name="itinerary.name"
            />
          </ClientOnly>
        </div>

        <div class="dt-actions">
          <NuxtLink
            to="/itineraries"
            class="btn o"
          >
            {{ t('trip.back') }}
          </NuxtLink>
          <button
            type="button"
            class="btn cta"
            @click="continueToCabins"
          >
            <span class="lb">{{ t('trip.selectCabins') }}</span>
            <span class="ico">→</span>
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
