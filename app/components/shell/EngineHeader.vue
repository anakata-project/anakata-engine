<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { expeditionsOn } = useFlowStep()
const saved = useCookie<'en' | 'es'>('engine-locale')
const route = useRoute()
const menuOpen = ref(false)

watch(() => route.path, () => {
  menuOpen.value = false
})

async function choose(code: 'en' | 'es'): Promise<void> {
  saved.value = code
  await setLocale(code)
}
</script>

<template>
  <header class="topbar">
    <NuxtLink
      to="/"
      class="brand"
      @click="menuOpen = false"
    >
      <img
        src="/brand/wordmark-dark.png"
        :alt="t('brand.alt')"
        class="brand-mark"
        draggable="false"
      >
    </NuxtLink>

    <button
      type="button"
      class="nav-toggle"
      :aria-expanded="menuOpen"
      :aria-label="menuOpen ? t('nav.close') : t('nav.menu')"
      @click="menuOpen = !menuOpen"
    >
      <span />
    </button>

    <nav
      class="topnav"
      :class="{ open: menuOpen }"
    >
      <NuxtLink
        to="/"
        :class="{ on: expeditionsOn }"
        @click="menuOpen = false"
      >
        {{ t('nav.expeditions') }}
      </NuxtLink>
      <NuxtLink
        to="/charter"
        :class="{ on: $route.path === '/charter' }"
        @click="menuOpen = false"
      >
        {{ t('nav.charter') }}
      </NuxtLink>
      <span class="locale">
        <button
          type="button"
          :class="{ on: locale === 'en' }"
          @click="choose('en')"
        >
          EN
        </button>
        <span aria-hidden="true">|</span>
        <button
          type="button"
          :class="{ on: locale === 'es' }"
          @click="choose('es')"
        >
          ES
        </button>
      </span>
      <AnkThemeToggle />
    </nav>
  </header>
</template>
