import { FunctionComponent } from 'react';
import styles from './WallpaperSet.module.css';


const WallpaperSet: FunctionComponent = () => {
  	return (
    		<div className={styles.wallpaper}>
      			<div className={styles.property1default} />
      			<img className={styles.property1variant2Icon} alt="" />
      			<div className={styles.property1variant3} />
    		</div>);
};

export default WallpaperSet ;
