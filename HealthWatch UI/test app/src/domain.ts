export type Risk = 'Low' | 'Moderate' | 'High'
export type Dependent = { id: number; name: string; age: number; sex: string; conditions: string[]; sodium: number; calories: number; sugar: number }
export type ScanEntry = { id: string; dependentId: number; risk: Risk; title: string; description: string; date: string }
export type AppData = { dependents: Dependent[]; scans: ScanEntry[]; alerts: ScanEntry[] }
export type DependentPage = 'overview' | 'scan' | 'camera' | 'intake' | 'alerts'
