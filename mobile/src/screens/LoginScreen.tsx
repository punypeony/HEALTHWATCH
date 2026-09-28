import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../auth/SessionContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.api}>API: {getApiBaseUrl()}</Text>
        <View style={styles.sheet}>
          <Text style={typography.welcome}>Welcome back, you've been missed!</Text>
          {route.params?.registeredEmail ? (
            <Text style={styles.note}>
              Account created for {route.params.registeredEmail}. Log in to continue.
            </Text>
          ) : null}
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
          {formError ? <Text style={typography.error}>{formError}</Text> : null}
          <Button label="Login" onPress={() => void onSubmit()} pending={submitting} />
          <Button
            label="Don't have an account yet? Sign up."
            variant="secondary"
            onPress={() => navigation.navigate("Register")}
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
  api: {
    ...typography.muted,
    textAlign: "center",
    padding: spacing.md,
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
    textAlign: "center",
  },
});
