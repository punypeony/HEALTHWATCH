import "../global.css";
import Depdendent, { type DependentProfile } from "./Depdendent";

type DepdendentInfoLoaderProps = {
  initialProfile?: Partial<DependentProfile>;
  onSave?: (profile: DependentProfile) => void;
  onCancel?: () => void;
};

export default function DepdendentInfoLoader(props: DepdendentInfoLoaderProps) {
  return <section aria-label="Dependent details"><Depdendent {...props} /></section>;
}
