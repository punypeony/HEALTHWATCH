import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text } from "react-native";

import { useSession } from "../auth/SessionContext";
import { DependentFormScreen } from "../screens/DependentFormScreen";
import { DependentsScreen } from "../screens/DependentsScreen";
import type { AppStackParamList } from "../types";
import { DependentTabs } from "./DependentTabs";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  const { logout } = useSession();

  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => (
          <Pressable
            onPress={() => {
              void logout();
            }}
            style={{ paddingHorizontal: 8 }}
          >
            <Text>Log out</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="Dependents" component={DependentsScreen} />
      <Stack.Screen
        name="DependentForm"
        component={DependentFormScreen}
        options={({ route }) => ({
          title: route.params?.dependentId ? "Edit dependent" : "Add dependent",
        })}
      />
      <Stack.Screen
        name="Dependent"
        component={DependentTabs}
        options={({ route }) => ({ title: route.params.dependentName })}
      />
    </Stack.Navigator>
  );
}
