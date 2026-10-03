import type { ScanEntry } from '../domain'
import { asset } from '../utils'
import styles from '../modules/Loaders.module.css'

export default function AlertCardsSet({ alerts }: { alerts: ScanEntry[] }) {
  return <ul className={styles.alertCards} aria-label="Alert cards">{alerts.length === 0 && <li>No alerts yet.</li>}{alerts.map(alert => <li key={alert.id} className={`${styles.alertCard} ${alert.risk === 'Low' ? '' : styles[alert.risk.toLowerCase()]}`}>
    <h2>{alert.title}</h2><span className={styles.risk}><img src={asset(alert.risk === 'Low' ? 'Check circle.svg' : alert.risk === 'Moderate' ? 'Alert circle2.svg' : 'Alert triangle.svg')} alt="" />{alert.risk} Risk</span>
    <p>{alert.description}</p><p>{alert.date}</p><p>Active</p><button type="button" disabled title="Acknowledgement is reserved for future development">Acknowledge</button>
  </li>)}</ul>
}
