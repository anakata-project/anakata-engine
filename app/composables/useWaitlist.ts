import type { EngineDeparture } from '../types/api'

const WAITLIST_KEY = 'engine-waitlist-departure'

export function useWaitlist() {
  const departure = useState<EngineDeparture | null>(WAITLIST_KEY, () => null)

  function open(next: EngineDeparture): void {
    departure.value = next
  }

  function close(): void {
    departure.value = null
  }

  return {
    departure,
    open,
    close
  }
}
