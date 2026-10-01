<script setup lang="ts">
import type { CheckoutStatus } from '../../types/api'
import { confirmationScreen, POLL_INTERVAL_MS } from '../../utils/confirmationPoll'

const { t, locale } = useI18n()
const route = useRoute()
const { flow } = useBookingFlow()
const checkout = useCheckout()
const { format } = useMoney()
const { data: feed } = useEngineFeed()

useHead({ title: t('pages.confirmation') })

const pollStartedAt = ref(Date.now())
const nowTick = ref(Date.now())
const status = ref<CheckoutStatus | null>(null)
const purchased = ref(false)

onMounted(async () => {
  await nextTick()

  if (!flow.value.confirmation && !route.query.session_id && !flow.value.checkoutToken) {
    await navigateTo('/')
  }
})

const path = computed(() =>
  flow.value.confirmation?.path
  ?? status.value?.path
  ?? (route.query.session_id ? 'PAY_DEPOSIT' : flow.value.path)
)

const screen = computed(() => confirmationScreen({
  path: path.value,
  now: nowTick.value,
  pollStartedAt: pollStartedAt.value,
  bookings: status.value?.bookings ?? [],
  stripeExpiresAt: status.value?.stripe_expires_at ?? null
}))

const references = computed(() =>
  flow.value.confirmation?.references
  ?? status.value?.bookings.map(booking => booking.reference).filter((value): value is string => Boolean(value))
  ?? []
)

const email = computed(() =>
  flow.value.confirmation?.email
  ?? status.value?.email
  ?? flow.value.email
)

const sla = computed(() => feed.value?.settings.policies.response_sla_hours ?? 24)

const departure = computed(() =>
  feed.value?.departures.find(item => item.id === flow.value.departureId) ?? null
)

const depositPct = computed(() => {
  const quoted = flow.value.serverQuote?.cabins[0]?.quote?.deposit_pct

  if (typeof quoted === 'number') {
    return quoted
  }

  return feed.value?.rates.terms.cabin_deposit_pct ?? 0
})

const balanceAmount = computed(() => {
  const total = flow.value.serverQuote?.total
  const deposit = flow.value.serverQuote?.deposit

  if (typeof total !== 'number' || typeof deposit !== 'number') {
    return null
  }

  return Math.max(0, total - deposit)
})

const balanceDays = computed(() =>
  flow.value.serverQuote?.terms.balance_days
  ?? feed.value?.rates.terms.cabin_balance_days
  ?? 0
)

function suiteName(code: string): string {
  if (/owner/i.test(code)) {
    return t('confirm.ownerSuite')
  }

  const number = code.replace(/^suite\s+/i, '')

  return t('confirm.standardSuite', { code: number })
}

const suitePhrase = computed(() =>
  flow.value.cabins
    .map(cabin => cabin.cabinCode)
    .filter((code): code is string => Boolean(code))
    .map(code => suiteName(code))
    .join(', ')
)

const departureDate = computed(() => {
  const iso = departure.value?.embark

  if (!iso) {
    return ''
  }

  const [year, month, day] = iso.split('-').map(Number)

  return new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)))
})

const referenceText = computed(() => {
  if (!references.value.length) {
    return ''
  }

  const key = path.value === 'PAY_DEPOSIT' ? 'confirm.bookingRef' : 'confirm.requestRef'

  return t(key, { ref: references.value.join(' · ') })
})

const paidLead = computed(() => {
  const yacht = departure.value?.yacht ?? ''
  const suite = suitePhrase.value
  const date = departureDate.value

  if (!yacht || !suite || !date) {
    return t('confirm.paidLeadPlain', { email: email.value })
  }

  return t('confirm.paidLead', {
    pct: depositPct.value,
    suite,
    yacht,
    date,
    email: email.value
  })
})
const steps = computed(() => {
  const raw = feed.value?.settings.copy.confirmation_steps ?? []

  return raw.map((step, index) => {
    if (index === 0) {
      return step.replace(/\d+\s+hours?/, `${sla.value} hours`)
    }

    return step
  })
})

function firePurchase(): void {
  if (purchased.value) {
    return
  }

  purchased.value = true
  track('purchase', {
    transaction_id: references.value.join(','),
    value: flow.value.serverQuote?.total ?? 0,
    currency: 'USD'
  })
}

