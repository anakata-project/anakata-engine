import birds from '../assets/images/birds.png'
import turtle from '../assets/images/turtule.png'

/**
 * Feed cards publish `hero_image: null`. These photographs stand in
 * until the RMS sends a real image. WEST is the western route
 * (flightless cormorants). NORTH takes the other photograph.
 */
const PHOTOS: Record<string, string> = {
  WEST: birds,
  NORTH: turtle
}

export function itineraryPhoto(code: string): string | null {
  return PHOTOS[code] ?? null
}
