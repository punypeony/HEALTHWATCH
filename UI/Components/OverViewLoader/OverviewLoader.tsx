import { FunctionComponent } from 'react';
import styles from './OverviewLoader.module.css';


const OverviewLoader: FunctionComponent = () => {
  	return (
    		<div className={styles.overviewLoader}>
      			<div className={styles.frame}>
        				<div className={styles.overview}>Overview</div>
        				<div className={styles.button}>
          					<img className={styles.arrowBackIcon} alt="" />
        				</div>
      			</div>
      			<div className={styles.frame2}>
        				<div className={styles.overview2}>
          					<div className={styles.details}>
            						<div className={styles.frame3}>
              							<div className={styles.frame4}>
                								<div className={styles.frame5}>
                  									<div className={styles.safe}>Safe</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.div}>0</div>
                								</div>
              							</div>
              							<div className={styles.frame7}>
                								<div className={styles.frame5}>
                  									<div className={styles.safe}>Warning</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.div}>{`0 `}</div>
                								</div>
              							</div>
              							<div className={styles.frame10}>
                								<div className={styles.frame5}>
                  									<div className={styles.safe}>{`Danger `}</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.div}>{`0 `}</div>
                								</div>
              							</div>
              							<div className={styles.details2}>
                								<div className={styles.div}>Total Scans: 0</div>
              							</div>
              							<div className={styles.details3}>
                								<div className={styles.div}>Common Reason: None</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.frame13}>
            						<div className={styles.overview}>Recent Scans</div>
          					</div>
          					<div className={styles.details4}>
            						<div className={styles.frame14}>
              							<div className={styles.frame15}>
                								<div className={styles.frame16}>
                  									<div className={styles.safe}>Safe</div>
                								</div>
                								<div className={styles.frame17}>
                  									<div className={styles.div}>0</div>
                								</div>
              							</div>
              							<div className={styles.frame18}>
                								<div className={styles.separator} />
              							</div>
              							<div className={styles.frame19}>
                								<div className={styles.frame16}>
                  									<div className={styles.safe}>Warning</div>
                								</div>
                								<div className={styles.frame17}>
                  									<div className={styles.div}>{`0 `}</div>
                								</div>
              							</div>
              							<div className={styles.frame22}>
                								<div className={styles.separator} />
              							</div>
              							<div className={styles.frame23}>
                								<div className={styles.frame16}>
                  									<div className={styles.safe}>{`Danger `}</div>
                								</div>
                								<div className={styles.frame17}>
                  									<div className={styles.div}>{`0 `}</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.history}>
          					<div className={styles.frame26}>
            						<div className={styles.overview}>History</div>
            						<div className={styles.button2}>
              							<div className={styles.overview}>Clear all</div>
            						</div>
          					</div>
          					<div className={styles.historyCards}>
            						<div className={styles.dependent}>
              							<div className={styles.details5}>
                								<div className={styles.frame27}>
                  									<img className={styles.checkCircleIcon} alt="" />
                  									<div className={styles.frame28}>
                    										<div className={styles.frame29}>
                      											<div className={styles.frame30}>
                        												<div className={styles.safe}>Text Value</div>
                      											</div>
                      											<div className={styles.frame31}>
                        												<div className={styles.description}>Description</div>
                      											</div>
                    										</div>
                    										<div className={styles.frame32}>
                      											<div className={styles.description}>Jan 01, 2026, 12:00 AMText Value</div>
                    										</div>
                  									</div>
                  									<div className={styles.button3}>
                    										<div className={styles.minus}>
                      											<img className={styles.icon} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.historyCards}>
            						<div className={styles.dependent}>
              							<div className={styles.details6}>
                								<div className={styles.frame27}>
                  									<div className={styles.alertCircle}>
                    										<img className={styles.icon2} alt="" />
                  									</div>
                  									<div className={styles.frame28}>
                    										<div className={styles.frame29}>
                      											<div className={styles.frame30}>
                        												<div className={styles.safe}>Text Value</div>
                      											</div>
                      											<div className={styles.frame31}>
                        												<div className={styles.description}>Description</div>
                      											</div>
                    										</div>
                    										<div className={styles.frame32}>
                      											<div className={styles.description}>Jan 01, 2026, 12:00 AMText Value</div>
                    										</div>
                  									</div>
                  									<div className={styles.button4}>
                    										<div className={styles.minus}>
                      											<img className={styles.icon} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.historyCards}>
            						<div className={styles.dependent}>
              							<div className={styles.details7}>
                								<div className={styles.frame27}>
                  									<div className={styles.alertCircle}>
                    										<img className={styles.icon4} alt="" />
                  									</div>
                  									<div className={styles.frame28}>
                    										<div className={styles.frame29}>
                      											<div className={styles.frame30}>
                        												<div className={styles.safe}>Text Value</div>
                      											</div>
                      											<div className={styles.frame31}>
                        												<div className={styles.description}>Description</div>
                      											</div>
                    										</div>
                    										<div className={styles.frame32}>
                      											<div className={styles.description}>Jan 01, 2026, 12:00 AMText Value</div>
                    										</div>
                  									</div>
                  									<div className={styles.button5}>
                    										<div className={styles.minus}>
                      											<img className={styles.icon} alt="" />
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default OverviewLoader ;
