import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
type NavigationSetProps = { current?: "Home" | "History" | "Scan" | "Alerts"; onNavigate?: (page: "Home" | "History" | "Scan" | "Alerts") => void };
const pageIcons = { Home: "home", History: "history", Scan: "scan", Alerts: "alert" } as const;
const pages = ["Home", "History", "Scan", "Alerts"] as const;
export default function NavigationSet({ current = "Home", onNavigate }: NavigationSetProps) {
  return <nav aria-label="Main navigation" className={styles["main-navigation"]}>{pages.map((page) => <button aria-current={current === page ? "page" : undefined} key={page} onClick={() => onNavigate?.(page)} type="button"><IconSet name={pageIcons[page]} size={28} /><span>{page}</span></button>)}</nav>;
}
