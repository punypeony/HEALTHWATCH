import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../auth/SessionContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
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
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.api}>API: {getApiBaseUrl()}</Text>
        <Text style={typography.section}>Log in</Text>
        {route.params?.registeredEmail ? (
          <Text style={typography.body}>
            Account created for {route.params.registeredEmail}. Log in to continue.
          </Text>
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
        {formError ? <Text style={typography.error}>{formError}</Text> : null}
        <Button label="Login" onPress={() => void onSubmit()} pending={submitting} />
        <Button
          label="Don't have an account yet? Sign up."
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
      </ScrollView>
      </KeyboardAvoidingView>
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  api: {
    ...typography.muted,
  },
});
