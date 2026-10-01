<script setup lang="ts">
const { showHero, showCrumbs } = useFlowStep()
</script>

<template>
  <div class="engine">
    <ShellEngineHeader />
    <ShellEngineHero v-if="showHero" />
    <div
      class="wrap stage"
      :class="{ home: showHero }"
    >
      <ShellEngineCrumbs v-if="showCrumbs" />
      <slot />
    </div>
    <ShellEngineFooter />
    <ShellConsentBanner />
  </div>
</template>
