import type { OverheadItem } from '../types'

export const DEFAULT_OVERHEAD_ITEMS: OverheadItem[] = [
  { key: 'mobilization', label: 'Mobilization / Demob', enabled: true,  rate: 3 },
  { key: 'equipment',    label: 'Equipment',             enabled: false, rate: 5 },
  { key: 'insurance',    label: 'Insurance',             enabled: true,  rate: 2 },
  { key: 'travel',       label: 'Travel',                enabled: false, rate: 1 },
  { key: 'permits',      label: 'Permits',               enabled: false, rate: 2 },
]

export const PROJECT_TYPES = [
  {
    value: 'residential_remodel',
    label: 'Residential Remodel',
    description: 'Kitchen, bath, whole-home',
    icon: '🏠',
    defaultCategories: ['Demo', 'Framing', 'Electrical', 'Plumbing', 'Finishing'],
  },
  {
    value: 'basement_finish',
    label: 'Basement Finish',
    description: 'Full or partial finish-out',
    icon: '🏗',
    defaultCategories: ['Demo', 'Framing', 'Electrical', 'Plumbing', 'Finishing'],
  },
  {
    value: 'site_work',
    label: 'Site Work',
    description: 'Grading, drainage, utilities',
    icon: '🚛',
    defaultCategories: ['Demo', 'Excavation', 'Utilities', 'Finishing'],
  },
  {
    value: 'commercial',
    label: 'Commercial Job',
    description: 'TI, retail, office buildout',
    icon: '🏢',
    defaultCategories: ['Demo', 'Framing', 'Electrical', 'Plumbing', 'Finishing'],
  },
  {
    value: 'handyman',
    label: 'Handyman Job',
    description: 'Punch list, small repairs',
    icon: '🔧',
    defaultCategories: ['Labor', 'Materials'],
  },
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  Demo:       '#ef4444',
  Framing:    '#f97316',
  Electrical: '#eab308',
  Plumbing:   '#3b82f6',
  Finishing:  '#22c55e',
  Excavation: '#a855f7',
  Utilities:  '#06b6d4',
  Labor:      '#f97316',
  Materials:  '#8b5cf6',
}

export const UNIT_OPTIONS = ['LS', 'EA', 'SF', 'LF', 'HR', 'SY', 'CY', 'TN']

// Default price sheet — seeded for new users
export const DEFAULT_PRICE_SHEET = [
  // Demo
  { category: 'Demo', description: 'Interior demolition',        unit: 'LS', matPerUnit: 200,  hours: 16, ratePerHr: 45, defaultQty: 1   },
  { category: 'Demo', description: 'Exterior demolition',        unit: 'LS', matPerUnit: 350,  hours: 24, ratePerHr: 50, defaultQty: 1   },
  { category: 'Demo', description: 'Haul-off & disposal',        unit: 'LS', matPerUnit: 400,  hours: 4,  ratePerHr: 45, defaultQty: 1   },
  { category: 'Demo', description: 'Dumpster rental',            unit: 'EA', matPerUnit: 450,  hours: 0,  ratePerHr: 0,  defaultQty: 1   },
  { category: 'Demo', description: 'Concrete removal',           unit: 'SF', matPerUnit: 0.5,  hours: 8,  ratePerHr: 50, defaultQty: 100 },
  { category: 'Demo', description: 'Tile removal',               unit: 'SF', matPerUnit: 0,    hours: 6,  ratePerHr: 42, defaultQty: 100 },
  { category: 'Demo', description: 'Cabinet removal',            unit: 'EA', matPerUnit: 0,    hours: 3,  ratePerHr: 42, defaultQty: 1   },
  { category: 'Demo', description: 'Flooring removal',           unit: 'SF', matPerUnit: 0,    hours: 8,  ratePerHr: 40, defaultQty: 200 },
  { category: 'Demo', description: 'Wall removal — non-bearing', unit: 'LF', matPerUnit: 0,    hours: 4,  ratePerHr: 48, defaultQty: 12  },
  { category: 'Demo', description: 'Debris cleanup',             unit: 'LS', matPerUnit: 50,   hours: 4,  ratePerHr: 38, defaultQty: 1   },
  // Framing
  { category: 'Framing', description: 'Wall framing — studs & plates', unit: 'LF', matPerUnit: 3.5, hours: 24, ratePerHr: 50, defaultQty: 120 },
  { category: 'Framing', description: 'Header & beam install',          unit: 'EA', matPerUnit: 180, hours: 8,  ratePerHr: 50, defaultQty: 2   },
  { category: 'Framing', description: 'Stud walls',                     unit: 'LF', matPerUnit: 3.2, hours: 20, ratePerHr: 48, defaultQty: 180 },
  { category: 'Framing', description: 'Soffit framing',                 unit: 'LF', matPerUnit: 2.8, hours: 8,  ratePerHr: 48, defaultQty: 60  },
  { category: 'Framing', description: 'Subfloor install',               unit: 'SF', matPerUnit: 2.8, hours: 12, ratePerHr: 48, defaultQty: 200 },
  // Electrical
  { category: 'Electrical', description: 'Rough-in wiring',        unit: 'LS', matPerUnit: 800,  hours: 16, ratePerHr: 75, defaultQty: 1  },
  { category: 'Electrical', description: 'Panel upgrade',           unit: 'EA', matPerUnit: 1200, hours: 8,  ratePerHr: 80, defaultQty: 1  },
  { category: 'Electrical', description: 'Outlet / switch install', unit: 'EA', matPerUnit: 25,   hours: 1,  ratePerHr: 70, defaultQty: 10 },
  { category: 'Electrical', description: 'Can light install',       unit: 'EA', matPerUnit: 45,   hours: 1,  ratePerHr: 70, defaultQty: 8  },
  // Plumbing
  { category: 'Plumbing', description: 'Rough-in plumbing',       unit: 'LS', matPerUnit: 600, hours: 16, ratePerHr: 80, defaultQty: 1 },
  { category: 'Plumbing', description: 'Fixture install',          unit: 'EA', matPerUnit: 150, hours: 3,  ratePerHr: 75, defaultQty: 3 },
  { category: 'Plumbing', description: 'Water heater replace',     unit: 'EA', matPerUnit: 900, hours: 4,  ratePerHr: 80, defaultQty: 1 },
  // Finishing
  { category: 'Finishing', description: 'Drywall hang & finish', unit: 'SF', matPerUnit: 1.2, hours: 12, ratePerHr: 45, defaultQty: 500 },
  { category: 'Finishing', description: 'Paint — walls',         unit: 'SF', matPerUnit: 0.4, hours: 8,  ratePerHr: 40, defaultQty: 500 },
  { category: 'Finishing', description: 'Flooring install',      unit: 'SF', matPerUnit: 4.5, hours: 10, ratePerHr: 45, defaultQty: 300 },
  { category: 'Finishing', description: 'Trim & baseboards',     unit: 'LF', matPerUnit: 2.5, hours: 6,  ratePerHr: 42, defaultQty: 120 },
  { category: 'Finishing', description: 'Cabinet install',       unit: 'EA', matPerUnit: 200, hours: 4,  ratePerHr: 48, defaultQty: 10  },
  { category: 'Finishing', description: 'Door install',          unit: 'EA', matPerUnit: 180, hours: 2,  ratePerHr: 45, defaultQty: 5   },
]
