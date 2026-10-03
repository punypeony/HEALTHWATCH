import type { Dependent } from '../domain'
import ScreenArt from './ScreenArt'
import DependentCardsSet from './DependentCardsSet'
import styles from '../modules/Loaders.module.css'

export default function DependentHome({ dependents, onOpen, onEdit }: { dependents: Dependent[]; onOpen: (id: number) => void; onEdit: (id: number) => void }) {
  return <><ScreenArt file="HomeShell.svg" title="Dependent Home" derived /><section className={`${styles.scroll} ${styles.home}`} aria-label="Dependents" tabIndex={0} data-loader="dependent-home"><DependentCardsSet dependents={dependents} onOpen={onOpen} onEdit={onEdit} /></section></>
}
