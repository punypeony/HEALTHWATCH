import type { CSSProperties } from 'react'

export function asset(file: string, derived = false) {
  return `${import.meta.env.BASE_URL}assets/${derived ? 'derived' : 'References'}/${encodeURIComponent(file)}`
}
export function position(x: number, y: number, width: number, height: number, screenHeight = 2360): CSSProperties {
  return { left: `${x / 1080 * 100}%`, top: `${y / screenHeight * 100}%`, width: `${width / 1080 * 100}%`, height: `${height / screenHeight * 100}%` }
}
