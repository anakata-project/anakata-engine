<script setup lang="ts">
import { formatUsd, type FromPrice } from '../../utils/engineFlow'

const props = defineProps<{
  price: FromPrice
  compact?: boolean
}>()

const { t } = useI18n()

const festive = computed(() => props.price.festive ? t('itineraries.plusFestive') : '')
</script>

<template>
  <span
    v-if="price.pct"
    class="pr"
  >
    <span class="deal">−{{ price.pct }}%</span>
    <span class="was">{{ formatUsd(price.base) }}</span>
    <span class="nowpr">{{ formatUsd(price.now) }} pp{{ festive }}</span>
  </span>
  <span
    v-else
    class="pr"
  >
    <span
      v-if="price.badge"
      class="deal"
    >{{ price.badge }}</span>
    <span v-if="price.priceLine && !compact">{{ price.priceLine }}</span>
    <span>from {{ formatUsd(price.base) }} pp{{ festive }}</span>
  </span>
</template>
