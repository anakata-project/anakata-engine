import type { EngineSettings } from '../types/api'

export const FLOW_STORAGE_KEY = 'anakata-engine-flow'

export type BookingFlow = {
  adults: number
  children: number
  fromMonth: string
  toMonth: string
  itineraryCode: string | null
  departureId: number | null
  checkoutToken: string | null
  checkoutExpiresAt: string | null
}

export function emptyFlow(): BookingFlow {
  return {
    adults: 2,
    children: 0,
    fromMonth: '',
    toMonth: '',
    itineraryCode: null,
    departureId: null,
    checkoutToken: null,
    checkoutExpiresAt: null
  }
}

function readStored(): BookingFlow | null {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = sessionStorage.getItem(FLOW_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<BookingFlow>

    return {
      ...emptyFlow(),
      ...parsed
    }
  } catch {
    return null
  }
}

function writeStored(flow: BookingFlow): void {
  if (!import.meta.client) {
    return
  }

  try {
    sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flow))
  } catch {
    // private mode / quota
  }
}

export function applySettingsDefaults(flow: BookingFlow, settings: EngineSettings): BookingFlow {
  return {
    ...flow,
    adults: flow.fromMonth ? flow.adults : settings.calendar.default_adults,
    fromMonth: flow.fromMonth || settings.calendar.default_search_from,
    toMonth: flow.toMonth || settings.calendar.default_search_to
  }
}

export function useBookingFlow() {
  const flow = useState<BookingFlow>('engine-booking-flow', () => emptyFlow())

  onMounted(() => {
    const stored = readStored()

    if (stored?.fromMonth) {
      flow.value = stored
    }
  })

  watch(flow, (next) => {
    writeStored(next)
  }, { deep: true })

  function hydrateFromSettings(settings: EngineSettings): void {
    flow.value = applySettingsDefaults(flow.value, settings)
  }

  const party = computed(() => flow.value.adults + flow.value.children)

  return {
    flow,
    party,
    hydrateFromSettings
  }
}
