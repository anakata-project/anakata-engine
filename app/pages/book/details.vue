<script setup lang="ts">
import type { EngineCountry, EngineDeparture, EngineEventParams, PromoCheck } from '../../types/api'
import { guestsFromCabins } from '../../composables/useBookingFlow'
import { formatIsoDate } from '../../utils/engineFlow'
import { submitSessionId } from '../../utils/engineSession'
import {
  MARKETING_LEAD_POSTED_KEY,
  checkoutMarketingVersion,
  marketingLeadBody
} from '../../utils/marketingLead'
import { onlineDepositForPath, requiredDeclarations } from '../../utils/pathQuote'
import { estimatePrice } from '../../utils/priceEstimate'
import { applyPromoResult, removePromoForReason } from '../../utils/promoState'

const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const { request } = useApi()
const { format } = useMoney()
const { data: feed } = useEngineFeed()
const { flow, hydrateFromSettings } = useBookingFlow()
const checkout = useCheckout()
const hold = useHold()

useHead({ title: t('pages.details') })

watch(() => feed.value?.settings, (settings) => {
  if (settings) {
    hydrateFromSettings(settings)
  }
}, { immediate: true })

if (import.meta.client && !flow.value.checkoutToken) {
  await navigateTo('/book/cabins')
}

const { data: countries } = await useAsyncData('engine-countries', () =>
  request('/api/engine/countries') as Promise<Array<EngineCountry>>
)

const nationalityItems = computed(() =>
  (countries.value ?? []).map(country => ({ label: country.name, value: country.code }))
)

const checkUi = {
  root: 'items-start gap-3 py-3',
  label: 'font-sans font-normal text-[13.5px] leading-snug text-(--ivory)'
}

const departure = computed<EngineDeparture | null>(() =>
  feed.value?.departures.find(item => item.id === flow.value.departureId) ?? null
)

const itinerary = computed(() =>
  feed.value?.itineraries.find(item => item.code === (departure.value?.itinerary ?? flow.value.itineraryCode)) ?? null
)

const settings = computed(() => feed.value?.settings ?? null)
const promoInput = ref(flow.value.promo.code ?? '')
const bad = reactive({
  firstName: false,
  lastName: false,
  email: false,
  phone: false
})
const formError = ref('')
const abandoned = ref(false)
let trackedEnter = false

const cabinCategories = computed<Record<string, 'SUITE' | 'OWNER'>>(() => {
  const map: Record<string, 'SUITE' | 'OWNER'> = {}

  for (const guest of flow.value.guests) {
    map[guest.cabinCode] = guest.cabinCode.includes('Owner') ? 'OWNER' : 'SUITE'
  }

  return map
})

const estimate = computed(() => {
  if (!feed.value || !departure.value || !settings.value) {
    return null
  }

  return estimatePrice({
    cabins: flow.value.cabins,
    cabinCategories: cabinCategories.value,
    rates: feed.value.rates,
    year: departure.value.rate_year,
    festive: departure.value.festive,
    offers: feed.value.offers,
    offerCodes: departure.value.offers,
    settings: settings.value,
    guests: flow.value.guests.map(guest => ({
      nationality: guest.nationality || null,
      ecuadorResident: guest.ecuadorResident,
      isChild: guest.isChild
    })),
    onlineDeposit: onlineDepositForPath(flow.value.path)
  })
})

onMounted(() => {
  flow.value.guests = guestsFromCabins(flow.value.cabins, flow.value.guests)

  if (departure.value?.festive && flow.value.promo.code) {
    const coupon = flow.value.promo.code
    flow.value.promo = removePromoForReason(t('details.promoFestiveRemoved'))
    promoInput.value = ''
    track('remove_promotion', { coupon }, { coupon_code: coupon })
  }

  if (!trackedEnter) {
    trackedEnter = true
    track('begin_booking_request', {
      itinerary_name: itinerary.value?.name ?? '',
      num_cabins: flow.value.cabins.length,
      value: flow.value.serverQuote?.total ?? estimate.value?.invoiceTotal ?? 0,
      currency: 'USD'
    }, crmTrip())
  }

  void checkout.quote()
  void hold.extendIfDue()

  const timer = setInterval(() => {
    void hold.extendIfDue()
    hold.checkExpiry()
  }, 15_000)

  function onHide(): void {
    if (document.visibilityState === 'hidden' || document.visibilityState === undefined) {
      // Synchronous, before the analytics plugin flushes on a microtask.
      void captureMarketingLead()
      fireAbandon()
      hold.releaseBeacon()
    }
  }

  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', onHide)

  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('pagehide', onHide)
    document.removeEventListener('visibilitychange', onHide)
  })
})

