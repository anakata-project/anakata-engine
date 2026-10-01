<script setup lang="ts">
import deckSvg from '../../assets/svg/yacht-deck-100.svg?raw'
import { DECK_100_SUITES, paintDeck100, type Deck100SuiteCode, type Deck100SuiteStatus } from '../../utils/deck100'

const props = withDefaults(defineProps<{
  statuses?: Partial<Record<Deck100SuiteCode, Deck100SuiteStatus>>
}>(), {
  statuses: () => ({})
})

const emit = defineEmits<{
  select: [code: Deck100SuiteCode]
}>()

const markup = computed(() => paintDeck100(deckSvg, props.statuses))

function codeFrom(target: EventTarget | null): Deck100SuiteCode | null {
  if (!(target instanceof Element)) {
    return null
  }

  const code = target.closest('[data-suite]')?.getAttribute('data-suite')

  if (code && (DECK_100_SUITES as ReadonlyArray<string>).includes(code)) {
    return code as Deck100SuiteCode
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
  <!-- Local deck artwork. paintDeck100 only writes known suite statuses. -->
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
