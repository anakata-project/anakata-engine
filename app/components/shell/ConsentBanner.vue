<script setup lang="ts">
const { t } = useI18n()
const { showBanner, refuse, accept } = useAnalyticsConsent()
</script>

<template>
  <div
    v-if="showBanner"
    class="consent-bar"
  >
    <p>{{ t('consent.body') }}</p>
    <div class="consent-actions">
      <button
        type="button"
        class="btn o"
        @click="refuse"
      >
        {{ t('consent.off') }}
      </button>
      <button
        type="button"
        class="btn"
        @click="accept"
      >
        {{ t('consent.on') }}
      </button>
    </div>
  </div>
</template>
