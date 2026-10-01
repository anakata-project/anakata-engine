<script setup lang="ts">
import { stepMark, type FlowStep } from '../../utils/flowStep'

const { t } = useI18n()
const { step } = useFlowStep()

const crumbs = computed(() => [
  { step: 1 as FlowStep, label: t('crumbs.dates') },
  { step: 2 as FlowStep, label: t('crumbs.itinerary') },
  { step: 3 as FlowStep, label: t('crumbs.trip') },
  { step: 4 as FlowStep, label: t('crumbs.cabins') },
  { step: 5 as FlowStep, label: t('crumbs.details') },
  { step: 6 as FlowStep, label: t('crumbs.confirmation') }
])
</script>

<template>
  <nav
    v-if="step"
    class="stepper"
    :style="{ '--step': step ?? 1 }"
    :aria-label="t('crumbs.itinerary')"
  >
    <div
      v-for="crumb in crumbs"
      :key="crumb.step"
      class="step"
      :class="stepMark(step, crumb.step)"
    >
      <span
        class="dot"
        aria-hidden="true"
      />
      <span class="lbl">{{ crumb.label }}</span>
    </div>
  </nav>
</template>
