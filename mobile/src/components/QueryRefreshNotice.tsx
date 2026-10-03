import { Text, View } from "react-native";
import { Button } from "./Button";
import { typography } from "../theme/typography";

export function QueryRefreshNotice({ query }: { query: { refreshing: boolean; refreshError?: string; retry: () => void } }) {
  if (query.refreshError) return <View style={{ gap: 6 }}>
    <Text accessibilityLiveRegion="polite" style={typography.body}>Showing previously loaded data. Refresh failed: {query.refreshError}</Text>
    <Button label="Retry refresh" variant="outline" onPress={query.retry} />
  </View>;
  return query.refreshing ? <Text accessibilityLiveRegion="polite" style={typography.body}>Updating…</Text> : null;
}
