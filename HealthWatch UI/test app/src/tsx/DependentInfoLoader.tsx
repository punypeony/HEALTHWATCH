import ScreenArt, { Hotspot } from './ScreenArt'
import DependentInfo from './DependentInfo'
import styles from '../modules/Loaders.module.css'

export default function DependentInfoLoader({ dependent, onBack }: { dependent: number; onBack: () => void }) {
  return <><ScreenArt file="EditShell.svg" title={`Dependent ${dependent} Information`} derived /><section className={`${styles.scroll} ${styles.edit}`} aria-label="Dependent information" tabIndex={0} data-loader="dependent-info"><DependentInfo /></section><Hotspot label="Back to Dependent Home" onClick={onBack} x={989} y={214} width={54} height={54} screenHeight={2340} /></>
}
