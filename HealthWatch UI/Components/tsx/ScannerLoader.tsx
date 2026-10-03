import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
type ScannerLoaderProps = { loading?: boolean; onCancel?: () => void };
export default function ScannerLoader({ loading = true, onCancel }: ScannerLoaderProps) {
  return <section className={styles.scanner} aria-label="Food scanner" aria-busy={loading}><IconSet name="scan" size={64} />{loading ? <><p role="status">Scanning your meal…</p><button type="button" onClick={onCancel}>Cancel Scan</button></> : <p>Ready to scan your meal.</p>}</section>;
}
