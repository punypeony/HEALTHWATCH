import { useState } from 'react'
import Login from './tsx/Login'
import DefaultHome from './tsx/DefaultHome'
import { sampleData } from './sampleData'
import type { AppData } from './domain'
import styles from './modules/Screen.module.css'

export default function App({ data = sampleData }: { data?: AppData }) {
  const [loggedIn, setLoggedIn] = useState(false)
  return loggedIn ? <DefaultHome data={data} /> : <main className={styles.stage} style={{ aspectRatio: '1080 / 2340' }}><div className={styles.screen}><Login onLogin={() => setLoggedIn(true)} /></div></main>
}
