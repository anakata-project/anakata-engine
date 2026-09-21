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
</script>

<template>
  <div class="cabtabs">
    <button
      v-for="(cabin, index) in cabins"
      :key="index"
      type="button"
      class="cabtab"
      :class="{ cur: selected === index }"
      @click="emit('select', index)"
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
          @change="emit('adults', index, Number(($event.target as HTMLSelectElement).value))"
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
          @change="emit('children', index, Number(($event.target as HTMLSelectElement).value))"
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
    </button>
  </div>
</template>
