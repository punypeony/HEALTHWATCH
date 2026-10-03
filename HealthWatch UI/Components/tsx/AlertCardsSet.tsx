import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
export type AlertCardData = { id: string; title: string; message: string; date?: string; acknowledged?: boolean };
type AlertCardsSetProps = { alerts: AlertCardData[]; onOpen?: (alert: AlertCardData) => void; onAcknowledge?: (alert: AlertCardData) => void };

export default function AlertCardsSet({ alerts, onOpen, onAcknowledge }: AlertCardsSetProps) {
  if (!alerts.length) return <p>No alerts right now.</p>;
  return <ul className={styles["alert-list"]}>{alerts.map((alert) => <li className={styles["alert-card"]} key={alert.id}>
    <h2><IconSet name={alert.acknowledged ? "check" : "alert"} /> {alert.title}</h2><p>{alert.message}</p>{alert.date && <time>{alert.date}</time>}
    <div className={styles["alert-actions"]}><button type="button" onClick={() => onOpen?.(alert)}>View Alert</button>
      {!alert.acknowledged && <button type="button" onClick={() => onAcknowledge?.(alert)}>Mark as Read</button>}</div>
  </li>)}</ul>;
}