function crmTrip(extra: EngineEventParams = {}): EngineEventParams {
  const params: EngineEventParams = {
    cabin_count: flow.value.cabins.length,
    ...extra
  }

  if (itinerary.value?.code) {
    params.itinerary_code = itinerary.value.code
  }

  if (departure.value?.id) {
    params.departure_id = departure.value.id
  }

  return params
}

let leadInFlight = false

function leadAlreadyPosted(): boolean {
  if (!import.meta.client) {
    return false
  }

  return sessionStorage.getItem(MARKETING_LEAD_POSTED_KEY) === '1'
}

async function captureMarketingLead(): Promise<void> {
  if (!import.meta.client || leadInFlight) {
    return
  }

  const body = marketingLeadBody({
    ticked: flow.value.cartMarketing,
    email: flow.value.email,
    firstName: flow.value.firstName,
    version: checkoutMarketingVersion(settings.value?.legal.consent_versions),
    posted: leadAlreadyPosted(),
    sessionId: submitSessionId()
  })

  if (!body) {
    return
  }

  leadInFlight = true

  try {
    const response = await fetch(`${String(config.public.apiBase).replace(/\/$/, '')}/api/engine/marketing-leads`, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      leadInFlight = false

      return
    }

    const json = await response.json() as { accepted?: boolean }

    if (json.accepted === true) {
      sessionStorage.setItem(MARKETING_LEAD_POSTED_KEY, '1')

      return
    }

    leadInFlight = false
  } catch {
    leadInFlight = false
  }
}

function fireAbandon(): void {
  if (abandoned.value) {
    return
  }

  abandoned.value = true
  track('abandon_cart', {
    last_step_reached: 'details',
    itinerary_name: itinerary.value?.name ?? ''
  }, crmTrip({ step: 'details' }))
}

function selectPath(path: 'PAY_LATER' | 'PAY_DEPOSIT'): void {
  checkout.setPath(path)
  track('select_payment_path', { payment_path: path === 'PAY_DEPOSIT' ? 'online' : 'later' }, { path })
  void checkout.quote()
}

async function applyPromo(): Promise<void> {
  if (flow.value.promo.phase === 'applied') {
    track('remove_promotion', { coupon: flow.value.promo.code ?? '' }, {
      coupon_code: flow.value.promo.code ?? ''
    })
    flow.value.promo = applyPromoResult(flow.value.promo, '', false, null, null)
    promoInput.value = ''
    await checkout.quote()

    return
  }

  const code = promoInput.value.trim().toUpperCase()

  if (!code) {
    flow.value.promo = applyPromoResult(flow.value.promo, '', false, null, null)

    return
  }

  const result = await request('/api/engine/promo/check', {
    method: 'POST',
    body: {
      code,
      departure_id: flow.value.departureId,
      cabins: flow.value.cabins.map(cabin => ({
        cabin_code: cabin.cabinCode,
        adults: cabin.adults,
        children: cabin.children
      }))
    }
  }) as PromoCheck

  if (!result.valid) {
    track('promo_invalid', { coupon: code }, { coupon_code: code })
    flow.value.promo = applyPromoResult(flow.value.promo, code, false, result.reason, null)
    await checkout.quote()

    return
  }

  flow.value.promo = applyPromoResult(
    flow.value.promo,
    code,
    true,
    null,
    result.line ? `${result.line} applied` : code
  )
  track('apply_promotion', { coupon: code, itinerary_name: itinerary.value?.name ?? '' }, {
    coupon_code: code
  })
  await checkout.quote()
}

function toggleDeclaration(document: string, checked: boolean): void {
  const next = new Set(flow.value.declarations)

  if (checked) {
    next.add(document)
  } else {
    next.delete(document)
  }

  flow.value.declarations = Array.from(next)
}

