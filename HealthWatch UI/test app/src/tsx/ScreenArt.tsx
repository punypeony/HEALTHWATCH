import { asset, position } from '../utils'
import styles from '../modules/Screen.module.css'

export default function ScreenArt({ file, title, derived = false }: { file: string; title: string; derived?: boolean }) {
  return <><h1 className="sr-only">{title}</h1><img className={styles.art} src={asset(file, derived)} alt="" draggable={false} /></>
}
export function Hotspot({ label, onClick, x, y, width, height, screenHeight = 2360 }: { label: string; onClick: () => void; x: number; y: number; width: number; height: number; screenHeight?: number }) {
  return <button type="button" className={styles.hotspot} style={position(x, y, width, height, screenHeight)} aria-label={label} onClick={onClick} />
}


