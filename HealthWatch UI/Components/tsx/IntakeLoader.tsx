import IconSet from "./IconSet";
import "../global.css";
import styles from "../modules/Dependent.module.css";
import { useState } from "react";

type IntakeLoaderProps = { onSubmit?: (intake: { item: string; amount: string; notes: string }) => void };

export default function IntakeLoader({ onSubmit }: IntakeLoaderProps) {
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form className={styles["intake-form"]} onSubmit={(event) => { event.preventDefault(); onSubmit?.({ item, amount, notes }); }}>
      <h1><IconSet name="meal" size={48} /> Meal Details</h1>
      <label className="form-field">Food or Drink<input autoComplete="off" name="item" onChange={(event) => setItem(event.target.value)} placeholder="Enter food or drink" required value={item} /></label>
      <label className="form-field">Amount<input name="amount" onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 1 serving" value={amount} /></label>
      <label className="form-field">Notes<textarea name="notes" onChange={(event) => setNotes(event.target.value)} placeholder="Add any details" value={notes} /></label>
      <button className="button-primary" type="submit">Save Meal</button>
    </form>
  );
}
