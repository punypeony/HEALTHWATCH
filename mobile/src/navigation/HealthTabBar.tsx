import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { NavigationBar, type NavigationItem } from "../components/NavigationBar";

export function HealthTabBar({ state, navigation, insets, onHeightChange }: BottomTabBarProps & { onHeightChange: (height: number) => void }) {
  const routeFor = (name: NavigationItem) => state.routes.find(route => route.name === name);
  return <NavigationBar current={state.routes[state.index].name} bottomInset={insets.bottom}
    onLayout={event => onHeightChange(event.nativeEvent.layout.height)}
    onSelect={name => {
      if (name === "Home") { navigation.getParent()?.navigate("Dependents"); return; }
      const route = routeFor(name);
      if (!route) return;
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
    }}
    onLongPress={name => {
      const route = routeFor(name);
      if (route) navigation.emit({ type: "tabLongPress", target: route.key });
    }} />;
}
