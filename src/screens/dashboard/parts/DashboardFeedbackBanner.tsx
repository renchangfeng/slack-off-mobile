import { Pressable, Text, View } from "react-native";
import type { DashboardFeedback } from "../dashboardCoherence";
import styles from "../styles";

export function DashboardFeedbackBanner({
  feedback,
  onDismiss
}: {
  feedback: DashboardFeedback;
  onDismiss: () => void;
}) {
  const isError = feedback.kind === "error";

  return (
    <View
      accessibilityLiveRegion={isError ? "assertive" : "polite"}
      style={[
        styles.feedbackBanner,
        isError ? styles.feedbackBannerError : styles.feedbackBannerNotice
      ]}
    >
      <Text
        style={isError ? styles.feedbackBannerErrorText : styles.feedbackBannerNoticeText}
      >
        {feedback.message}
      </Text>
      {isError ? (
        <Pressable
          accessibilityLabel="关闭错误提示"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.feedbackDismiss,
            pressed && styles.feedbackDismissPressed
          ]}
        >
          <Text style={styles.feedbackDismissText}>关闭</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
