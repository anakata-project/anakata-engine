<script setup lang="ts">
import type { EngineDeparture } from '../types/api'
import { charterGuestsOk, charterMessage } from '../utils/charterGuests'
import { engineErrorMessage, fieldErrors } from '../utils/engineError'
import { formatIsoDate, formatUsd } from '../utils/engineFlow'

const { t } = useI18n()
const { request } = useApi()
const { data: feed, error } = useEngineFeed()

useHead({ title: t('pages.charter') })

const name = ref('')
const email = ref('')
const phone = ref('')
const guests = ref(12)
const mode = ref<'dates' | 'departure'>('dates')
const preferredFrom = ref('')
const preferredTo = ref('')
const departureId = ref<number | null>(null)
const context = ref('')
const notes = ref('')
const submitting = ref(false)
const done = ref(false)
const formError = ref('')
const bad = reactive({
  name: false,
  email: false,
  guests: false,
  dates: false,
  departure: false,
  message: false
})

const settings = computed(() => feed.value?.settings ?? null)
const rates = computed(() => feed.value?.rates ?? null)
const capacity = computed(() => settings.value?.charter.capacity ?? 16)
const contexts = computed(() => settings.value?.charter.group_contexts ?? [])
const departures = computed<Array<EngineDeparture>>(() => feed.value?.departures ?? [])

const firstYear = computed(() => rates.value?.years[0] ?? null)
const weekRate = computed(() => {
  if (!rates.value || firstYear.value === null) {
    return 0
  }

  return rates.value.charter_week[String(firstYear.value)] ?? 0
})

watch(contexts, (list) => {
  if (!context.value && list[0]) {
    context.value = list[0]
  }
}, { immediate: true })

function resetBad(): void {
  bad.name = false
  bad.email = false
  bad.guests = false
  bad.dates = false
  bad.departure = false
  bad.message = false
}

function validate(): boolean {
  resetBad()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
  bad.name = name.value.trim() === ''
  bad.email = !emailOk
  bad.guests = !charterGuestsOk(guests.value, capacity.value)

  if (mode.value === 'dates') {
    bad.dates = !preferredFrom.value || !preferredTo.value || preferredTo.value < preferredFrom.value
  } else {
    bad.departure = departureId.value === null
  }

  bad.message = charterMessage(context.value, notes.value) === ''

  return !bad.name && !bad.email && !bad.guests && !bad.dates && !bad.departure && !bad.message
}

