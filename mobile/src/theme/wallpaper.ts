/** Same opaque endpoints as assets/design/background.png. */
export const WALLPAPER_TOP = [156, 217, 238] as const; // #9CD9EE
export const WALLPAPER_BOTTOM = [121, 189, 165] as const; // #79BDA5

export function wallpaperColor(position: number, opacity = 1): string {
  const t = Math.max(0, Math.min(1, position));
  const rgb = WALLPAPER_TOP.map((channel, index) => Math.round(channel + (WALLPAPER_BOTTOM[index] - channel) * t));
  return `rgba(${rgb.join(",")},${opacity})`;
}
