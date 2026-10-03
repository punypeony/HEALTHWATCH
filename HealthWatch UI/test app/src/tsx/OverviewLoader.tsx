import type { FunctionComponent } from 'react';
import type { ScanEntry } from '../domain';
import HistoryCardsSet from './HistoryCardsSet';
import ScreenArt from './ScreenArt';
import { asset } from '../utils';
import styles from '../modules/OverviewLoader.module.css';


const OverviewLoader: FunctionComponent<{ dependent: number; entries: ScanEntry[]; onBack: () => void }> = ({ dependent, entries, onBack }) => {
  	return (
    		<><ScreenArt file="Overview.svg" title={`Dependent ${dependent} Overview`} derived /><div className={styles.viewport} role="region" aria-label="Overview and scan history" tabIndex={0} data-loader="overview"><div className={styles.overviewLoader}>
      			<div className={styles.frame}>
        				<div className={styles.overview}>Overview</div>
        				<button type="button" className={styles.button} aria-label="Back to Dependent Home" onClick={onBack}>
          					<img className={styles.arrowBackIcon} src={asset('arrow_back.svg')} alt="" />
        				</button>
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
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'Low').length}</div>
                								</div>
              							</div>
              							<div className={styles.frame7}>
                								<div className={styles.frame5}>
                  									<div className={styles.safe}>Warning</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'Moderate').length}</div>
                								</div>
              							</div>
              							<div className={styles.frame10}>
                								<div className={styles.frame5}>
                  									<div className={styles.safe}>{`Danger `}</div>
                								</div>
                								<div className={styles.frame6}>
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'High').length}</div>
                								</div>
              							</div>
              							<div className={styles.details2}>
                								<div className={styles.div}>Total Scans: {entries.length}</div>
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
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'Low').length}</div>
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
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'Moderate').length}</div>
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
                  									<div className={styles.div}>{entries.filter(entry => entry.risk === 'High').length}</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.history}>
          					<div className={styles.frame26}>
            						<div className={styles.overview}>History</div>
            						<button type="button" className={styles.button2} disabled title="Clear history is reserved for future development">
              							<div className={styles.overview}>Clear all</div>
            						</button>
          					</div>
          					<HistoryCardsSet entries={entries} />
</div></div></div></div></>);
};
export default OverviewLoader;

