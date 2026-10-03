import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppHeader } from "../components/AppHeader";
import { Background } from "../components/Screen";

import { useSession } from "../auth/SessionContext";
import { DependentFormScreen } from "../screens/DependentFormScreen";
import { DependentsScreen } from "../screens/DependentsScreen";
import type { AppStackParamList } from "../types";
import { DependentTabs } from "./DependentTabs";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  const { logout } = useSession();

  return (
    <Background>
    <Stack.Navigator
      screenOptions={{
        // Transparent scenes share the wallpaper; sliding them exposes both pages.
        animation: "none",
        headerTransparent: true,
        contentStyle: { backgroundColor: "transparent" },
        header: ({ options }) => (
          <AppHeader subtitle={options.title === "HealthWatch" ? undefined : options.title}
            onLogout={() => { void logout(); }} />
        ),
      }}
    >
      <Stack.Screen name="Dependents" component={DependentsScreen} options={{ title: "HealthWatch" }} />
      <Stack.Screen
        name="DependentForm"
        component={DependentFormScreen}
        options={{ title: "HealthWatch" }}
      />
      <Stack.Screen
        name="Dependent"
        component={DependentTabs}
        options={{ title: "HealthWatch", headerBackTitle: "Home" }}
      />
    </Stack.Navigator>
    </Background>
  );
}
