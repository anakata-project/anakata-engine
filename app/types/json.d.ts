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
