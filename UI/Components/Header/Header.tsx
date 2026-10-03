import { FunctionComponent } from 'react';
import styles from './Header.module.css';


const Header: FunctionComponent = () => {
  	return (
    		<div className={styles.header}>
      			<div className={styles.header2}>
        				<div className={styles.frame}>
          					<div className={styles.frame2}>
            						<div className={styles.frame3}>
              							<b className={styles.healthwatch}>HealthWatch</b>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default Header ;
