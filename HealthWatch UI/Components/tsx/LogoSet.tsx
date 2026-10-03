import "../global.css";
import styles from "../modules/SharedComponents.module.css";
type LogoSetProps = { compact?: boolean };
export default function LogoSet({ compact = false }: LogoSetProps) {
  return <span className={styles["healthwatch-logo"]} aria-label="HealthWatch"><span aria-hidden="true">HW</span>{!compact && <strong>HealthWatch</strong>}</span>;
}
