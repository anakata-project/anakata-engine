<script setup lang="ts">
import {
  formatMonthShort
} from '../utils/engineFlow'

const { t } = useI18n()
const { data: feed, error, pending } = useEngineFeed()
const { flow, hydrateFromSettings } = useBookingFlow()

useHead({ title: t('pages.home') })

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

function search(): void {
  if (!feed.value) {
    return
  }

  track('search_availability', {
    from: formatMonthShort(flow.value.fromMonth),
    to: formatMonthShort(flow.value.toMonth),
    adults: flow.value.adults,
    children: flow.value.children
  })
  void navigateTo('/itineraries')
}
</script>

<template>
  <div>
    <p
      v-if="error"
      class="bbnote"
    >
      {{ error.message }}
    </p>
    <SearchBookingBar
      v-else-if="feed"
      :settings="feed.settings"
      @search="search"
    />
    <p
      v-else-if="pending"
      class="bbnote"
    >
      …
    </p>
  </div>
</template>
