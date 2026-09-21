<script setup lang="ts">
import type { EngineCabin } from '../../types/api'
import type { CabinSelection } from '../../utils/cabProblems'
import { formatUsd } from '../../utils/engineFlow'

const props = defineProps<{
  cabins: Array<EngineCabin>
  selection: Array<CabinSelection>
  selectedIndex: number
  suiteRate: number
  ownerRate: number
}>()

const emit = defineEmits<{
  pick: [code: string]
}>()

const { t } = useI18n()

const upper = computed(() => props.cabins.filter(cabin => cabin.category === 'OWNER'))
const main = computed(() => props.cabins.filter(cabin => cabin.category !== 'OWNER'))

function ownerIndex(code: string): number {
  return props.selection.findIndex(cabin => cabin.cabinCode === code)
}

function classes(cabin: EngineCabin): Array<string> {
  const list = ['cabx']

  if (cabin.category === 'OWNER') {
    list.push('owner')
  }

  if (!cabin.bookable) {
    list.push('taken')
  }

  if (ownerIndex(cabin.code) >= 0) {
    list.push('sel')
  }

  return list
}
</script>

<template>
  <div>
    <div class="deck">
      <h5>
        {{ t('cabins.upperDeck') }}
        <span class="ori">{{ t('cabins.orientation') }}</span>
      </h5>
      <div class="hull">
        <div class="cabrow owner">
          <button
            v-for="cabin in upper"
            :key="cabin.code"
            type="button"
            :class="classes(cabin)"
            :disabled="!cabin.bookable"
            @click="cabin.bookable && emit('pick', cabin.code)"
          >
            <div class="cn">
              {{ cabin.code }}
            </div>
            <div class="ct">
              {{ t('cabins.ownersRate', { rate: formatUsd(ownerRate) }) }}
              <template v-if="ownerIndex(cabin.code) >= 0">
                · {{ t('cabins.tab', { n: ownerIndex(cabin.code) + 1 }) }}
              </template>
            </div>
          </button>
        </div>
      </div>
    </div>
    <div class="deck">
      <h5>
        {{ t('cabins.mainDeck') }}
        <span class="ori">{{ t('cabins.orientation') }}</span>
      </h5>
      <div class="hull">
        <div class="cabrow">
          <button
            v-for="cabin in main"
            :key="cabin.code"
            type="button"
            :class="classes(cabin)"
            :disabled="!cabin.bookable"
            @click="cabin.bookable && emit('pick', cabin.code)"
          >
            <div class="cn">
              {{ cabin.code }}
            </div>
            <div class="ct">
              {{ t('cabins.suiteRate', { rate: formatUsd(suiteRate) }) }}
              <template v-if="ownerIndex(cabin.code) >= 0">
                · {{ t('cabins.tab', { n: ownerIndex(cabin.code) + 1 }) }}
              </template>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
