import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
export type HistoryEntry = { id: string; name: string; date: string; summary?: string };
type HistoryCardsSetProps = { entries: HistoryEntry[]; onOpen?: (entry: HistoryEntry) => void };
export default function HistoryCardsSet({ entries, onOpen }: HistoryCardsSetProps) {
  if (!entries.length) return <p>No scan history yet.</p>;
  return <ul className={styles["history-list"]}>{entries.map((entry) => <li className={styles["history-card"]} key={entry.id}><IconSet name="meal" size={40} /><div><h2>{entry.name}</h2><time>{entry.date}</time>{entry.summary && <p>{entry.summary}</p>}</div><button type="button" onClick={() => onOpen?.(entry)}>View Details</button></li>)}</ul>;
}
