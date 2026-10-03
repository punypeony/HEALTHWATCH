import ScreenArt, { Hotspot } from './ScreenArt'

export default function ScannerLoader({ onCamera, onBack }: { onCamera: () => void; onBack: () => void }) {
  return <>
    <ScreenArt file="Dependent Scan - HealthWatch.svg" title="Scanner" derived />
    <Hotspot label="Use Camera" onClick={onCamera} x={80} y={418} width={925} height={130} />
    <Hotspot label="Back to Overview" onClick={onBack} x={952} y={253} width={52} height={52} />
  </>
}

