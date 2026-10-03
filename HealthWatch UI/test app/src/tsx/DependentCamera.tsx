import ScreenArt from './ScreenArt'
import { asset } from '../utils'
import styles from '../modules/Screen.module.css'

export default function DependentCamera({ onBack }: { onBack: () => void }) {
  return <>
    <ScreenArt file="Dependent Camera - HealthWatch.svg" title="Dependent Camera" derived />
    <p className="sr-only">Camera screen preview. Camera capture and barcode lookup are reserved for future development.</p>
    <button className={styles.cameraBack} type="button" aria-label="Back to Scanner" onClick={onBack}><img src={asset('arrow_back.svg')} alt="" /></button>
  </>
}

