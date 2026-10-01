declare module '*.svg?raw' {
  const content: string
  export default content
}

declare module '*.json' {
  const value: {
    type: string
    properties?: Record<string, unknown>
    geometry?: {
      type: string
      coordinates: unknown
    }
  }
  export default value
}
