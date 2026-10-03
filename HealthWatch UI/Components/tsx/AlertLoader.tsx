import "../global.css";
import AlertCardsSet, { type AlertCardData } from "./AlertCardsSet";
type AlertLoaderProps = { alerts?: AlertCardData[]; loading?: boolean; onOpen?: (alert: AlertCardData) => void; onAcknowledge?: (alert: AlertCardData) => void };
export default function AlertLoader({ alerts = [], loading = false, ...handlers }: AlertLoaderProps) {
  return <section aria-label="Alerts"><h1>Alerts</h1>{loading ? <p role="status">Loading alerts…</p> : <AlertCardsSet alerts={alerts} {...handlers} />}</section>;
}
