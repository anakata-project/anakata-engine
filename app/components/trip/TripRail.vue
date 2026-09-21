<script setup lang="ts">
import type { EngineDeparture, EngineSettings } from '../../types/api'
import {
  formatIsoDate,
  formatUsd,
  minCabins
} from '../../utils/engineFlow'

const props = defineProps<{
  from: number
  festive: boolean
  departure: EngineDeparture
  settings: EngineSettings
  adults: number
  children: number
  party: number
}>()

const emit = defineEmits<{
  continue: []
}>()

const { t } = useI18n()

const min = computed(() => minCabins(props.party, props.settings.guests.max_per_cabin))

const childrenBit = computed(() =>
  props.children > 0 ? t('itineraries.plusChildren', { n: props.children }) : ''
)

const partyLine = computed(() =>
  t('trip.partyLine', {
    n: min.value,
    party: props.party,
    adults: t('search.adultsCount', { n: props.adults }),
    children: childrenBit.value,
    cabins: min.value
  })
)
</script>

<template>
  <div class="rail">
    <div class="railbox">
      <div class="from">
        {{ t('trip.from') }}
      </div>
      <div class="amt">
        {{ formatUsd(from) }}
        <small>{{ festive ? t('trip.fromFestive') : t('trip.fromSuffix') }}</small>
      </div>
      <div class="tick">
        {{ t('trip.noFees') }}
      </div>
      <div class="tick">
        {{ t('trip.payLaterTick') }}
      </div>
      <div class="tick">
        {{ t('trip.assistance') }}
      </div>
      <div class="railsel">
        {{ t('trip.selected', { date: formatIsoDate(departure.embark), yacht: departure.yacht }) }}
        <br>
        {{ partyLine }}
      </div>
      <div class="rail-cta">
        <button
          type="button"
          class="btn"
          @click="emit('continue')"
        >
          {{ t('trip.selectCabinsShort') }}
        </button>
      </div>
    </div>
    <div class="railnote">
      <b>{{ t('trip.payLaterTitle') }}</b>
      {{ settings.copy.book_now_pay_later }}
    </div>
    <div class="railnote">
      <b>{{ t('trip.childrenTitle') }}</b>
      {{ settings.copy.traveling_with_children }}
    </div>
    <div class="railnote">
      <b>{{ t('trip.soloTitle') }}</b>
      {{ settings.copy.solo_and_triple }}
    </div>
  </div>
</template>
