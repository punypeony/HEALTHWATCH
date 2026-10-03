import { FunctionComponent } from 'react';
import styles from './Dependent.module.css';


const Dependent: FunctionComponent = () => {
  	return (
    		<div className={styles.dependent}>
      			<div className={styles.name}>
        				<div className={styles.dependentName}>Dependent Name</div>
      			</div>
      			<div className={styles.dependent2}>
        				<div className={styles.details}>
          					<div className={styles.icon}>
            						<img className={styles.vectorIcon} alt="" />
          					</div>
          					<div className={styles.frame}>
            						<div className={styles.frame2}>
              							<div className={styles.frame3}>
                								<div className={styles.sodium}>{`Sodium `}</div>
              							</div>
              							<div className={styles.frame4}>
                								<div className={styles.sodium}>0 mg</div>
              							</div>
            						</div>
            						<div className={styles.frame5}>
              							<div className={styles.frame3}>
                								<div className={styles.sodium}>{`Calorie `}</div>
              							</div>
              							<div className={styles.frame4}>
                								<div className={styles.sodium}>0 kcal</div>
              							</div>
            						</div>
            						<div className={styles.frame8}>
              							<div className={styles.frame3}>
                								<div className={styles.sodium}>{`Sugar `}</div>
              							</div>
              							<div className={styles.frame4}>
                								<div className={styles.sodium}>0 g</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.details2}>
          					<div className={styles.yearsOld}>99 Years Old · Female</div>
        				</div>
        				<div className={styles.conditions}>
          					<div className={styles.frame11}>
            						<div className={styles.yearsOld}>Condition</div>
          					</div>
          					<div className={styles.frame11}>
            						<div className={styles.yearsOld}>Condition</div>
          					</div>
        				</div>
        				<div className={styles.buttons}>
          					<div className={styles.frame13}>
            						<b className={styles.yearsOld}>Open</b>
          					</div>
          					<div className={styles.frame14}>
            						<b className={styles.yearsOld}>Edit</b>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default Dependent ;
