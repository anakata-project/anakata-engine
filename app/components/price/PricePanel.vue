<script setup lang="ts">
import type { EngineQuote, EngineSettings } from '../../types/api'
import type { PriceEstimate } from '../../utils/priceEstimate'
import { formatUsd } from '../../utils/engineFlow'

const props = defineProps<{
  quote: EngineQuote | null
  estimate: PriceEstimate
  settings: EngineSettings
  path: 'PAY_LATER' | 'PAY_DEPOSIT'
  title: string
}>()

const { format } = useMoney()

const isFinal = computed(() => props.quote?.total !== null && props.quote?.total !== undefined)

const depositLabel = computed(() => {
  const pct = props.quote?.cabins[0]?.quote?.deposit_pct
    ?? props.estimate.depositPct
  const days = props.quote?.terms.balance_days ?? props.estimate.balanceDays

  if (props.path === 'PAY_DEPOSIT') {
    return `Deposit paid online today (${pct}%)`
  }

  return `Deposit on confirmation (${pct}%) · balance ${days} days before departure`
})
</script>

<template>
  <div class="side">
    <h4>{{ title }}</h4>
    <template v-if="isFinal && quote">
      <div
        v-for="(cabin, index) in quote.cabins"
        :key="cabin.cabin_code ?? index"
      >
        <div class="line hd">
          <span>{{ cabin.cabin_label }}</span>
          <span />
        </div>
        <div
          v-for="line in cabin.quote?.lines ?? []"
          :key="line.code + line.label"
          class="line"
          :class="{ neg: line.amount < 0 }"
        >
          <span>{{ line.label }}</span>
          <span>{{ line.amount < 0 ? '−' : '' }}{{ format(Math.abs(line.amount)) }}</span>
        </div>
        <div
          v-if="cabin.quote"
          class="line"
        >
          <span class="sand">Cabin subtotal</span>
          <span>{{ format(cabin.quote.total) }}</span>
        </div>
      </div>
      <div
        v-for="line in estimate.extras"
        :key="line.label"
        class="line info"
      >
        <span>{{ line.label }}</span>
        <span>{{ formatUsd(line.amount) }} *</span>
      </div>
      <div
        v-if="path === 'PAY_DEPOSIT' && settings.copy.online_deposit_perk"
        class="line info"
      >
        <span>{{ settings.copy.online_deposit_perk }}</span>
        <span>Included</span>
      </div>
      <div class="line tot">
        <span>Total (USD)</span>
        <span>{{ format(quote.total ?? 0) }}</span>
      </div>
      <div class="line">
        <span>{{ depositLabel }}</span>
        <span>{{ format(quote.deposit ?? 0) }}</span>
      </div>
    </template>
    <template v-else>
      <div
        v-for="group in estimate.groups"
        :key="group.name"
      >
        <div class="line hd">
          <span>{{ group.name }}</span>
          <span />
        </div>
        <div
          v-for="line in group.lines"
          :key="line.label"
          class="line"
          :class="{ neg: line.kind === 'neg' }"
        >
          <span>{{ line.label }}</span>
          <span>{{ line.amount < 0 ? '−' : '' }}{{ formatUsd(Math.abs(line.amount)) }}</span>
        </div>
        <div class="line">
          <span class="sand">Cabin subtotal</span>
          <span>{{ formatUsd(group.total) }}</span>
        </div>
      </div>
      <div
        v-for="line in estimate.extras.filter(item => item.kind === 'info')"
        :key="line.label"
        class="line info"
      >
        <span>{{ line.label }}</span>
        <span>{{ formatUsd(line.amount) }} *</span>
      </div>
      <div class="line tot">
        <span>Total (USD)</span>
        <span>{{ formatUsd(estimate.invoiceTotal) }}</span>
      </div>
      <div class="line">
        <span>{{ depositLabel }}</span>
        <span>{{ formatUsd(estimate.deposit) }}</span>
      </div>
    </template>
    <p
      v-if="settings.fees.show_in_price_panel"
      class="note"
    >
      {{ settings.fees.footnote }}
    </p>
    <slot />
  </div>
</template>
