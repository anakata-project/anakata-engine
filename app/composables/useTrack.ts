export type TrackParams = Record<string, string | number | boolean | undefined>

export function track(_event: string, _params?: TrackParams): void {
  // Task 10 wires this to GA4 behind consent.
}
