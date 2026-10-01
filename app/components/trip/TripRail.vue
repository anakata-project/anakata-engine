<script setup lang="ts">
import type { EngineDeparture, EngineSettings } from '../../types/api'
import {
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
    adults: t('search.adultsCount', { n: props.adults }),
    children: childrenBit.value,
    cabins: min.value
  })
)

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const selectedDate = computed(() => {
  const parts = props.departure.embark.split('-')
  const month = Number(parts[1])
  const day = Number(parts[2])
  const year = parts[0]

  return `${SHORT_MONTHS[month - 1] ?? ''} ${day}, ${year}`
})
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
        {{ t('trip.selected', { date: selectedDate, yacht: departure.yacht }) }}
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
          <span
            class="dep-go"
            aria-hidden="true"
          />
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
