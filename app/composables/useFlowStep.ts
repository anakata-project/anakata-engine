export type FlowStep = 1 | 2 | 3 | 4 | 5 | 6

export function useFlowStep() {
  const route = useRoute()

  const step = computed<FlowStep | null>(() => {
    const path = route.path

    if (path === '/') {
      return 1
    }

    if (path === '/itineraries') {
      return 2
    }

    if (path.startsWith('/itineraries/')) {
      return 3
    }

    if (path === '/book/cabins') {
      return 4
    }

    if (path === '/book/details') {
      return 5
    }

    if (path === '/book/confirmation') {
      return 6
    }

    return null
  })

  const showHero = computed(() => step.value === 1)
  const showCrumbs = computed(() => step.value !== null && step.value >= 2)
  const expeditionsOn = computed(() => step.value !== null)

  return {
    step,
    showHero,
    showCrumbs,
    expeditionsOn
  }
}