async function submit(): Promise<void> {
  if (!validate() || !settings.value) {
    formError.value = t('details.formError')

    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const body: Record<string, unknown> = {
      guests: guests.value,
      contact: {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim() || null
      },
      message: charterMessage(context.value, notes.value)
    }

    if (mode.value === 'departure' && departureId.value !== null) {
      body.departure_id = departureId.value
    } else {
      body.preferred_from = preferredFrom.value
      body.preferred_to = preferredTo.value
    }

    await request('/api/engine/charter-enquiries', {
      method: 'POST',
      body
    })

    track('charter_inquiry_submit', {
      num_passengers: guests.value,
      dates_range: mode.value === 'dates'
        ? `${preferredFrom.value}–${preferredTo.value}`
        : undefined,
      departure_id: mode.value === 'departure' && departureId.value !== null
        ? departureId.value
        : undefined
    })
    done.value = true
  } catch (caught) {
    const fields = fieldErrors(caught)
    bad.name = Boolean(fields['contact.name'] || fields['contact.first_name'])
    bad.email = Boolean(fields['contact.email'])
    bad.guests = Boolean(fields.guests)
    bad.dates = Boolean(fields.preferred_from || fields.preferred_to)
    bad.departure = Boolean(fields.departure_id)
    bad.message = Boolean(fields.message)
    formError.value = engineErrorMessage(caught)
  } finally {
    submitting.value = false
  }
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
    <template v-else-if="settings && rates">
      <span class="mono klabel">{{ t('charter.klabel', { n: capacity }) }}</span>
      <h1 class="disp">
        {{ settings.charter.headline }}
      </h1>
      <p class="sub">
        {{ settings.charter.intro }}
      </p>
      <div
        v-if="done"
        class="fsec"
      >
        <p>{{ settings.charter.thank_you }}</p>
      </div>
      <div
        v-else
        class="wgrid"
      >
        <div>
          <div class="cols2">
            <div
              class="field"
              :class="{ bad: bad.name }"
            >
              <label>{{ t('charter.name') }}</label>
              <input v-model="name">
              <div class="err">
                {{ t('details.required') }}
              </div>
            </div>
            <div
              class="field"
              :class="{ bad: bad.email }"
            >
              <label>{{ t('charter.email') }}</label>
              <input
                v-model="email"
                type="email"
              >
              <div class="err">
                {{ t('details.emailErr') }}
              </div>
            </div>
          </div>
          <div class="cols2">
            <div class="field">
              <label>{{ t('details.phone') }}</label>
              <input
                v-model="phone"
                :placeholder="t('details.phonePh')"
              >
            </div>
            <div
              class="field"
              :class="{ bad: bad.guests }"
            >
              <label>{{ t('charter.guests', { n: capacity }) }}</label>
              <input
                v-model.number="guests"
                type="number"
                min="1"
                :max="capacity"
              >
              <div class="err">
                {{ t('charter.guestsErr', { n: capacity }) }}
              </div>
            </div>
          </div>
          <div class="field">
            <label>{{ t('charter.when') }}</label>
            <div class="radio">
              <button
                type="button"
                class="opt"
                :class="{ on: mode === 'dates' }"
                @click="mode = 'dates'"
              >
                {{ t('charter.datesMode') }}
              </button>
              <button
                type="button"
                class="opt"
                :class="{ on: mode === 'departure' }"
                @click="mode = 'departure'"
              >
                {{ t('charter.departureMode') }}
              </button>
            </div>
          </div>
          <div
            v-if="mode === 'dates'"
            class="cols2"
          >
            <div
              class="field"
              :class="{ bad: bad.dates }"
            >
              <label>{{ t('charter.from') }}</label>
              <input
                v-model="preferredFrom"
                type="date"
              >
              <div class="err">
                {{ t('charter.datesErr') }}
              </div>
            </div>
            <div
              class="field"
              :class="{ bad: bad.dates }"
            >
              <label>{{ t('charter.to') }}</label>
              <input
                v-model="preferredTo"
                type="date"
              >
            </div>
          </div>
          <div
            v-else
            class="field"
            :class="{ bad: bad.departure }"
          >
            <label>{{ t('charter.departure') }}</label>
            <select v-model="departureId">
              <option :value="null">
                {{ t('charter.chooseDeparture') }}
              </option>
              <option
                v-for="dep in departures"
                :key="dep.id"
                :value="dep.id"
              >
                {{ formatIsoDate(dep.embark) }} · {{ dep.yacht }} · {{ dep.itinerary }}
              </option>
            </select>
            <div class="err">
              {{ t('details.required') }}
            </div>
          </div>
          <div class="field">
            <label>{{ t('charter.context') }}</label>
            <select v-model="context">
              <option
                v-for="item in contexts"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </div>
          <div
            class="field"
            :class="{ bad: bad.message }"
          >
            <label>{{ t('charter.notes') }}</label>
            <textarea
              v-model="notes"
              rows="4"
            />
            <div class="err">
              {{ t('details.required') }}
            </div>
          </div>
          <button
            type="button"
            class="btn"
            :disabled="submitting"
            @click="submit"
          >
            {{ t('charter.submit') }}
          </button>
          <p class="note">
            {{ t('charter.slaNote', { hours: settings.charter.response_sla_hours }) }}
          </p>
          <div
            v-if="formError"
            class="cabwarn"
          >
            ⚠ {{ formError }}
          </div>
        </div>
        <div class="side">
          <h4>{{ t('charter.glance') }}</h4>
          <div class="line">
            <span>{{ t('charter.rateYear', { year: firstYear }) }}</span>
            <span>{{ formatUsd(weekRate) }} / {{ t('charter.week') }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.capacity') }}</span>
            <span>{{ t('charter.upTo', { n: capacity }) }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.itinerary') }}</span>
            <span>{{ settings.charter.itinerary_label }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.deposit') }}</span>
            <span>{{ rates.terms.charter_deposit_pct }}% · {{ t('charter.bizDays', { n: rates.terms.charter_deposit_business_days }) }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.balance') }}</span>
            <span>{{ t('charter.balanceValue', { pct: 100 - rates.terms.charter_deposit_pct, days: rates.terms.charter_balance_days }) }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.festive') }}</span>
            <span>+{{ formatUsd(rates.rules.festive_supplement_charter) }}</span>
          </div>
          <div class="line">
            <span>{{ t('charter.sla') }}</span>
            <span>{{ t('charter.withinHours', { n: settings.charter.response_sla_hours }) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
