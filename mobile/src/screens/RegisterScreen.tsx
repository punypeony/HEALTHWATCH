import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";

import { register } from "../api";
import { Field } from "../components/Field";
import { placeholder } from "../theme/placeholder";
import type { AuthStackParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setFormError("Enter your name.");
      return;
    }
    if (trimmedName.length > 200) {
      setFormError("Name must be 200 characters or fewer.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8 || password.length > 1024) {
      setFormError("Password must be 8 to 1024 characters.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await register({ name: trimmedName, email: trimmedEmail, password });
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
    <ScrollView contentContainerStyle={placeholder.screen} keyboardShouldPersistTaps="handled">
      <Text style={placeholder.title}>Register</Text>
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
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
      <Text>Use at least 8 characters.</Text>
      {formError ? <Text style={placeholder.error}>{formError}</Text> : null}
      <Pressable
        onPress={() => {
          void onSubmit();
        }}
        style={placeholder.button}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator /> : <Text>Create account</Text>}
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Login")} style={placeholder.button}>
        <Text>Already have an account</Text>
      </Pressable>
    </ScrollView>
  );
}
