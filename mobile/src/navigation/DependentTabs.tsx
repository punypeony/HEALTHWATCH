import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AlertsScreen } from "../screens/AlertsScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { IntakeScreen } from "../screens/IntakeScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { SummaryScreen } from "../screens/SummaryScreen";
import { colors } from "../theme/colors";
import type { AppStackParamList, DependentTabParamList } from "../types";

const Tab = createBottomTabNavigator<DependentTabParamList>();

type Props = NativeStackScreenProps<AppStackParamList, "Dependent">;

export function DependentTabs({ route }: Props) {
  const { dependentId } = route.params;

  return (
    <Tab.Navigator
      key={String(dependentId)}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Scan" component={ScannerScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="History" component={HistoryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Summary" component={SummaryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Intake" component={IntakeScreen} initialParams={{ dependentId }} />
    </Tab.Navigator>
  );
}
