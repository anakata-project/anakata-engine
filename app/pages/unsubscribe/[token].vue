<script setup lang="ts">
import type { UnsubscribeView } from '../../types/api'
import { engineErrorStatus } from '../../utils/engineError'
import { unsubscribeConfirmed, unsubscribeScreen } from '../../utils/unsubscribePage'

const { t } = useI18n()
const { request } = useApi()
const route = useRoute()

const token = computed(() => String(route.params.token ?? ''))

useHead({
  title: t('unsubscribe.title'),
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
useSeoMeta({
  robots: 'noindex'
})

const { data, error } = await useAsyncData(
  () => `engine-unsubscribe-${token.value}`,
  () => request(`/api/engine/unsubscribe/${token.value}`) as Promise<UnsubscribeView>
)

const invalid = computed(() => {
  if (!error.value) {
    return false
  }

  const status = engineErrorStatus(error.value)

  return status === 404 || status === undefined
})

const confirmed = ref(false)
const saving = ref(false)
const failed = ref(false)

const screen = computed(() => {
  if (confirmed.value) {
    return 'confirmed' as const
  }

  if (failed.value) {
    return 'unknown' as const
  }

  return unsubscribeScreen(data.value ?? null, invalid.value)
})

async function withdraw(): Promise<void> {
  if (saving.value || screen.value !== 'prompt') {
    return
  }

  saving.value = true

  try {
    const next = await request(`/api/engine/unsubscribe/${token.value}`, {
      method: 'POST'
    }) as UnsubscribeView

    confirmed.value = unsubscribeConfirmed(next.already_unsubscribed)
  } catch (caught) {
    if (engineErrorStatus(caught) === 404 || engineErrorStatus(caught) === undefined) {
      failed.value = true
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="complete-page">
    <template v-if="screen === 'unknown'">
      <span class="mono klabel">{{ t('unsubscribe.k') }}</span>
      <h1 class="disp">
        {{ t('unsubscribe.title') }}
      </h1>
      <p class="sub">
        {{ t('unsubscribe.unknown') }}
      </p>
    </template>
    <template v-else-if="screen === 'confirmed'">
      <span class="mono klabel">{{ t('unsubscribe.k') }}</span>
      <h1 class="disp">
        {{ t('unsubscribe.title') }}
      </h1>
      <p class="sub">
        {{ t('unsubscribe.confirmed') }}
      </p>
      <p class="note">
        {{ t('unsubscribe.transactional') }}
      </p>
    </template>
    <template v-else-if="screen === 'prompt'">
      <span class="mono klabel">{{ t('unsubscribe.k') }}</span>
      <h1 class="disp">
        {{ t('unsubscribe.title') }}
      </h1>
      <p class="sub">
        {{ t('unsubscribe.prompt') }}
      </p>
      <button
        type="button"
        class="btn"
        :disabled="saving"
        @click="withdraw"
      >
        {{ t('unsubscribe.button') }}
      </button>
    </template>
  </div>
</template>
