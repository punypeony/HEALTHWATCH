import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { register } from "../api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { AuthStackParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
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
    <SafeAreaView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.sheet}>
          <Text style={typography.welcome}>Welcome aboard, let's get started!</Text>
          <Field label="Name" tone="light" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field
            label="Email"
            tone="light"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            tone="light"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Field
            label="Confirm your password"
            tone="light"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.note}>Use at least 8 characters.</Text>
          {formError ? <Text style={typography.error}>{formError}</Text> : null}
          <Button label="Sign Up" onPress={() => void onSubmit()} pending={submitting} />
          <Button
            label="Already have an account"
            variant="secondary"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.forest,
    borderTopWidth: 7,
    borderTopColor: colors.teal,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  note: {
    ...typography.body,
    color: colors.white,
  },
});
