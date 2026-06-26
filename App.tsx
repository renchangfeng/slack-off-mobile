import { useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthSession } from "./src/auth/useAuthSession";
import { env } from "./src/config/env";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { UiLabScreen } from "./src/screens/dev/UiLabScreen";
import { colors, targetViewport } from "./src/ui/tokens";

export default function App() {
  const auth = useAuthSession();
  const [showUiLab, setShowUiLab] = useState(false);

  let content: ReactNode;
  if (showUiLab && env.showUiLab) {
    content = <UiLabScreen onClose={() => setShowUiLab(false)} />;
  } else if (auth.mode === "loading") {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>正在恢复摸鱼身份...</Text>
      </View>
    );
  } else if (auth.mode === "signedOut" || auth.mode === "error") {
    content = (
      <LoginScreen
        error={auth.error}
        onOpenUiLab={env.showUiLab ? () => setShowUiLab(true) : undefined}
        onSignInWithEmail={auth.signInWithEmail}
      />
    );
  } else {
    content = (
      <HomeScreen
        authLabel={auth.mode === "development" ? "本地开发身份" : auth.email}
        getAccessToken={auth.getAccessToken}
        onOpenUiLab={env.showUiLab ? () => setShowUiLab(true) : undefined}
        onSignOut={auth.signOut}
      />
    );
  }

  return <View style={styles.root}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    backgroundColor: colors.background,
    flex: 1,
    maxWidth: targetViewport.maxContentWidth,
    width: "100%"
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  loadingText: {
    color: colors.inkMuted,
    fontSize: 15,
    marginTop: 12
  }
});
