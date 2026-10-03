import { createContext, useContext, useState, type PropsWithChildren, type ReactNode } from "react";
import { Image, ScrollView, StyleSheet, Text, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import { useOverlayInsets } from "./OverlayInsets";
import { DependentIdentity, DependentIdentityContext } from "./DependentIdentity";

const SharedBackground = createContext(false);
export const WallpaperHeightContext = createContext(0);

export function Background({ children, auth = false }: PropsWithChildren<{ auth?: boolean }>) {
  const shared = useContext(SharedBackground);
  const [height, setHeight] = useState(0);
  if (shared && !auth) return <View style={styles.transparent}>{children}</View>;
  return (
    <SharedBackground.Provider value={!auth}>
    <WallpaperHeightContext.Provider value={height}>
    <View style={styles.fill} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      <Image accessible={false} source={auth ? require("../../assets/design/auth-background.png") : require("../../assets/design/background.png")}
        style={StyleSheet.absoluteFill} resizeMode="stretch" />
      {children}
    </View>
    </WallpaperHeightContext.Provider>
    </SharedBackground.Provider>
  );
}

/** Fixed artwork behind live, accessible, scrollable content. */
export function Screen({ children, title, footer, contentContainerStyle, ...props }: ScrollViewProps & { title?: string; footer?: ReactNode }) {
  const insets = useOverlayInsets();
  const identity = useContext(DependentIdentityContext);
  const [footerHeight, setFooterHeight] = useState(0);
  const base: ViewStyle = StyleSheet.flatten([screen.scroll, contentContainerStyle]);
  const bottom = Math.max(insets.bottom, footer ? footerHeight : 0);
  return (
    <Background>
      <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
        scrollIndicatorInsets={{ top: insets.top, bottom }} {...props}
        contentContainerStyle={[base, identity && { justifyContent: "flex-start" }, { paddingTop: insets.top + Number(base.paddingTop ?? base.padding ?? 16), paddingBottom: bottom + Number(base.paddingBottom ?? base.padding ?? 16) }]}>
        <DependentIdentity />
        {title ? <Text accessibilityRole="header" style={typography.section}>{title}</Text> : null}
        {children}
      </ScrollView>
      {footer ? <View pointerEvents="box-none" style={styles.footer} onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}>{footer}</View> : null}
    </Background>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#79BDA5" },
  transparent: { flex: 1, backgroundColor: "transparent" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
});
