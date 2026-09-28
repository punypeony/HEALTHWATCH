import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { AlertsScreen } from "../screens/AlertsScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { IntakeScreen } from "../screens/IntakeScreen";
import { SummaryScreen } from "../screens/SummaryScreen";
import type { AppStackParamList, DependentTabParamList } from "../types";

const Tab = createBottomTabNavigator<DependentTabParamList>();

type Props = NativeStackScreenProps<AppStackParamList, "Dependent">;

const PILL_ORDER = ["History", "Summary", "Scan", "Alerts", "Intake"] as const;

export function DependentTabs({ route }: Props) {
  const { dependentId } = route.params;

  return (
    <Tab.Navigator
      key={String(dependentId)}
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Scan" component={ScannerScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="History" component={HistoryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Summary" component={SummaryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Intake" component={IntakeScreen} initialParams={{ dependentId }} />
    </Tab.Navigator>
  );
}

function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.dock, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        <PillItem
          label="Home"
          active={false}
          onPress={() => {
            navigation.getParent()?.navigate("Dependents");
          }}
        />
        {PILL_ORDER.map((name) => {
          const route = state.routes.find((item) => item.name === name);
          if (!route) {
            return null;
          }
          const index = state.routes.indexOf(route);
          const active = state.index === index;
          return (
            <PillItem
              key={name}
              label={name}
              active={active}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!active && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function PillItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text
        style={[
          styles.label,
          active ? styles.active : null,
          label === "Scan" ? styles.scan : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 12,
    right: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.avatar,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  scan: {
    color: colors.white,
    backgroundColor: colors.teal,
    overflow: "hidden",
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minWidth: 44,
    minHeight: 44,
    textAlign: "center",
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
  },
  active: {
    color: colors.teal,
  },
});