async function poll(): Promise<void> {
  const token = flow.value.checkoutToken

  if (!token) {
    return
  }

  status.value = await checkout.status(token)
  nowTick.value = Date.now()

  if (confirmationScreen({
    path: path.value,
    now: nowTick.value,
    pollStartedAt: pollStartedAt.value,
    bookings: status.value?.bookings ?? [],
    stripeExpiresAt: status.value?.stripe_expires_at ?? null
  }) === 'confirmed') {
    firePurchase()
  }
}

onMounted(async () => {
  if (path.value !== 'PAY_DEPOSIT') {
    return
  }

  if (!flow.value.checkoutToken && !route.query.session_id) {
    await navigateTo('/')

    return
  }

  pollStartedAt.value = Date.now()
  nowTick.value = pollStartedAt.value
  await poll()

  const timer = setInterval(async () => {
    nowTick.value = Date.now()
    const next = confirmationScreen({
      path: path.value,
      now: nowTick.value,
      pollStartedAt: pollStartedAt.value,
      bookings: status.value?.bookings ?? [],
      stripeExpiresAt: status.value?.stripe_expires_at ?? null
    })

    if (next !== 'confirming') {
      clearInterval(timer)

      return
    }

    await poll()
  }, POLL_INTERVAL_MS)

  onUnmounted(() => {
    clearInterval(timer)
  })
})

const heading = computed(() => {
  switch (screen.value) {
    case 'confirmed':
      return { k: t('confirm.paidK'), t: t('confirm.paidTitle') }
    case 'expired':
      return { k: t('confirm.expiredK'), t: t('confirm.expiredTitle') }
    case 'processing':
      return { k: t('confirm.processingK'), t: t('confirm.processingTitle') }
    case 'confirming':
      return { k: t('confirm.confirmingK'), t: t('confirm.confirmingTitle') }
    default:
      return { k: t('confirm.requestK'), t: t('confirm.requestTitle') }
  }
})
</script>

<template>
  <div class="confirm">
    <span class="mono klabel">{{ heading.k }}</span>
    <h1 class="disp">
      {{ heading.t }}
    </h1>
    <div
      v-if="referenceText"
      class="bigid"
    >
      {{ referenceText }}
    </div>
    <p
      v-if="screen === 'confirming'"
      class="sub"
    >
      {{ t('confirm.confirmingLead') }}
    </p>
    <p
      v-else-if="screen === 'processing'"
      class="sub"
    >
      {{ t('confirm.processingLead', { email }) }}
      <a :href="`mailto:${t('search.contactEmail')}`">{{ t('search.contactEmail') }}</a>
    </p>
    <p
      v-else-if="screen === 'expired'"
      class="sub"
    >
      {{ t('confirm.expiredLead') }}
    </p>
    <p
      v-else-if="screen === 'confirmed'"
      class="sub"
    >
      {{ paidLead }}
    </p>
    <p
      v-else
      class="sub"
    >
      {{ t('confirm.requestLead') }}
    </p>
    <div
      v-if="screen === 'pay_later'"
      class="next3"
    >
      <div
        v-for="(step, index) in steps"
        :key="step"
        class="nx"
      >
        <div class="n">
          {{ index + 1 }}
        </div>
        <p>{{ step }}</p>
      </div>
    </div>
    <div
      v-else-if="screen === 'confirmed'"
      class="next3"
    >
      <div class="nx">
        <div class="n">
          1
        </div>
        <p>{{ t('confirm.paid1', { hours: sla }) }}</p>
      </div>
      <div class="nx">
        <div class="n">
          2
        </div>
        <p>
          {{ balanceAmount !== null
            ? t('confirm.paid2', { amount: format(balanceAmount), days: balanceDays })
            : t('confirm.paid2Plain') }}
        </p>
      </div>
      <div class="nx">
        <div class="n">
          3
        </div>
        <p>{{ t('confirm.paid3') }}</p>
      </div>
    </div>
    <NuxtLink
      to="/"
      class="btn o"
    >
      {{ t('confirm.return') }}
    </NuxtLink>
  </div>
</template>
