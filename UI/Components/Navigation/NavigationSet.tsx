import { FunctionComponent } from 'react';
import styles from './NavigationSet.module.css';


const NavigationSet: FunctionComponent = () => {
  	return (
    		<div className={styles.navigation}>
      			<div className={styles.property1variant2}>
        				<div className={styles.frame}>
          					<div className={styles.homeParent}>
            						<img className={styles.homeIcon} alt="" />
            						<div className={styles.home}>Home</div>
          					</div>
          					<div className={styles.historyParent}>
            						<img className={styles.homeIcon} alt="" />
            						<div className={styles.home}>Overview</div>
          					</div>
          					<div className={styles.frameWrapper}>
            						<div className={styles.frame2}>
              							<img className={styles.scanIcon} alt="" />
            						</div>
          					</div>
          					<div className={styles.inboxParent}>
            						<img className={styles.homeIcon} alt="" />
            						<div className={styles.home}>Intake</div>
          					</div>
          					<div className={styles.alertCircleParent}>
            						<img className={styles.homeIcon} alt="" />
            						<div className={styles.home}>Alerts</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.property1buttons}>
        				<div className={styles.buttons}>
          					<div className={styles.frame3}>
            						<b className={styles.add}>Add</b>
          					</div>
          					<div className={styles.frame4}>
            						<b className={styles.add}>Refresh</b>
          					</div>
        				</div>
      			</div>
      			<div className={styles.property1variant4}>
        				<div className={styles.buttons2}>
          					<div className={styles.frame3}>
            						<b className={styles.add}>Save Changes</b>
          					</div>
          					<div className={styles.frame4}>
            						<b className={styles.add}>Delete Dependent</b>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default NavigationSet ;
