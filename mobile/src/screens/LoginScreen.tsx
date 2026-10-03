import { AuthSwitch } from "../components/AuthSwitch";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Text } from "react-native";
import { AuthLayout, authText } from "../components/AuthLayout";

import { useSession } from "../auth/SessionContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import type { AuthStackParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation, route }: Props) {
  const { login } = useSession();
  const [email, setEmail] = useState(route.params?.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await login(trimmedEmail, password);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back, you’ve been missed!"
      footer={<AuthSwitch onPress={() => navigation.navigate("Register")} />}>
        {route.params?.registeredEmail ? (
          <Text style={authText.note}>
            Account created for {route.params.registeredEmail}. Log in to continue.
          </Text>
        ) : null}
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
        {formError ? <Text style={authText.error}>{formError}</Text> : null}
        <Button variant="auth" label="Login" onPress={() => void onSubmit()} pending={submitting} />
    </AuthLayout>
  );
}
