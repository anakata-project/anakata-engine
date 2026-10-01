<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="heroband">
    <span class="mono coords">
      <span class="coords-point">{{ t('hero.coordsPoint') }}</span>
      <span class="coords-dash"> — </span>
      <span class="coords-place">{{ t('hero.coordsPlace') }}</span>
    </span>
    <h1 class="disp">
      <span class="hero-desk">
        {{ t('hero.titleLine1') }}<br>{{ t('hero.titleLine2') }}
      </span>
      <span class="hero-mob">
        <span class="hero-line">{{ t('hero.m1') }}</span>
        <span class="hero-line">{{ t('hero.m2') }}</span>
        <span class="hero-line">{{ t('hero.m3') }}</span>
        <span class="hero-line">{{ t('hero.m4') }}</span>
      </span>
    </h1>
    <p class="sub">
      {{ t('hero.sub') }}
    </p>
    <img
      class="hero-prow"
      src="/brand/prow-mark.png"
      alt=""
      width="640"
      height="331"
      draggable="false"
    >
  </div>
</template>
