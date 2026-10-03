import { FunctionComponent } from 'react';
import styles from './StatusSet.module.css';


const StatusSet: FunctionComponent = () => {
  	return (
    		<div className={styles.status}>
      			<div className={styles.property1low}>
        				<div className={styles.text}>Active</div>
      			</div>
      			<div className={styles.property1low}>
        				<div className={styles.text}>Acknowledged</div>
      			</div>
      			<div className={styles.property1medium}>
        				<div className={styles.text}>Active</div>
      			</div>
      			<div className={styles.property1high}>
        				<div className={styles.text}>Active</div>
      			</div>
    		</div>);
};

export default StatusSet ;
