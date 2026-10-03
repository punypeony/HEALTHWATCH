import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/SharedComponents.module.css";
type HeaderProps = { title?: string; onNotifications?: () => void; unreadCount?: number; onBack?: () => void };
export default function Header({ title = "HealthWatch", onNotifications, unreadCount = 0, onBack }: HeaderProps) {
  return <header className={styles["app-header"]}>{onBack && <button type="button" onClick={onBack} aria-label="Go back"><IconSet name="back" /></button>}<h1>{title}</h1><button aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} onClick={onNotifications} type="button"><IconSet name="inbox" />Notifications{unreadCount > 0 && <span aria-label={`${unreadCount} unread`}> {unreadCount}</span>}</button></header>;
}
