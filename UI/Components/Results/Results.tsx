import { FunctionComponent } from 'react';
import styles from './Results.module.css';


const Results: FunctionComponent = () => {
  	return (
    		<div className={styles.results}>
      			<div className={styles.frame}>
        				<div className={styles.results2}>Results</div>
        				<div className={styles.button}>
          					<img className={styles.arrowBackIcon} alt="" />
        				</div>
      			</div>
      			<div className={styles.details}>
        				<div className={styles.frame2}>
          					<div className={styles.frame3}>
            						<div className={styles.textValue}>Text Value</div>
          					</div>
        				</div>
        				<div className={styles.frame2}>
          					<div className={styles.frame5}>
            						<div className={styles.textValue2}>Text Value</div>
          					</div>
        				</div>
        				<div className={styles.frame6}>
          					<div className={styles.textValue}>Text Value</div>
        				</div>
        				<div className={styles.frame6}>
          					<div className={styles.textValue}>Text Value</div>
        				</div>
        				<div className={styles.buttons}>
          					<div className={styles.frame8}>
            						<div className={styles.textValue}>Add Allergy</div>
          					</div>
        				</div>
        				<div className={styles.frame9}>
          					<div className={styles.textValue}>Add Allergy</div>
        				</div>
      			</div>
    		</div>);
};

export default Results ;
