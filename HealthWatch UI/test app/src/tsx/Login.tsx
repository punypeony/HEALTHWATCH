import ScreenArt from './ScreenArt'
import { position } from '../utils'
import styles from '../modules/Screen.module.css'

export default function Login({ onLogin }: { onLogin: () => void }) {
  return <>
    <ScreenArt file="Login - HealthWatch.svg" title="HealthWatch Login" />
    <form aria-label="Login" onSubmit={event => { event.preventDefault(); onLogin() }}>
      <p className="sr-only">Visual prototype. Login opens the dependent home; no credentials are checked or stored.</p>
      <input aria-label="Email" className={styles.field} style={position(110, 1424, 860, 150, 2340)} placeholder="Enter your email" type="email" autoComplete="off" />
      <input aria-label="Password" className={styles.field} style={position(110, 1594, 860, 150, 2340)} placeholder="Enter your password" type="password" autoComplete="off" />
      <button className={styles.hotspot} style={position(110, 1764, 860, 150, 2340)} type="submit" aria-label="Login" />
    </form>
  </>
}

