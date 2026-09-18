<script setup lang="ts">
type HealthResponse = {
  status: string
}

const { t } = useI18n()
const { request } = useApi()
const ok = ref(false)
const checked = ref(false)

async function ping(): Promise<boolean> {
  try {
    const data = await request('/api/health') as HealthResponse
    return data.status === 'ok'
  } catch {
    return false
  }
}

const { data } = await useAsyncData('engine-api-health', ping)

ok.value = data.value === true
checked.value = true

onMounted(() => {
  void ping().then((next) => {
    ok.value = next
    checked.value = true
  })

  const timer = setInterval(() => {
    void ping().then((next) => {
      ok.value = next
      checked.value = true
    })
  }, 30000)

  onUnmounted(() => {
    clearInterval(timer)
  })
})

const label = computed(() => {
  if (!checked.value) {
    return t('shell.apiDown')
  }

  return ok.value ? t('shell.apiOk') : t('shell.apiDown')
})
</script>

<template>
  <span
    class="api-status"
    :class="ok ? 'api-status--ok' : 'api-status--down'"
  >
    {{ label }}
  </span>
</template>
