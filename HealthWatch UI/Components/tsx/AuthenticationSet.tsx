import "../global.css";
import styles from "../modules/AuthenticationSet.module.css";
import { useState, type FormEvent } from "react";

type AuthenticationSetProps = {
  onLogin?: (values: { email: string; password: string }) => void;
  onSignUp?: (values: { name: string; email: string; password: string }) => void;
  onForgotPassword?: () => void;
};

export default function AuthenticationSet({ onLogin, onSignUp, onForgotPassword }: AuthenticationSetProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup" && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    if (mode === "login") onLogin?.({ email, password });
    else onSignUp?.({ name, email, password });
  }

  return (
    <section aria-labelledby="auth-title" className={styles["auth-panel"]}>
      <h1 id="auth-title">{mode === "login" ? "Log In" : "Sign Up"}</h1>
      <form className={styles["auth-form"]} onSubmit={submit}>
        {mode === "signup" && (
          <label className="form-field">
            Full Name
            <input autoComplete="name" name="name" onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
        )}
        <label className="form-field">
          Email Address
          <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label className="form-field">
          Password
          <input autoComplete={mode === "login" ? "current-password" : "new-password"} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        {mode === "signup" && <label className="form-field">
          Confirm Password
          <input autoComplete="new-password" name="confirmPassword" onChange={(event) => { setConfirmPassword(event.target.value); setPasswordError(""); }} required type="password" value={confirmPassword} />
        </label>}
        {passwordError && <p role="alert">{passwordError}</p>}
        {mode === "login" && <button className={styles["auth-link"]} onClick={onForgotPassword} type="button">Forgot Password?</button>}
        <button className="button-primary" type="submit">{mode === "login" ? "Log In" : "Create Account"}</button>
      </form>
      <p className={styles["auth-switch"]}>
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button className={styles["auth-link"]} onClick={() => setMode(mode === "login" ? "signup" : "login")} type="button">
          {mode === "login" ? "Sign Up" : "Log In"}
        </button>
      </p>
    </section>
  );
}
