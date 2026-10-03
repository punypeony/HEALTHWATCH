import ScreenArt, { Hotspot } from './ScreenArt'

export default function IntakeLoader({ onBack }: { onBack: () => void }) {
  return <><ScreenArt file="Dependent Intake - HealthWatch.svg" title="Intake" derived /><p className="sr-only">Calorie: 0/0 kcal, 0%. Sodium: 0/0 mg, 0%. Sugar: 0/0 g, 0%.</p><Hotspot label="Back to Overview" onClick={onBack} x={978} y={213} width={54} height={54} /></>
}

