import { asset } from '../utils'
import styles from '../modules/Loaders.module.css'

export default function DependentInfo() {
  return <img className={styles.infoContent} src={asset('DependentInfoContent.svg', true)} alt="Dependent information: daily targets, name, age, height, weight, sex, allergies, other allergies, and conditions. Editing and saving are reserved for future development." />
}
