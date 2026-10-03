import type { ScanEntry } from '../domain'
import ScreenArt, { Hotspot } from './ScreenArt'
import AlertCardsSet from './AlertCardsSet'
import styles from '../modules/Loaders.module.css'

export default function AlertsLoader({ alerts, onBack }: { alerts: ScanEntry[]; onBack: () => void }) {
  return <><ScreenArt file="AlertsShell.svg" title="Alerts" derived /><section className={`${styles.scroll} ${styles.alerts}`} aria-label="Alerts list" tabIndex={0} data-loader="alerts"><div className={styles.alertPanel}><AlertCardsSet alerts={alerts} /></div></section><Hotspot label="Back to Overview" onClick={onBack} x={979} y={193} width={54} height={54} /></>
}
