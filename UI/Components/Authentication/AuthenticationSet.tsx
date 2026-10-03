import { FunctionComponent } from 'react';
import styles from './AuthenticationSet.module.css';


const AuthenticationSet: FunctionComponent = () => {
  	return (
    		<div className={styles.authentication}>
      			<div className={styles.property1login}>
        				<div className={styles.frame}>
          					<b className={styles.welcomeBackYouve}>Welcome back, you’ve been missed!</b>
          					<div className={styles.frame2}>
            						<div className={styles.enterYourEmail}>Enter your email</div>
          					</div>
          					<div className={styles.frame2}>
            						<div className={styles.enterYourEmail}>Enter your password</div>
          					</div>
          					<div className={styles.frame4}>
            						<b className={styles.enterYourEmail}>Login</b>
          					</div>
          					<div className={styles.frame5} />
          					<div className={styles.frame6}>
            						<div className={styles.dontHaveAnContainer}>
              							<span>
                								<span>Don’t have an account yet?</span>
                  									<b className={styles.b}>{` `}</b>
                  									</span>
                  									<b className={styles.b}>
                    										<span className={styles.signUp2}>Sign up.</span>
                  									</b>
                  									</div>
                  									</div>
                  									</div>
                  									</div>
                  									<div className={styles.property1signUp}>
                    										<div className={styles.frame}>
                      											<b className={styles.welcomeAboardLets}>Welcome aboard, let’s get started!</b>
                      											<div className={styles.frame8}>
                        												<div className={styles.enterYourEmail}>Enter an Email</div>
                      											</div>
                      											<div className={styles.frame8}>
                        												<div className={styles.enterYourEmail}>Enter a password</div>
                      											</div>
                      											<div className={styles.frame8}>
                        												<div className={styles.enterYourEmail}>Confirm your password</div>
                      											</div>
                      											<div className={styles.frame5} />
                      											<div className={styles.frame12}>
                        												<b className={styles.enterYourEmail}>Login</b>
                      											</div>
                    										</div>
                  									</div>
                  									</div>);
                								};
                								
                								export default AuthenticationSet ;
                								