function validForm(): boolean {
  bad.firstName = !flow.value.firstName.trim()
  bad.lastName = !flow.value.lastName.trim()
  bad.email = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(flow.value.email)
  bad.phone = Boolean(flow.value.phone) && !/^\+/.test(flow.value.phone)

  const missingGuests = flow.value.guests.some(guest => !guest.nationality)
  const needed = requiredDeclarations(flow.value.path)
  const missingDocs = needed.some(document => !flow.value.declarations.includes(document))

  return !bad.firstName && !bad.lastName && !bad.email && !bad.phone && !missingGuests && !missingDocs
}

async function submit(path: 'PAY_LATER' | 'PAY_DEPOSIT'): Promise<void> {
  selectPath(path)

  if (!validForm()) {
    formError.value = t('details.formError')
    track('booking_form_invalid', { payment_path: path === 'PAY_DEPOSIT' ? 'online' : 'later' }, {
      step: 'details'
    })
    await nextTick()
    const first = document.querySelector<HTMLInputElement>('.field.bad input, .field.bad select')
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    first?.focus({ preventScroll: true })

    return
  }

  formError.value = ''

  if (!flow.value.serverQuote) {
    await checkout.quote()
  }

  const total = flow.value.serverQuote?.total
  const crm = crmTrip({ path, currency: 'USD' })

  if (typeof total === 'number' && Number.isInteger(total)) {
    crm.value = total
  }

  track('submit_booking_request', {
    itinerary_name: itinerary.value?.name ?? '',
    departure: departure.value ? formatIsoDate(departure.value.embark) : '',
    num_cabins: flow.value.cabins.length,
    num_passengers: flow.value.adults + flow.value.children,
    estimated_value: flow.value.serverQuote?.total ?? 0,
    currency: 'USD',
    channel: 'WEB_DIRECT',
    travel_advisor: flow.value.travelAdvisor,
    coupon: flow.value.promo.code ?? undefined,
    payment_path: path === 'PAY_DEPOSIT' ? 'online' : 'later',
    deposit_paid_online: path === 'PAY_DEPOSIT'
  }, crm)

  const result = await checkout.submit()

  if (result === 'price') {
    formError.value = checkout.priceChanged?.message ?? t('details.priceChanged')

    return
  }

  if (result === 'hold') {
    await hold.release()
    await navigateTo('/book/cabins')

    return
  }

  if (result === 'error') {
    formError.value = checkout.submitError

    if (flow.value.confirmation) {
      hold.retain()
    }

    return
  }

  hold.retain()
  await captureMarketingLead()

  if (result.path === 'PAY_DEPOSIT' && result.checkout_url) {
    window.location.assign(result.checkout_url)

    return
  }

  await navigateTo('/book/confirmation')
}

async function back(): Promise<void> {
  await captureMarketingLead()
  await hold.release()
  await navigateTo('/book/cabins')
}

function acceptPrice(): void {
  checkout.priceChanged = null
  formError.value = ''
}

const cancelled = computed(() => route.query.cancelled === '1')

const label = computed(() => {
  if (!itinerary.value || !departure.value) {
    return ''
  }

  return `${itinerary.value.name} · ${departure.value.yacht} · ${formatIsoDate(departure.value.embark)}`
})

const payToday = computed(() => {
  if (flow.value.path === 'PAY_DEPOSIT') {
    return format(flow.value.serverQuote?.deposit ?? estimate.value?.deposit ?? 0)
  }

  return format(0)
})

const versions = computed(() => settings.value?.legal.consent_versions)
const extrasHours = computed(() => settings.value?.policies.extras_due_hours ?? 0)

const declarationItems = computed(() => {
  if (!versions.value) {
    return []
  }

  const all = [
    { document: 'TERMS', label: t('details.declTerms'), version: versions.value.terms },
    { document: 'CANCELLATION', label: t('details.declCancel'), version: versions.value.cancellation },
    { document: 'PRIVACY', label: t('details.declPrivacy'), version: versions.value.privacy },
    { document: 'INSURANCE', label: t('details.declInsurance'), version: versions.value.insurance }
  ]
  const required = requiredDeclarations(flow.value.path)

  return all.map(item => ({
    ...item,
    required: required.includes(item.document)
  }))
})
</script>

