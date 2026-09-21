import { WEST_ROUTE_MAP, type RouteMapData } from '../data/routeMaps/west'

const MAPS: Record<string, RouteMapData> = {
  WEST: WEST_ROUTE_MAP
}

export function routeMapFor(code: string): RouteMapData | null {
  return MAPS[code] ?? null
}
