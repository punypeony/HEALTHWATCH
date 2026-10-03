import type { ScanEntry } from '../domain'
import { asset } from '../utils'
import styles from '../modules/OverviewLoader.module.css'

const variants = { Low: { details: 'details5', button: 'button3', icon: 'Check circle.svg' }, Moderate: { details: 'details6', button: 'button4', icon: 'Alert circle2.svg' }, High: { details: 'details7', button: 'button5', icon: 'Alert triangle.svg' } } as const
export default function HistoryCardsSet({ entries }: { entries: ScanEntry[] }) {
  return <ul className={styles.historyList} aria-label="Scan history">{entries.length === 0 && <li>No scans yet.</li>}{entries.map(entry => {
    const variant = variants[entry.risk]
    return <li key={entry.id} className={styles.historyCards}><div className={styles.dependent}><div className={styles[variant.details]}><div className={styles.frame27}>
      <img className={styles.checkCircleIcon} src={asset(variant.icon)} alt={`${entry.risk} risk`} />
      <div className={styles.frame28}><div className={styles.frame29}><div className={styles.frame30}><div className={styles.safe}>{entry.title}</div></div><div className={styles.frame31}><div className={styles.description}>{entry.description}</div></div></div><div className={styles.frame32}><div className={styles.description}>{entry.date}</div></div></div>
      <button type="button" className={styles[variant.button]} disabled aria-label="Remove history entry (future development)"><div className={styles.minus}><img className={styles.icon} src={asset('Minus.svg')} alt="" /></div></button>
    </div></div></div></li>
  })}</ul>
}
