import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";

import { useSession } from "../auth/SessionContext";
import { Field } from "../components/Field";
import { placeholder } from "../theme/placeholder";
import type { AuthStackParamList } from "../types";
import { getApiBaseUrl } from "../utils/apiBaseUrl";
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
    <ScrollView contentContainerStyle={placeholder.screen} keyboardShouldPersistTaps="handled">
      <Text style={placeholder.title}>Log in</Text>
      <Text>API: {getApiBaseUrl()}</Text>
      {route.params?.registeredEmail ? (
        <Text>Account created for {route.params.registeredEmail}. Log in to continue.</Text>
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {formError ? <Text style={placeholder.error}>{formError}</Text> : null}
      <Pressable
        onPress={() => {
          void onSubmit();
        }}
        style={placeholder.button}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator /> : <Text>Log in</Text>}
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Register")} style={placeholder.button}>
        <Text>Create an account</Text>
      </Pressable>
    </ScrollView>
  );
}
