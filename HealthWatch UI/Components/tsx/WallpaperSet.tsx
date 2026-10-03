import "../global.css";
import styles from "../modules/SharedComponents.module.css";
import type { ReactNode } from "react";
type WallpaperSetProps = { imageUrl?: string; children?: ReactNode };
export default function WallpaperSet({ imageUrl = new URL("../../References/Wallpaper.png", import.meta.url).href, children }: WallpaperSetProps) {
  return <div className={styles["wallpaper"]} style={{ backgroundImage: `url("${imageUrl}")` }}>{children}</div>;
}
