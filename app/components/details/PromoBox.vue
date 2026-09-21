<script setup lang="ts">
import type { PromoState } from '../../utils/promoState'

defineProps<{
  state: PromoState
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'apply': []
}>()
</script>

<template>
  <div
    class="promo"
    :class="{ applied: state.phase === 'applied' }"
  >
    <label for="d-promo">{{ $t('details.promo') }}</label>
    <div class="pr">
      <input
        id="d-promo"
        :value="modelValue"
        :disabled="state.locked"
        autocomplete="off"
        :placeholder="$t('details.promoPlaceholder')"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="emit('apply')"
      >
      <button
        type="button"
        @click="emit('apply')"
      >
        {{ state.phase === 'applied' ? $t('details.promoRemove') : $t('details.promoApply') }}
      </button>
    </div>
    <div
      class="pmsg"
      :class="{ ok: state.phase === 'applied', bad: state.phase === 'invalid' || state.phase === 'removed' }"
      aria-live="polite"
    >
      {{ state.message }}
    </div>
  </div>
</template>
