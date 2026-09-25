<script setup lang="ts">
import type { CabinSelection } from '../../utils/cabProblems'

defineProps<{
  cabins: Array<CabinSelection>
  selected: number
  maxPerCabin: number
}>()

const emit = defineEmits<{
  select: [index: number]
  adults: [index: number, value: number]
  children: [index: number, value: number]
}>()

const { t } = useI18n()

function adultOptions(max: number): Array<number> {
  return Array.from({ length: max }, (_, index) => index + 1)
}

function childOptions(max: number): Array<number> {
  return Array.from({ length: max }, (_, index) => index)
}

function onAdults(index: number, event: Event): void {
  emit('adults', index, Number((event.target as HTMLSelectElement).value))
}

function onChildren(index: number, event: Event): void {
  emit('children', index, Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="cabtabs">
    <div
      v-for="(cabin, index) in cabins"
      :key="index"
      class="cabtab"
      :class="{ cur: selected === index }"
      role="button"
      tabindex="0"
      @click="emit('select', index)"
      @keydown.enter.prevent="emit('select', index)"
    >
      <div class="t">
        {{ t('cabins.tab', { n: index + 1 }) }}{{ cabin.cabinCode ? ` · ${cabin.cabinCode}` : '' }}
      </div>
      <span class="s">
        {{ cabin.adults }} {{ t('cabins.adultsShort', { n: cabin.adults }) }}
        <template v-if="cabin.children">
          + {{ cabin.children }} {{ t('cabins.childrenShort', { n: cabin.children }) }}
        </template>
        · {{ cabin.cabinCode ? t('cabins.picked') : t('cabins.pickOnDeck') }}
      </span>
      <div class="cabtab-row">
        <select
          :value="cabin.adults"
          @click.stop
          @change="onAdults(index, $event)"
        >
          <option
            v-for="n in adultOptions(maxPerCabin)"
            :key="n"
            :value="n"
          >
            {{ n }}
          </option>
        </select>
        <select
          :value="cabin.children"
          @click.stop
          @change="onChildren(index, $event)"
        >
          <option
            v-for="n in childOptions(maxPerCabin)"
            :key="n"
            :value="n"
          >
            {{ n }}
          </option>
        </select>
        <span class="s">{{ t('cabins.adultsChildren') }}</span>
      </div>
    </div>
  </div>
</template>
