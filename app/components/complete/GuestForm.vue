<script setup lang="ts">
import type { CompleteGuest, EngineCountry } from '../../types/api'
import { isMinorToday, passportFieldState } from '../../utils/completeState'

const props = defineProps<{
  guest: CompleteGuest
  countries: Array<EngineCountry>
  errors: Record<string, string>
  saving: boolean
}>()

const emit = defineEmits<{
  save: [body: Record<string, unknown>]
}>()

const { t } = useI18n()

const firstName = ref(props.guest.first_name)
const lastName = ref(props.guest.last_name)
const dob = ref(props.guest.dob ?? '')
const nationality = ref(props.guest.nationality ?? '')
const ecuadorResident = ref(props.guest.ecuador_resident)
const passportNo = ref('')
const passportExpiry = ref(props.guest.passport_expiry ?? '')
const email = ref(props.guest.email ?? '')
const insurance = ref(props.guest.insurance_declared)
const guardianName = ref(props.guest.guardian?.name ?? '')
const guardianRelationship = ref(props.guest.guardian?.relationship ?? '')
const guardianConsented = ref(props.guest.guardian?.consented ?? false)

const passport = computed(() => passportFieldState(props.guest.passport_on_file))
const showGuardian = computed(() => props.guest.is_minor_now || isMinorToday(dob.value || null))
const guestHeading = computed(() => {
  const name = `${props.guest.first_name} ${props.guest.last_name}`.trim()

  return name || t('complete.guestN', { n: props.guest.id })
})

watch(() => props.guest, (next) => {
  firstName.value = next.first_name
  lastName.value = next.last_name
  dob.value = next.dob ?? ''
  nationality.value = next.nationality ?? ''
  ecuadorResident.value = next.ecuador_resident
  passportNo.value = ''
  passportExpiry.value = next.passport_expiry ?? ''
  email.value = next.email ?? ''
  insurance.value = next.insurance_declared
  guardianName.value = next.guardian?.name ?? ''
  guardianRelationship.value = next.guardian?.relationship ?? ''
  guardianConsented.value = next.guardian?.consented ?? false
})

function save(): void {
  const body: Record<string, unknown> = {
    first_name: firstName.value.trim() || null,
    last_name: lastName.value.trim() || null,
    dob: dob.value || null,
    nationality: nationality.value || null,
    ecuador_resident: ecuadorResident.value,
    passport_expiry: passportExpiry.value || null,
    email: email.value.trim() || null,
    insurance_declared: insurance.value
  }

  if (passportNo.value.trim()) {
    body.passport_no = passportNo.value.trim()
  }

  if (showGuardian.value) {
    body.guardian_name = guardianName.value.trim() || null
    body.guardian_relationship = guardianRelationship.value.trim() || null
    body.guardian_consented = guardianConsented.value
  }

  emit('save', body)
}
</script>

<template>
  <div class="fsec">
    <h3>{{ guestHeading }}</h3>
    <div class="cols2">
      <div
        class="field"
        :class="{ bad: Boolean(errors.first_name) }"
      >
        <label>{{ t('complete.first') }}</label>
        <input v-model="firstName">
        <div class="err">
          {{ errors.first_name }}
        </div>
      </div>
      <div
        class="field"
        :class="{ bad: Boolean(errors.last_name) }"
      >
        <label>{{ t('complete.last') }}</label>
        <input v-model="lastName">
        <div class="err">
          {{ errors.last_name }}
        </div>
      </div>
    </div>
    <div class="cols2">
      <div
        class="field"
        :class="{ bad: Boolean(errors.dob) }"
      >
        <label>{{ t('complete.dob') }}</label>
        <input
          v-model="dob"
          type="date"
        >
        <div class="err">
          {{ errors.dob }}
        </div>
      </div>
      <div
        class="field"
        :class="{ bad: Boolean(errors.nationality) }"
      >
        <label>{{ t('details.chooseCountry') }}</label>
        <select v-model="nationality">
          <option value="">
            {{ t('details.chooseCountry') }}
          </option>
          <option
            v-for="country in countries"
            :key="country.code"
            :value="country.code"
          >
            {{ country.name }}
          </option>
        </select>
        <div class="err">
          {{ errors.nationality }}
        </div>
      </div>
    </div>
    <label class="chkrow">
      <input
        v-model="ecuadorResident"
        type="checkbox"
      >
      <span>{{ t('details.ecuador') }}</span>
    </label>
    <div class="cols2">
      <div
        class="field"
        :class="{ bad: Boolean(errors.passport_no) }"
      >
        <label>{{ passport.onFile ? t('complete.passportOnFile') : t('complete.passport') }}</label>
        <input
          v-model="passportNo"
          autocomplete="off"
          :placeholder="passport.onFile ? t('complete.passportReplace') : ''"
        >
        <div class="err">
          {{ errors.passport_no }}
        </div>
      </div>
      <div
        class="field"
        :class="{ bad: Boolean(errors.passport_expiry) }"
      >
        <label>{{ t('complete.passportExpiry') }}</label>
        <input
          v-model="passportExpiry"
          type="date"
        >
        <div class="err">
          {{ errors.passport_expiry }}
        </div>
      </div>
    </div>
    <div
      class="field"
      :class="{ bad: Boolean(errors.email) }"
    >
      <label>{{ t('complete.guestEmail') }}</label>
      <input
        v-model="email"
        type="email"
      >
      <div class="err">
        {{ errors.email }}
      </div>
    </div>
    <label class="chkrow">
      <input
        v-model="insurance"
        type="checkbox"
      >
      <span>{{ t('complete.insurance') }}</span>
    </label>
    <div
      v-if="showGuardian"
      class="guardian"
    >
      <div class="mono klabel">
        {{ t('complete.guardian') }}
      </div>
      <div class="cols2">
        <div
          class="field"
          :class="{ bad: Boolean(errors.guardian_name) }"
        >
          <label>{{ t('complete.guardianName') }}</label>
          <input v-model="guardianName">
          <div class="err">
            {{ errors.guardian_name }}
          </div>
        </div>
        <div
          class="field"
          :class="{ bad: Boolean(errors.guardian_relationship) }"
        >
          <label>{{ t('complete.guardianRel') }}</label>
          <input v-model="guardianRelationship">
          <div class="err">
            {{ errors.guardian_relationship }}
          </div>
        </div>
      </div>
      <label class="chkrow">
        <input
          v-model="guardianConsented"
          type="checkbox"
        >
        <span>{{ t('complete.guardianConsent') }}</span>
      </label>
    </div>
    <button
      type="button"
      class="btn"
      :disabled="saving"
      @click="save"
    >
      {{ t('complete.saveGuest') }}
    </button>
  </div>
</template>
