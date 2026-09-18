<script setup lang="ts">
const { showHero, showCrumbs } = useFlowStep()
</script>

<template>
  <div class="engine">
    <ShellEngineHeader />
    <div class="wrap stage">
      <ShellEngineHero v-if="showHero" />
      <ShellEngineCrumbs v-if="showCrumbs" />
      <slot />
    </div>
    <ShellEngineFooter />
  </div>
</template>
