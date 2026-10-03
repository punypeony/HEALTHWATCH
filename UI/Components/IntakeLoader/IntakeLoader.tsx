import { FunctionComponent } from 'react';
import styles from './IntakeLoader.module.css';


const IntakeLoader: FunctionComponent = () => {
  	return (
    		<div className={styles.intakeLoader}>
      			<div className={styles.frame}>
        				<div className={styles.intake}>Intake</div>
        				<div className={styles.button}>
          					<img className={styles.arrowBackIcon} alt="" />
        				</div>
      			</div>
      			<div className={styles.frame2}>
        				<div className={styles.frame3}>
          					<div className={styles.frame4}>
            						<div className={styles.frame5}>
              							<b className={styles.calorie}>{`Calorie `}</b>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0/0 kcal</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0%</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>Text Value</div>
            						</div>
          					</div>
          					<div className={styles.frame9}>
            						<div className={styles.frame10}>
              							<b className={styles.calorie}>{`Sodium `}</b>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0/0 mg</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0%</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>Text Value</div>
            						</div>
          					</div>
          					<div className={styles.frame14}>
            						<div className={styles.frame15}>
              							<b className={styles.calorie}>{`Sugar `}</b>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0/0 g</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>0%</div>
            						</div>
            						<div className={styles.frame6}>
              							<div className={styles.kcal}>Text Value</div>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default IntakeLoader ;
