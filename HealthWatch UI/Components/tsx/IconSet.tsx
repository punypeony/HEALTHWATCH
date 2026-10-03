import styles from "../modules/IconSet.module.css";

// Static URLs let the app bundler include the original reference assets.
const icons = {
  home: new URL("../../References/Home.svg", import.meta.url).href,
  history: new URL("../../References/History.svg", import.meta.url).href,
  scan: new URL("../../References/Scan.svg", import.meta.url).href,
  inbox: new URL("../../References/inbox.svg", import.meta.url).href,
  back: new URL("../../References/arrow_back.svg", import.meta.url).href,
  minus: new URL("../../References/Minus.svg", import.meta.url).href,
  check: new URL("../../References/Check circle.svg", import.meta.url).href,
  alert: new URL("../../References/Alert circle.svg", import.meta.url).href,
  caution: new URL("../../References/Alert circle2.svg", import.meta.url).href,
  warning: new URL("../../References/Alert triangle.svg", import.meta.url).href,
  meal: new URL("../../References/Vector.svg", import.meta.url).href,
} as const;

export type IconName = keyof typeof icons;
type IconSetProps = { name: IconName; size?: number; label?: string };

export default function IconSet({ name, size = 24, label }: IconSetProps) {
  return <img className={styles.icon} src={icons[name]} width={size} height={size} alt={label ?? ""} aria-hidden={label ? undefined : true} />;
}
