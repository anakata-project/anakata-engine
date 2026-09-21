export const RATE_LIMIT_COPY = 'Please try again in a moment'
export const NETWORK_FAILURE_COPY = 'We could not reach the reservation system. Check your connection and try again.'

type ErrorShape = {
  status?: number
  statusCode?: number
  message?: string
  data?: {
    message?: string
    errors?: Record<string, Array<string>>
  }
  errors?: Record<string, Array<string>>
}

function asShape(error: unknown): ErrorShape {
  if (typeof error === 'object' && error !== null) {
    return error as ErrorShape
  }

  return {}
}

export function engineErrorStatus(error: unknown): number | undefined {
  const body = asShape(error)

  if (typeof body.status === 'number') {
    return body.status
  }

  if (typeof body.statusCode === 'number') {
    return body.statusCode
  }

  return undefined
}

export function engineErrorMessage(error: unknown): string {
  const status = engineErrorStatus(error)

  if (status === 429) {
    return RATE_LIMIT_COPY
  }

  if (status === undefined) {
    return NETWORK_FAILURE_COPY
  }

  const body = asShape(error)

  return body.data?.message ?? body.message ?? NETWORK_FAILURE_COPY
}

export function fieldErrors(error: unknown): Record<string, string> {
  const body = asShape(error)
  const bag = body.errors ?? body.data?.errors ?? {}
  const out: Record<string, string> = {}

  for (const [key, messages] of Object.entries(bag)) {
    const first = messages[0]

    if (first) {
      out[key] = first
    }
  }

  return out
}
