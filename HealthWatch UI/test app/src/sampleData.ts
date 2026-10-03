import type { AppData, Dependent, ScanEntry } from './domain'

const dependents: Dependent[] = [1, 2].map(id => ({ id, name: 'Dependent Name', age: 99, sex: 'Female', conditions: ['Condition', 'Condition'], sodium: 0, calories: 0, sugar: 0 }))
const scans: ScanEntry[] = dependents.flatMap(dependent => (['Low', 'Moderate', 'High'] as const).map((risk, index) => ({ id: `${dependent.id}-${index}`, dependentId: dependent.id, risk, title: 'Text Value', description: 'Description', date: 'Jan 01, 2026, 12:00 AM' })))
export const sampleData: AppData = { dependents, scans, alerts: scans }
