import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
export type Intensity = "Low" | "Moderate" | "High";
type IntensitySetProps = { value: Intensity; label?: string };
export default function IntensitySet({ value, label = "Risk level" }: IntensitySetProps) {
  return <div className={`${styles.intensity} ${styles[`intensity-${value.toLowerCase()}`]}`}><IconSet name={value === "Low" ? "check" : value === "Moderate" ? "caution" : "warning"} size={32} /><span>{label}</span><strong>{value}</strong></div>;
}
