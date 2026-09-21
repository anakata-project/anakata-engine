import geo from './west.geo.json'

export type RouteDay = {
  d: string
  wd: string
  title: string
  am: string | null
  pm: string | null
  acts: Array<string>
  wild: Array<string>
  desc: string
  lon: number
  lat: number
}

export type RouteWaypoint = [number, number, number?]

export type RouteMapData = {
  title: string
  sub: Array<string>
  days: Array<RouteDay>
  waypoints: Array<RouteWaypoint>
  names: Array<[string, number, number]>
  geo: typeof geo
}

// TODO(OPEN: Engine route maps) Western map still reads San Cristóbal → Baltra
// with days starting Monday; the engine sells SCY → SCY, Sunday → Sunday.
export const WEST_ROUTE_MAP: RouteMapData = {
  title: 'The Western Route',
  sub: [
    'San Cristóbal → Baltra',
    '7 nights / 8 days',
    'Isabela · Fernandina · Santa Cruz'
  ],
  days: [
    {
      d: '01',
      wd: 'Monday',
      title: 'Embark — Isla Lobos',
      am: null,
      pm: 'Isla Lobos · San Cristóbal',
      acts: ['Hike', 'Panga ride', 'Snorkel'],
      wild: ['Sea lions', 'Blue-footed boobies'],
      desc: 'Welcome aboard. Isla Lobos, minutes from Puerto Baquerizo Moreno, is known for its sea lion colonies and calm waters — the perfect first encounter with the wildlife of the archipelago.',
      lon: -89.575,
      lat: -0.84
    },
    {
      d: '02',
      wd: 'Tuesday',
      title: 'South Plaza & Santa Fe',
      am: 'South Plaza',
      pm: 'Santa Fe anchorage',
      acts: ['Hike', 'Kayak', 'Panga ride', 'Paddleboard', 'Snorkel'],
      wild: ['Land iguanas', 'Swallow-tailed gulls'],
      desc: 'South Plaza stands out for its sea cliffs, opuntia cactus forest and endemic land iguanas. Santa Fe offers a sheltered anchorage, ideal for an afternoon on the water.',
      lon: -90.15,
      lat: -0.58
    },
    {
      d: '03',
      wd: 'Wednesday',
      title: 'Sombrero Chino & Santa Cruz',
      am: 'Sombrero Chino',
      pm: 'Guy Fawkes · Cerro Dragón',
      acts: ['Hike', 'Panga ride', 'Snorkel'],
      wild: ['Galápagos penguins', 'Land iguanas'],
      desc: 'Sombrero Chino is a miniature volcanic cone with white coral beaches. In the afternoon, snorkelling at Guy Fawkes and a walk at Cerro Dragón, home of land iguanas.',
      lon: -90.575,
      lat: -0.385
    },
    {
      d: '04',
      wd: 'Thursday',
      title: 'Charles Darwin Station & El Chato',
      am: 'Darwin Research Station',
      pm: 'El Chato Reserve · highlands',
      acts: ['Hike'],
      wild: ['Giant tortoises', 'Darwin’s finches'],
      desc: 'A visit to the Fausto Llerena breeding centre and the Charles Darwin Research Station. In the afternoon, meet giant tortoises in the wild at the El Chato Reserve.',
      lon: -90.31,
      lat: -0.775
    },
    {
      d: '05',
      wd: 'Friday',
      title: 'Isabela — Tintoreras & Sierra Negra',
      am: 'Tintoreras · Sierra Negra volcano',
      pm: 'Wetlands · tortoise centre',
      acts: ['Hike', 'Panga ride'],
      wild: ['White-tip reef sharks', 'Flamingos'],
      desc: 'The Tintoreras channel, a refuge for white-tip reef sharks, and a hike to the world’s second-largest crater at Sierra Negra. The afternoon is devoted to Isabela’s wetlands and tortoise breeding centre.',
      lon: -90.96,
      lat: -0.985
    },
    {
      d: '06',
      wd: 'Saturday',
      title: 'Punta Moreno & Elizabeth Bay',
      am: 'Punta Moreno',
      pm: 'Elizabeth Bay',
      acts: ['Hike', 'Kayak', 'Panga ride', 'Paddleboard', 'Snorkel'],
      wild: ['Rays', 'Sea turtles', 'Penguins'],
      desc: 'Young lava fields at Punta Moreno. In the afternoon, a panga and kayak ride through the mangroves of Elizabeth Bay in search of rays, sea turtles and penguins.',
      lon: -91.38,
      lat: -0.70
    },
    {
      d: '07',
      wd: 'Sunday',
      title: 'Tagus Cove & Punta Espinosa',
      am: 'Tagus Cove · Isabela',
      pm: 'Punta Espinosa · Fernandina',
      acts: ['Hike', 'Kayak', 'Panga ride', 'Snorkel', 'Paddleboard'],
      wild: ['Flightless cormorant', 'Marine iguanas'],
      desc: 'Tagus Cove, with its buccaneer and whaler history. In the afternoon, Fernandina — the most pristine island in the archipelago — and its iconic flightless cormorant.',
      lon: -91.395,
      lat: -0.275
    },
    {
      d: '08',
      wd: 'Monday',
      title: 'Las Bachas — Disembark Baltra',
      am: 'Las Bachas beach · Santa Cruz',
      pm: null,
      acts: ['Hike', 'Snorkel'],
      wild: ['Flamingos'],
      desc: 'A last morning aboard: white sand and a brackish lagoon with flamingos at Las Bachas, before the transfer and disembarkation in Baltra.',
      lon: -90.328,
      lat: -0.457
    }
  ],
  waypoints: [
    [-89.66, -0.81], [-89.575, -0.84, 0], [-89.80, -0.65], [-89.95, -0.50], [-90.15, -0.58, 1], [-90.061, -0.808],
    [-90.06, -0.62], [-90.15, -0.38], [-90.40, -0.27], [-90.575, -0.385, 2], [-90.62, -0.52],
    [-90.62, -0.70], [-90.50, -0.82], [-90.31, -0.775, 3], [-90.55, -0.96], [-90.85, -1.03], [-90.96, -0.985, 4],
    [-91.20, -1.08], [-91.55, -1.03], [-91.63, -0.85], [-91.38, -0.70, 5], [-91.20, -0.60],
    [-91.30, -0.52], [-91.33, -0.44], [-91.34, -0.36], [-91.395, -0.275, 6], [-91.46, -0.15], [-91.55, -0.12],
    [-91.68, 0.00], [-91.55, 0.15], [-91.30, 0.22], [-90.95, 0.08], [-90.70, -0.05], [-90.45, -0.30], [-90.328, -0.457, 7], [-90.28, -0.43]
  ],
  names: [
    ['Isabela', -91.12, -0.50],
    ['Fernandina', -91.55, -0.60],
    ['Santa Cruz', -90.36, -0.60],
    ['San Cristóbal', -89.35, -1.00],
    ['Santiago', -90.77, -0.20],
    ['Floreana', -90.43, -1.42],
    ['Española', -89.66, -1.50],
    ['Baltra', -90.15, -0.30],
    ['Santa Fe', -90.06, -0.93]
  ],
  geo
}
