import "../global.css";
import styles from "../modules/SharedComponents.module.css";
import type { ReactNode } from "react";
type FrameProps = { children: ReactNode; title?: string };
export default function Frame({ children, title }: FrameProps) {
  return <main className={styles["app-frame"]}>{title && <h1 className="visually-hidden">{title}</h1>}{children}</main>;
}
