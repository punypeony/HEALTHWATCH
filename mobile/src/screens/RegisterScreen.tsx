import { AuthSwitch } from "../components/AuthSwitch";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Text } from "react-native";
import { AuthLayout, authText } from "../components/AuthLayout";

import { register } from "../api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import type { AuthStackParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8 || password.length > 1024) {
      setFormError("Password must be 8 to 1024 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await register({ email: trimmedEmail, password });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login", params: { registeredEmail: trimmedEmail } }],
      });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome aboard, let’s get started!" compact>
        <Field tone="light" hideLabel
          label="Email" placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field tone="light" hideLabel
          label="Password" placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Field tone="light" hideLabel
          label="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={authText.note}>Use at least 8 characters.</Text>
        {formError ? <Text style={authText.error}>{formError}</Text> : null}
        <Button variant="auth" label="Sign Up" onPress={() => void onSubmit()} pending={submitting} />
        <AuthSwitch register onPress={() => navigation.navigate("Login")} />
    </AuthLayout>
  );
}
