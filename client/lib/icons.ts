export interface IconDef {
  key: string
  fa: string
  label: string
}

export const ICONS: IconDef[] = [
  { key: 'grid', fa: 'fa-table-columns', label: 'Grid' },
  { key: 'globe', fa: 'fa-globe', label: 'Globe' },
  { key: 'camera', fa: 'fa-camera', label: 'Camera' },
  { key: 'users', fa: 'fa-users', label: 'Users' },
  { key: 'wallet', fa: 'fa-wallet', label: 'Wallet' },
  { key: 'calendar', fa: 'fa-calendar-days', label: 'Calendar' },
  { key: 'shirt', fa: 'fa-shirt', label: 'Shirt' },
  { key: 'activity', fa: 'fa-arrow-trend-up', label: 'Activity' },
  { key: 'nfc', fa: 'fa-wifi', label: 'NFC' },
  { key: 'star', fa: 'fa-star', label: 'Star' },
  { key: 'trophy', fa: 'fa-trophy', label: 'Trophy' },
  { key: 'award', fa: 'fa-award', label: 'Award' },
  { key: 'bolt', fa: 'fa-bolt', label: 'Bolt' },
  { key: 'layers', fa: 'fa-layer-group', label: 'Layers' },
  { key: 'chart', fa: 'fa-chart-line', label: 'Chart' },
  { key: 'book', fa: 'fa-book', label: 'Book' },
  { key: 'run', fa: 'fa-person-running', label: 'Run' },
  { key: 'code', fa: 'fa-laptop-code', label: 'Code' },
  { key: 'compass', fa: 'fa-compass', label: 'Compass' },
  { key: 'handshake', fa: 'fa-handshake', label: 'Handshake' },
  { key: 'heart', fa: 'fa-heart', label: 'Heart' },
  { key: 'flag', fa: 'fa-flag', label: 'Flag' },
]

const ICON_FA: Record<string, string> = Object.fromEntries(ICONS.map((i) => [i.key, i.fa]))

export function iconFa(key: string): string {
  return ICON_FA[key] ?? ICONS[0].fa
}
