import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
type StatusSetProps = { status: "safe" | "caution" | "alert"; message: string };
const statusNames = { safe: "Safe", caution: "Caution", alert: "Alert" } as const;
export default function StatusSet({ status, message }: StatusSetProps) {
  return <aside className={`${styles.status} ${styles[`status-${status}`]}`} role={status === "alert" ? "alert" : "status"}><IconSet name={status === "safe" ? "check" : status === "caution" ? "caution" : "warning"} size={32} /><strong>{statusNames[status]}</strong><span>{message}</span></aside>;
}
