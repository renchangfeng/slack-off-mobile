import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthSession } from "./src/auth/useAuthSession";
import { env } from "./src/config/env";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { UiLabScreen } from "./src/screens/dev/UiLabScreen";

export default function App() {
  const auth = useAuthSession();
  const [showUiLab, setShowUiLab] = useState(false);

  if (showUiLab && env.showUiLab) {
    return <UiLabScreen onClose={() => setShowUiLab(false)} />;
  }

  if (auth.mode === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#232323" />
        <Text style={styles.loadingText}>正在恢复摸鱼身份...</Text>
      </View>
    );
  }

  if (auth.mode === "signedOut" || auth.mode === "error") {
    return (
      <LoginScreen
        error={auth.error}
        onOpenUiLab={env.showUiLab ? () => setShowUiLab(true) : undefined}
        onSignInWithEmail={auth.signInWithEmail}
      />
    );
  }

  return (
    <HomeScreen
      authLabel={auth.mode === "development" ? "本地开发身份" : auth.email}
      getAccessToken={auth.getAccessToken}
      onOpenUiLab={env.showUiLab ? () => setShowUiLab(true) : undefined}
      onSignOut={auth.signOut}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#f6f1e8",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  loadingText: {
    color: "#5f574d",
    fontSize: 15,
    marginTop: 12
  }
});
