import { FunctionComponent } from 'react';
import styles from './AlertLoader.module.css';


const AlertLoader: FunctionComponent = () => {
  	return (
    		<div className={styles.alertLoader}>
      			<div className={styles.frame}>
        				<div className={styles.alerts}>Alerts</div>
        				<div className={styles.button}>
          					<img className={styles.arrowBackIcon} alt="" />
        				</div>
      			</div>
      			<div className={styles.frame2}>
        				<div className={styles.alertCards}>
          					<div className={styles.dependent}>
            						<div className={styles.details}>
              							<div className={styles.frame3}>
                								<div className={styles.frame4}>
                  									<div className={styles.textValue}>Text Value</div>
                								</div>
                								<div className={styles.intensity}>
                  									<div className={styles.frame5}>
                    										<img className={styles.checkCircleIcon} alt="" />
                    										<div className={styles.textValue}>Low Risk</div>
                  									</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.description}>Description</div>
                								</div>
                								<div className={styles.frame7}>
                  									<div className={styles.description}>Jan 01, 2026, 12:00 AM</div>
                								</div>
                								<div className={styles.status}>
                  									<div className={styles.alerts}>Active</div>
                								</div>
                								<div className={styles.frame8}>
                  									<div className={styles.frame9}>
                    										<b className={styles.acknowledge}>Acknowledge</b>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.alertCards}>
          					<div className={styles.dependent2}>
            						<div className={styles.details2}>
              							<div className={styles.frame3}>
                								<div className={styles.frame4}>
                  									<div className={styles.textValue}>Text Value</div>
                								</div>
                								<div className={styles.intensity2}>
                  									<div className={styles.frame12}>
                    										<div className={styles.alertCircle}>
                      											<img className={styles.icon} alt="" />
                    										</div>
                    										<div className={styles.textValue}>Moderate Risk</div>
                  									</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.description}>Description</div>
                								</div>
                								<div className={styles.frame7}>
                  									<div className={styles.description}>Jan 01, 2026, 12:00 AM</div>
                								</div>
                								<div className={styles.status2}>
                  									<div className={styles.alerts}>Active</div>
                								</div>
                								<div className={styles.frame8}>
                  									<div className={styles.frame9}>
                    										<b className={styles.acknowledge}>Acknowledge</b>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.alertCards}>
          					<div className={styles.dependent3}>
            						<div className={styles.details3}>
              							<div className={styles.frame3}>
                								<div className={styles.frame4}>
                  									<div className={styles.textValue}>Text Value</div>
                								</div>
                								<div className={styles.intensity3}>
                  									<div className={styles.frame19}>
                    										<div className={styles.alertCircle}>
                      											<img className={styles.icon2} alt="" />
                    										</div>
                    										<div className={styles.textValue}>High Risk</div>
                  									</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.description}>Description</div>
                								</div>
                								<div className={styles.frame7}>
                  									<div className={styles.description}>Jan 01, 2026, 12:00 AM</div>
                								</div>
                								<div className={styles.status3}>
                  									<div className={styles.alerts}>Active</div>
                								</div>
                								<div className={styles.frame8}>
                  									<div className={styles.frame9}>
                    										<b className={styles.acknowledge}>Acknowledge</b>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default AlertLoader ;
