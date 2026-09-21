<script setup lang="ts">
import type { EngineDeparture, EngineOffer, EngineRates } from '../../types/api'
import {
  formatIsoDate,
  fromPrice,
  inWindow,
  isDimmedRow,
  labelToneClass,
  minCabins,
  rowAction
} from '../../utils/engineFlow'

const props = defineProps<{
  departures: Array<EngineDeparture>
  selectedId: number
  rates: EngineRates
  offers: Array<EngineOffer>
  fromMonth: string
  toMonth: string
  party: number
  maxPerCabin: number
  days: number
  nights: number
}>()

const emit = defineEmits<{
  select: [departure: EngineDeparture]
  waitlist: [departure: EngineDeparture]
}>()

const { t } = useI18n()
const min = computed(() => minCabins(props.party, props.maxPerCabin))
</script>

<template>
  <div
    class="dth"
    data-reveal
  >
    {{ t('trip.chooseDate') }}
  </div>
  <div class="dtable">
    <div class="dhead">
      <span>{{ t('trip.date') }}</span>
      <span>{{ t('trip.duration') }}</span>
      <span>{{ t('trip.yacht') }}</span>
      <span>{{ t('trip.availability') }}</span>
      <span />
    </div>
    <div
      v-for="dep in departures"
      :key="dep.id"
      class="drow"
      :class="{
        'full': isDimmedRow(dep.label),
        'selrow': dep.id === selectedId,
        'deal-on': dep.offers.length > 0
      }"
    >
      <div class="dd">
        {{ formatIsoDate(dep.embark) }} → {{ formatIsoDate(dep.disembark) }}
        <span
          v-if="!inWindow(dep.embark, fromMonth, toMonth)"
          class="outside"
        >· {{ t('itineraries.outside') }}</span>
      </div>
      <div class="dy">
        {{ t('trip.durationValue', { days, nights }) }}
      </div>
      <div class="dy">
        {{ dep.yacht }}
      </div>
      <div :class="labelToneClass(dep.label)">
        {{ dep.label }}
      </div>
      <div class="dcta">
        <span
          v-if="fromPrice(dep, rates, offers).pct"
          class="deal"
        >−{{ fromPrice(dep, rates, offers).pct }}%</span>
        <ItinerariesDepartureActions
          :action="rowAction(dep, min)"
          :departure="dep"
          :selected="dep.id === selectedId"
          compact
          @select="emit('select', $event)"
          @waitlist="emit('waitlist', $event)"
        />
      </div>
    </div>
  </div>
</template>
