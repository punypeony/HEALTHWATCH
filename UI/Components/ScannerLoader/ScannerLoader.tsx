import { FunctionComponent } from 'react';
import styles from './ScannerLoader.module.css';


const ScannerLoader: FunctionComponent = () => {
  	return (
    		<div className={styles.scannerLoader}>
      			<div className={styles.frame}>
        				<div className={styles.frame2}>
          					<div className={styles.frame3}>
            						<div className={styles.scanner}>Scanner</div>
            						<div className={styles.button}>
              							<img className={styles.arrowBackIcon} alt="" />
            						</div>
          					</div>
          					<div className={styles.frame4}>
            						<div className={styles.enterTheBarcode}>{`Enter the barcode if the camera can’t read it. `}</div>
          					</div>
        				</div>
        				<div className={styles.frame5}>
          					<div className={styles.camera}>
            						<img className={styles.icon} alt="" />
          					</div>
          					<b className={styles.enterTheBarcode}>Use Camera</b>
        				</div>
        				<div className={styles.frame6}>
          					<div className={styles.frame7}>
            						<div className={styles.frame8}>
              							<div className={styles.scanner}>Barcode</div>
            						</div>
            						<div className={styles.frame9}>
              							<div className={styles.scanner}>Number Value</div>
            						</div>
            						<div className={styles.frame10}>
              							<b className={styles.enterTheBarcode}>Look up barcode</b>
            						</div>
          					</div>
          					<div className={styles.frameInner}>
            						<div className={styles.frameChild} />
          					</div>
          					<div className={styles.frame11}>
            						<div className={styles.frame8}>
              							<div className={styles.scanner}>Dish Name</div>
            						</div>
            						<div className={styles.frame9}>
              							<div className={styles.scanner}>Text Value</div>
            						</div>
            						<div className={styles.frame14}>
              							<b className={styles.enterTheBarcode}>Look up dish</b>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default ScannerLoader ;