<template>
  <div v-if="feed && departure && settings && estimate">
    <span class="mono klabel">{{ label }}</span>
    <h1 class="disp">
      {{ t('details.title') }}
    </h1>
    <p class="sub">
      {{ t('details.sub') }}
    </p>
    <p
      v-if="hold.expired || cancelled"
      class="cabwarn"
    >
      ⚠ {{ hold.expired ? hold.releasedMessage : t('details.cancelled') }}
    </p>
    <div class="wgrid">
      <div>
        <div class="fsec">
          <h3>{{ t('details.contact') }}</h3>
          <div class="cols2">
            <div
              class="field"
              :class="{ bad: bad.firstName }"
            >
              <label>{{ t('details.firstName') }}</label>
              <input v-model="flow.firstName">
              <div class="err">
                {{ t('details.required') }}
              </div>
            </div>
            <div
              class="field"
              :class="{ bad: bad.lastName }"
            >
              <label>{{ t('details.lastName') }}</label>
              <input v-model="flow.lastName">
              <div class="err">
                {{ t('details.required') }}
              </div>
            </div>
          </div>
          <div class="cols2">
            <div
              class="field"
              :class="{ bad: bad.email }"
            >
              <label>{{ t('details.email') }}</label>
              <input
                v-model="flow.email"
                type="email"
              >
              <div class="err">
                {{ t('details.emailErr') }}
              </div>
              <UCheckbox
                v-model="flow.cartMarketing"
                :label="t('details.checkoutMarketing')"
                :ui="checkUi"
              />
            </div>
            <div
              class="field"
              :class="{ bad: bad.phone }"
            >
              <label>{{ t('details.phone') }}</label>
              <input
                v-model="flow.phone"
                :placeholder="t('details.phonePh')"
              >
              <div class="err">
                {{ t('details.phoneErr') }}
              </div>
            </div>
          </div>
          <div class="field">
            <label>{{ t('details.channel') }}</label>
            <div class="radio">
              <button
                v-for="opt in (['EMAIL', 'PHONE', 'WHATSAPP'] as const)"
                :key="opt"
                type="button"
                class="opt"
                :class="{ on: flow.preferredChannel === opt }"
                @click="flow.preferredChannel = opt"
              >
                {{ t(`details.channel_${opt}`) }}
              </button>
            </div>
          </div>
          <UCheckbox
            v-model="flow.travelAdvisor"
            :label="t('details.advisor')"
            :ui="checkUi"
          />
          <div class="field">
            <label>{{ t('details.notes') }}</label>
            <textarea
              v-model="flow.notes"
              rows="3"
              :placeholder="t('details.notesPh')"
            />
          </div>
          <UCheckbox
            v-model="flow.marketing"
            :label="t('details.marketing')"
            :ui="checkUi"
          />
          <p class="note">
            {{ settings.copy.details_note }}
          </p>
        </div>

        <div class="fsec">
          <h3>{{ t('details.guests') }}</h3>
          <div
            v-for="(guest, index) in flow.guests"
            :key="`${guest.cabinCode}-${index}`"
            class="cols2 guest-row"
          >
            <div class="field">
              <label>{{ t('details.nationality', { n: index + 1, cabin: guest.cabinCode }) }}</label>
              <USelectMenu
                :model-value="guest.nationality || undefined"
                class="w-full"
                value-key="value"
                :items="nationalityItems"
                :placeholder="t('details.chooseCountry')"
                :search-input="{ placeholder: t('details.searchCountry') }"
                @update:model-value="guest.nationality = typeof $event === 'string' ? $event : ''"
              />
            </div>
            <div class="field">
              <label aria-hidden="true">&nbsp;</label>
              <UCheckbox
                v-model="guest.ecuadorResident"
                class="guest-check"
                :label="t('details.ecuador')"
                :ui="{ root: 'items-center gap-3 min-h-[46px]', label: 'font-sans font-normal text-[13.5px] text-(--ivory)' }"
              />
            </div>
          </div>
          <p class="note">
            {{ t('details.pngDob') }}
          </p>
        </div>

        <div class="fsec">
          <h3>{{ t('details.fees') }}</h3>
          <div class="field">
            <label>{{ t('details.pngChoice') }}</label>
            <div class="radio">
              <button
                type="button"
                class="opt"
                :class="{ on: flow.pngCollected }"
                @click="flow.pngCollected = true"
              >
                {{ t('details.pngCollect') }}
              </button>
              <button
                type="button"
                class="opt"
                :class="{ on: !flow.pngCollected }"
                @click="flow.pngCollected = false"
              >
                {{ t('details.pngAirport') }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>{{ t('details.tctChoice') }}</label>
            <div class="radio">
              <button
                type="button"
                class="opt"
                :class="{ on: flow.tctCollected }"
                @click="flow.tctCollected = true"
              >
                {{ t('details.tctCollect') }}
              </button>
              <button
                type="button"
                class="opt"
                :class="{ on: !flow.tctCollected }"
                @click="flow.tctCollected = false"
              >
                {{ t('details.tctLater') }}
              </button>
            </div>
          </div>
          <p class="note">
            {{ t('details.depositWording', { hours: extrasHours }) }}
          </p>
        </div>

        <div class="fsec">
          <h3>{{ t('details.declarations') }}</h3>
          <UCheckbox
            v-for="item in declarationItems"
            :key="item.document"
            :model-value="flow.declarations.includes(item.document)"
            :ui="checkUi"
            @update:model-value="toggleDeclaration(item.document, $event === true)"
          >
            <template #label>
              {{ item.label }}
              <span class="ver">{{ item.version }}</span>
              <template v-if="!item.required">
                — {{ t('details.declLater') }}
              </template>
            </template>
          </UCheckbox>
        </div>

        <div class="paths">
          <div
            class="path"
            :class="{ on: flow.path === 'PAY_LATER' }"
            @click="selectPath('PAY_LATER')"
          >
            <div class="ph">
              {{ t('details.opt1') }}
            </div>
            <h4>{{ t('details.opt1Title') }}</h4>
            <div class="pd">
              {{ t('details.opt1Body') }}
            </div>
            <div class="pay">
              {{ t('details.payToday') }} · {{ format(0) }}
            </div>
            <button
              type="button"
              class="btn o"
              :disabled="checkout.submitting"
              @click.stop="submit('PAY_LATER')"
            >
              {{ t('details.sendRequest') }}
            </button>
          </div>
          <div
            class="path"
            :class="{ on: flow.path === 'PAY_DEPOSIT' }"
            @click="selectPath('PAY_DEPOSIT')"
          >
            <div class="ph">
              {{ t('details.opt2') }}
            </div>
            <span class="perk">{{ settings.copy.online_deposit_advantage }} · {{ settings.copy.online_deposit_perk }}</span>
            <h4>{{ t('details.opt2Title') }}</h4>
            <div class="pd">
              {{ t('details.opt2Body') }}
            </div>
            <div class="pay">
              {{ t('details.payToday') }} · {{ format(flow.serverQuote?.deposit ?? estimate.deposit) }}
            </div>
            <button
              type="button"
              class="btn cta"
              :disabled="checkout.submitting"
              @click.stop="submit('PAY_DEPOSIT')"
            >
              <span class="lb">{{ t('details.payDeposit') }}</span>
              <span class="ico">→</span>
            </button>
          </div>
        </div>
        <div
          v-if="formError || checkout.priceChanged"
          class="cabwarn"
        >
          ⚠ {{ formError }}
          <button
            v-if="checkout.priceChanged"
            type="button"
            class="btn o"
            @click="acceptPrice"
          >
            {{ t('details.useNewPrice') }}
          </button>
        </div>
        <button
          type="button"
          class="btn o"
          @click="back"
        >
          {{ t('details.back') }}
        </button>
      </div>
      <PricePanel
        :quote="flow.serverQuote"
        :estimate="estimate"
        :settings="settings"
        :path="flow.path"
        :title="t('details.summary')"
      >
        <DetailsPromoBox
          v-model="promoInput"
          :state="flow.promo"
          @apply="applyPromo"
        />
        <div class="payzero">
          <div class="r">
            <span>{{ t('details.payToday') }}</span>
            <span>{{ payToday }}</span>
          </div>
          <p>
            {{ flow.path === 'PAY_LATER' ? settings.copy.pay_today : t('details.payOnlineNote') }}
          </p>
        </div>
      </PricePanel>
    </div>
  </div>
</template>
