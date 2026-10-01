<script setup lang="ts">
import deckSvg from '../../assets/svg/yacht-deck-200.svg?raw'
import { DECK_200_SUITES, paintDeck200, type Deck200SuiteCode, type Deck200SuiteStatus } from '../../utils/deck200'

const props = withDefaults(defineProps<{
  statuses?: Partial<Record<Deck200SuiteCode, Deck200SuiteStatus>>
}>(), {
  statuses: () => ({})
})

const emit = defineEmits<{
  select: [code: Deck200SuiteCode]
}>()

const markup = computed(() => paintDeck200(deckSvg, props.statuses))

function codeFrom(target: EventTarget | null): Deck200SuiteCode | null {
  if (!(target instanceof Element)) {
    return null
  }

  const code = target.closest('[data-suite]')?.getAttribute('data-suite')

  if (code && (DECK_200_SUITES as ReadonlyArray<string>).includes(code)) {
    return code as Deck200SuiteCode
  }

  return null
}

function onClick(event: MouseEvent) {
  const code = codeFrom(event.target)

  if (code) {
    emit('select', code)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  const code = codeFrom(event.target)

  if (!code) {
    return
  }

  event.preventDefault()
  emit('select', code)
}
</script>

<template>
  <!-- Local deck artwork. paintDeck200 only writes known suite statuses. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="deck-plan"
    @click="onClick"
    @keydown="onKeydown"
    v-html="markup"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style src="../../assets/css/deck-suite.css"></style>
