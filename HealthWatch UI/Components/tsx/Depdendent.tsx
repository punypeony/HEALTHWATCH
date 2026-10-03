import "../global.css";
import styles from "../modules/Dependent.module.css";
import { useState } from "react";

export type DependentProfile = {
  fullName: string;
  dateOfBirth: string;
  relationship: string;
  notes: string;
};

type DepdendentProps = {
  initialProfile?: Partial<DependentProfile>;
  onSave?: (profile: DependentProfile) => void;
  onCancel?: () => void;
};

export default function Depdendent({ initialProfile = {}, onSave, onCancel }: DepdendentProps) {
  const [profile, setProfile] = useState<DependentProfile>({
    fullName: initialProfile.fullName ?? "",
    dateOfBirth: initialProfile.dateOfBirth ?? "",
    relationship: initialProfile.relationship ?? "",
    notes: initialProfile.notes ?? "",
  });

  function update(field: keyof DependentProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className={styles["dependent-form"]} onSubmit={(event) => { event.preventDefault(); onSave?.(profile); }}>
      <h1>Dependent Information</h1>
      <label className="form-field">Full Name<input autoComplete="name" name="fullName" onChange={(event) => update("fullName", event.target.value)} required value={profile.fullName} /></label>
      <label className="form-field">Date of Birth<input autoComplete="bday" name="dateOfBirth" onChange={(event) => update("dateOfBirth", event.target.value)} required type="date" value={profile.dateOfBirth} /></label>
      <label className="form-field">Relationship<input name="relationship" onChange={(event) => update("relationship", event.target.value)} required value={profile.relationship} /></label>
      <label className="form-field">Health Notes<textarea name="notes" onChange={(event) => update("notes", event.target.value)} value={profile.notes} /></label>
      <div className="form-actions">
        {onCancel && <button className="button-secondary" onClick={onCancel} type="button">Cancel</button>}
        <button className="button-primary" type="submit">Save Dependent</button>
      </div>
    </form>
  );
}
