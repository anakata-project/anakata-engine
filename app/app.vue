<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const saved = useCookie<'en' | 'es'>('engine-locale')

if (saved.value === 'en' || saved.value === 'es') {
  await setLocale(saved.value)
}

useHead({
  titleTemplate: '%s · Anakata',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  htmlAttrs: {
    lang: locale
  }
})

useSeoMeta({
  description: t('seo.description')
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
