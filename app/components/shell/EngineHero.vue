<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="heroband">
    <div
      class="sky"
      aria-hidden="true"
    />
    <span class="mono coords">{{ t('hero.coords') }}</span>
    <h1 class="disp">
      {{ t('hero.titleLine1') }}<br>{{ t('hero.titleLine2') }}
    </h1>
    <p class="sub">
      {{ t('hero.sub') }}
    </p>
  </div>
</template>
