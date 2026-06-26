import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type LoginScreenProps = {
  error?: string;
  onOpenUiLab?: () => void;
  onSignInWithEmail: (email: string) => Promise<{ ok: boolean; message: string }>;
};

export function LoginScreen({ error, onOpenUiLab, onSignInWithEmail }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(error ?? null);

  async function submit() {
    setLoading(true);
    setMessage(null);
    const result = await onSignInWithEmail(email);
    setLoading(false);
    setMessage(result.message);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Slack Off</Text>
        <Text style={styles.subtitle}>先登录，再认真地不那么认真。</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.kicker}>邮箱登录</Text>
        <Text style={styles.copy}>
          输入邮箱获取一次性登录入口。你的摸鱼豆、成就和排行榜身份会跟着账号走。
        </Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#9b9186"
          style={styles.input}
          value={email}
        />
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={submit}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || loading) && styles.buttonMuted
          ]}
        >
          <Text style={styles.primaryButtonText}>发送登录邮件</Text>
        </Pressable>
        {loading ? <ActivityIndicator color="#232323" style={styles.loader} /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {onOpenUiLab ? (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenUiLab}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>打开 UI Lab</Text>
          </Pressable>
        ) : null}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f6f1e8",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  header: {
    marginBottom: 28
  },
  title: {
    color: "#232323",
    fontSize: 38,
    fontWeight: "900"
  },
  subtitle: {
    color: "#5f574d",
    fontSize: 16,
    marginTop: 8
  },
  panel: {
    backgroundColor: "#fffdf8",
    borderColor: "#232323",
    borderRadius: 8,
    borderWidth: 2,
    padding: 20
  },
  kicker: {
    color: "#786d60",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  copy: {
    color: "#3f3a34",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d7cdbc",
    borderRadius: 8,
    borderWidth: 1,
    color: "#232323",
    fontSize: 16,
    marginTop: 18,
    minHeight: 52,
    paddingHorizontal: 14
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1f8f62",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 52
  },
  buttonMuted: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#232323",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 12
  },
  secondaryButtonText: {
    color: "#232323",
    fontSize: 14,
    fontWeight: "900"
  },
  loader: {
    marginTop: 16
  },
  message: {
    color: "#8b4d36",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14
  }
});
