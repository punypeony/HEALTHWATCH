import { useState } from 'react'
import type { AppData, DependentPage } from '../domain'
import DependentHome from './DependentHome'
import DependentInfoLoader from './DependentInfoLoader'
import OverviewLoader from './OverviewLoader'
import ScannerLoader from './ScannerLoader'
import DependentCamera from './DependentCamera'
import IntakeLoader from './IntakeLoader'
import AlertsLoader from './AlertsLoader'
import NavigationSet from './NavigationSet'
import styles from '../modules/Screen.module.css'

type Screen = 'home' | 'edit' | DependentPage
export default function DefaultHome({ data }: { data: AppData }) {
  const [screen, setScreen] = useState<Screen>('home')
  const [dependent, setDependent] = useState(data.dependents[0]?.id ?? 0)
  const isDependent = screen !== 'home' && screen !== 'edit'
  const history = data.scans.filter(entry => entry.dependentId === dependent)
  const alerts = data.alerts.filter(entry => entry.dependentId === dependent)
  function openDependent(id: number) { setDependent(id); setScreen('overview') }
  function editDependent(id: number) { setDependent(id); setScreen('edit') }
  return <main className={styles.stage} style={{ aspectRatio: screen === 'edit' ? '1080 / 2340' : '1080 / 2360' }} data-screen={screen}>
    <div className={styles.screen} key={screen}>
      {screen === 'home' && <DependentHome dependents={data.dependents} onOpen={openDependent} onEdit={editDependent} />}
      {screen === 'edit' && <DependentInfoLoader dependent={dependent} onBack={() => setScreen('home')} />}
      {screen === 'overview' && <OverviewLoader dependent={dependent} entries={history} onBack={() => setScreen('home')} />}
      {screen === 'scan' && <ScannerLoader onCamera={() => setScreen('camera')} onBack={() => setScreen('overview')} />}
      {screen === 'camera' && <DependentCamera onBack={() => setScreen('scan')} />}
      {screen === 'intake' && <IntakeLoader onBack={() => setScreen('overview')} />}
      {screen === 'alerts' && <AlertsLoader alerts={alerts} onBack={() => setScreen('overview')} />}
    </div>
    {isDependent && <NavigationSet current={screen} onNavigate={setScreen} />}
  </main>
}
