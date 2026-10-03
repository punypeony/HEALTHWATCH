import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
export type ScanResultData = { title: string; summary: string; risk?: "Low" | "Moderate" | "High" };
type ResultsProps = { result: ScanResultData; onScanAgain?: () => void; onSave?: () => void };
export default function Results({ result, onScanAgain, onSave }: ResultsProps) {
  return <section className={styles["scan-results"]} aria-labelledby="result-title"><h1 id="result-title">Scan Results</h1><h2><IconSet name="meal" size={48} /> {result.title}</h2><p>{result.summary}</p>{result.risk && <p><IconSet name={result.risk === "Low" ? "check" : result.risk === "Moderate" ? "caution" : "warning"} size={32} /> Risk level: <strong>{result.risk}</strong></p>}<div className={styles["result-actions"]}><button type="button" onClick={onSave}>Save Result</button><button type="button" onClick={onScanAgain}><IconSet name="scan" />Scan Another Meal</button></div></section>;
}
