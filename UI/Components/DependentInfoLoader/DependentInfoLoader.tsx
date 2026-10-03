import { FunctionComponent } from 'react';
import styles from './DependentInfoLoader.module.css';


const DependentInfoLoader: FunctionComponent = () => {
  	return (
    		<div className={styles.dependentInfoLoader}>
      			<div className={styles.frame}>
        				<div className={styles.dependent}>Dependent</div>
        				<div className={styles.button}>
          					<img className={styles.arrowBackIcon} alt="" />
        				</div>
      			</div>
      			<div className={styles.details}>
        				<div className={styles.frame2}>
          					<div className={styles.frame3}>
            						<div className={styles.dailyTargetsAre}>Daily targets are calculated automatically from height, weight, sex, and recorded conditions. They are not entered by hand.</div>
          					</div>
        				</div>
        				<div className={styles.details2}>
          					<div className={styles.frame4}>
            						<div className={styles.frame5}>
              							<div className={styles.frame6}>
                								<b className={styles.sodium}>{`Sodium `}</b>
              							</div>
              							<div className={styles.frame7}>
                								<div className={styles.sodium}>0 mg</div>
              							</div>
            						</div>
            						<div className={styles.frame8}>
              							<div className={styles.frame6}>
                								<b className={styles.sodium}>{`Calorie `}</b>
              							</div>
              							<div className={styles.frame7}>
                								<div className={styles.sodium}>0 kcal</div>
              							</div>
            						</div>
            						<div className={styles.frame11}>
              							<div className={styles.frame6}>
                								<b className={styles.sodium}>{`Sugar `}</b>
              							</div>
              							<div className={styles.frame7}>
                								<div className={styles.sodium}>0 g</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.frame14}>
          					<div className={styles.parameters}>
            						<div className={styles.name}>Name</div>
            						<div className={styles.frame15}>
              							<div className={styles.martinSantiago}>Martin Santiago</div>
            						</div>
          					</div>
          					<div className={styles.parameters2}>
            						<div className={styles.name}>Age</div>
            						<div className={styles.frame15}>
              							<div className={styles.martinSantiago}>Age in years</div>
            						</div>
          					</div>
          					<div className={styles.parameters3}>
            						<div className={styles.name}>Height (cm)</div>
            						<div className={styles.frame15}>
              							<div className={styles.martinSantiago}>e.g. 165</div>
            						</div>
          					</div>
          					<div className={styles.parameters4}>
            						<div className={styles.name}>Weight (kg)</div>
            						<div className={styles.frame15}>
              							<div className={styles.martinSantiago}>e.g. 70</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.frame2}>
          					<div className={styles.sex}>
            						<div className={styles.name}>Sex</div>
            						<div className={styles.frame20}>
              							<div className={styles.frame21}>
                								<div className={styles.martinSantiago}>Male</div>
              							</div>
              							<div className={styles.frame22}>
                								<div className={styles.martinSantiago}>Female</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.frame23}>
          					<div className={styles.frame24}>
            						<div className={styles.allergies}>Allergies</div>
          					</div>
          					<div className={styles.frame25}>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>No known Allergies</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Milk</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Soy</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Peanut</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Gluten/Wheat</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Egg</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Corn</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Lupin</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.parameters5}>
          					<div className={styles.name}>Other Allergies</div>
          					<div className={styles.frame15}>
            						<div className={styles.martinSantiago}>Text Value</div>
          					</div>
          					<div className={styles.frame35}>
            						<div className={styles.martinSantiago}>Add Allergy</div>
          					</div>
        				</div>
        				<div className={styles.parameters5}>
          					<div className={styles.name}>Conditions</div>
          					<div className={styles.frame36}>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Diabetes</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Hypertension</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>High cholesterol</div>
              							</div>
            						</div>
            						<div className={styles.unit}>
              							<div className={styles.frame26}>
                								<div className={styles.dependent}>Kidney Disease</div>
              							</div>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};

export default DependentInfoLoader ;
