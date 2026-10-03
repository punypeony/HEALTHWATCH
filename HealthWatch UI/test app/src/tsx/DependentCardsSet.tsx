import type { Dependent } from '../domain'
import { asset } from '../utils'
import styles from '../modules/Loaders.module.css'

export default function DependentCardsSet({ dependents, onOpen, onEdit }: { dependents: Dependent[]; onOpen: (id: number) => void; onEdit: (id: number) => void }) {
  return <ul className={styles.dependentList} aria-label="Dependent cards">{dependents.length === 0 && <li>No dependents yet.</li>}{dependents.map(dependent => <li key={dependent.id} className={styles.dependentCard}>
    <h2 className={styles.name}>{dependent.name}</h2>
    <div className={styles.dependentBody}>
      <img className={styles.meal} src={asset('Vector.svg')} alt="" />
      <dl className={styles.nutrients}><div><dt>Sodium</dt><dd>{dependent.sodium} mg</dd></div><div><dt>Calorie</dt><dd>{dependent.calories} kcal</dd></div><div><dt>Sugar</dt><dd>{dependent.sugar} g</dd></div></dl>
      <p className={styles.demographics}>{dependent.age} Years Old · {dependent.sex}</p>
      <div className={styles.conditions}>{dependent.conditions.map((condition, index) => <span key={index}>{condition}</span>)}</div>
      <div className={styles.dependentActions}><button type="button" aria-label={`Open dependent ${dependent.id}`} onClick={() => onOpen(dependent.id)}>Open</button><button type="button" aria-label={`Edit dependent ${dependent.id}`} onClick={() => onEdit(dependent.id)}>Edit</button></div>
    </div>
  </li>)}</ul>
}
