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

function numberItems(values: Array<number>): Array<{ label: string, value: number }> {
  return values.map(n => ({ label: String(n), value: n }))
}

const cabtabSelectUi = {
  base: '!bg-(--forest-950) ring ring-inset ring-(--hair) !text-(--iv62) !px-1.5 !py-1 font-mono !text-[9px] tracking-[.12em] uppercase min-h-0'
}

function onAdults(index: number, value: string | number | null | undefined): void {
  if (typeof value !== 'number') {
    return
  }

  emit('adults', index, value)
}

function onChildren(index: number, value: string | number | null | undefined): void {
  if (typeof value !== 'number') {
    return
  }

  emit('children', index, value)
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
        <USelect
          :model-value="cabin.adults"
          :items="numberItems(adultOptions(maxPerCabin))"
          :ui="cabtabSelectUi"
          @pointerdown.stop
          @click.stop
          @update:model-value="onAdults(index, $event)"
        />
        <USelect
          :model-value="cabin.children"
          :items="numberItems(childOptions(maxPerCabin))"
          :ui="cabtabSelectUi"
          @pointerdown.stop
          @click.stop
          @update:model-value="onChildren(index, $event)"
        />
        <span class="s">{{ t('cabins.adultsChildren') }}</span>
      </div>
    </button>
  </div>
</template>
