import { FunctionComponent } from 'react';
import styles from './IntensitySet.module.css';


const IntensitySet: FunctionComponent = () => {
  	return (
    		<div className={styles.intensity}>
      			<div className={styles.property1low}>
        				<div className={styles.frame}>
          					<img className={styles.checkCircleIcon} alt="" />
          					<div className={styles.lowRisk}>Low Risk</div>
        				</div>
      			</div>
      			<div className={styles.property1moderate}>
        				<div className={styles.frame2}>
          					<div className={styles.alertCircle}>
            						<img className={styles.icon} alt="" />
          					</div>
          					<div className={styles.lowRisk}>Moderate Risk</div>
        				</div>
      			</div>
      			<div className={styles.property1high}>
        				<div className={styles.frame3}>
          					<div className={styles.alertCircle}>
            						<img className={styles.icon2} alt="" />
          					</div>
          					<div className={styles.lowRisk}>High Risk</div>
        				</div>
      			</div>
    		</div>);
};

export default IntensitySet ;
