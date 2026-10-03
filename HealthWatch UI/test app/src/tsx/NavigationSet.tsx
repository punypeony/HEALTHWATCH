import type { DependentPage } from '../domain'
import { asset } from '../utils'
import styles from '../modules/Screen.module.css'

const items = [{ id: 'home', label: 'Home' }, { id: 'overview', label: 'Overview' }, { id: 'scan', label: 'Scan' }, { id: 'intake', label: 'Intake' }, { id: 'alerts', label: 'Alerts' }] as const
export default function NavigationSet({ current, onNavigate }: { current: DependentPage; onNavigate: (page: 'home' | DependentPage) => void }) {
  return <nav className={styles.navigation} aria-label="Dependent navigation">
    <img src={asset('Navigation.svg', true)} alt="" />
    {items.map(item => <button className={styles.hotspot} key={item.id} type="button" aria-label={item.label} aria-current={(current === 'camera' ? 'scan' : current) === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)} />)}
  </nav>
}


