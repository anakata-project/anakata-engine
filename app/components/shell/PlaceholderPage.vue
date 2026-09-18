<script setup lang="ts">
const props = defineProps<{
  titleKey: string
}>()

const { t } = useI18n()

const title = computed(() => t(props.titleKey))

useHead(() => ({
  title: title.value
}))
</script>

<template>
  <section class="engine-placeholder">
    <header class="engine-placeholder__header">
      <h3 class="engine-placeholder__title">
        {{ title }}
      </h3>
    </header>
    <div class="engine-placeholder__body">
      <p class="placeholder-copy">
        {{ t('pages.comingIn', { n: 8 }) }}
      </p>
    </div>
  </section>
</template>
