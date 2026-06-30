import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuthSession } from "./src/auth/useAuthSession";
import { env } from "./src/config/env";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { UiLabScreen } from "./src/screens/dev/UiLabScreen";
import { colors, targetViewport } from "./src/ui/tokens";
import { useBrandName } from "./src/ui/useBrandName";
import { ThemeProvider } from "./src/ui/theme/ThemeProvider";

function AppContent() {
  const auth = useAuthSession();
  const [showUiLab, setShowUiLab] = useState(false);
  const brand = useBrandName();

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = brand;
    }
  }, [brand]);

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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const ROOT_HEIGHT = Platform.select({
  web: "100vh",
  default: "100%"
}) as `${number}%`;

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    backgroundColor: colors.background,
    flex: 1,
    height: ROOT_HEIGHT,
    maxWidth: targetViewport.maxContentWidth,
    overflow: "hidden",
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
