<script setup lang="ts">
const { t } = useI18n()
const { departure, close } = useWaitlist()
</script>

<template>
  <div
    v-if="departure"
    class="waitlist-mask"
    @click.self="close"
  >
    <div class="waitlist-stub">
      <h2 class="disp">
        {{ t('waitlist.title') }}
      </h2>
      <p>{{ t('waitlist.body') }}</p>
      <button
        type="button"
        class="btn o"
        @click="close"
      >
        {{ t('waitlist.close') }}
      </button>
    </div>
  </div>
</template>
