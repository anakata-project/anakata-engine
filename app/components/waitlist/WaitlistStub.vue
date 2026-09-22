<script setup lang="ts">
import { engineErrorMessage, fieldErrors } from '../../utils/engineError'
import { formatIsoDate } from '../../utils/engineFlow'
import { submitSessionId } from '../../utils/engineSession'

const { t } = useI18n()
const { request } = useApi()
const { departure, close } = useWaitlist()
const { flow } = useBookingFlow()

const name = ref('')
const email = ref('')
const category = ref<'SUITE' | 'OWNER'>('SUITE')
const adults = ref(2)
const children = ref(0)
const notes = ref('')
const submitting = ref(false)
const done = ref(false)
const formError = ref('')
const bad = reactive({
  name: false,
  email: false
})

watch(departure, (next) => {
  if (!next) {
    return
  }

  done.value = false
  formError.value = ''
  adults.value = flow.value.adults
  children.value = flow.value.children
  name.value = [flow.value.firstName, flow.value.lastName].filter(Boolean).join(' ')
  email.value = flow.value.email
})

function validate(): boolean {
  bad.name = name.value.trim() === ''
  bad.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())

  return !bad.name && !bad.email
}

async function submit(): Promise<void> {
  if (!departure.value || !validate()) {
    formError.value = t('details.formError')

    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const sessionId = submitSessionId()

    await request('/api/engine/waitlist', {
      method: 'POST',
      body: {
        departure_id: departure.value.id,
        cabin_category: category.value,
        contact: {
          name: name.value.trim(),
          email: email.value.trim()
        },
        adults: adults.value,
        children: children.value,
        notes: notes.value.trim() || null,
        ...(sessionId ? { session_id: sessionId } : {})
      }
    })
    done.value = true
  } catch (caught) {
    const fields = fieldErrors(caught)
    bad.name = Boolean(fields['contact.name'])
    bad.email = Boolean(fields['contact.email'])
    formError.value = engineErrorMessage(caught)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    v-if="departure"
    class="waitlist-mask"
    @click.self="close"
  >
    <div class="waitlist-stub waitlist-form">
      <h2 class="disp">
        {{ t('waitlist.title') }}
      </h2>
      <template v-if="done">
        <p>{{ t('waitlist.thanks') }}</p>
        <button
          type="button"
          class="btn o"
          @click="close"
        >
          {{ t('waitlist.close') }}
        </button>
      </template>
      <template v-else>
        <p>{{ t('waitlist.lead') }}</p>
        <div class="field">
          <label>{{ t('waitlist.departure') }}</label>
          <input
            :value="`${formatIsoDate(departure.embark)} · ${departure.yacht}`"
            disabled
          >
        </div>
        <div class="field">
          <label>{{ t('waitlist.category') }}</label>
          <select v-model="category">
            <option value="SUITE">
              {{ t('waitlist.suite') }}
            </option>
            <option value="OWNER">
              {{ t('waitlist.owner') }}
            </option>
          </select>
        </div>
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
        <div class="cols2">
          <div class="field">
            <label>{{ t('search.adults') }}</label>
            <input
              v-model.number="adults"
              type="number"
              min="1"
            >
          </div>
          <div class="field">
            <label>{{ t('search.children') }}</label>
            <input
              v-model.number="children"
              type="number"
              min="0"
            >
          </div>
        </div>
        <div class="field">
          <label>{{ t('waitlist.notes') }}</label>
          <textarea
            v-model="notes"
            rows="3"
          />
        </div>
        <div
          v-if="formError"
          class="cabwarn"
        >
          ⚠ {{ formError }}
        </div>
        <div class="dt-actions">
          <button
            type="button"
            class="btn o"
            @click="close"
          >
            {{ t('waitlist.close') }}
          </button>
          <button
            type="button"
            class="btn"
            :disabled="submitting"
            @click="submit"
          >
            {{ t('waitlist.submit') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
