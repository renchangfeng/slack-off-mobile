import { Text, View } from "react-native";
import { formatStepReceipt } from "./formatStepReceipt";
import styles from "../../styles";

export { formatStepReceipt };

export function StepReceipt({ summaries }: { summaries: string[] }) {
  const { visible, overflow } = formatStepReceipt(summaries);
  return (
    <View style={styles.activityResultReceipt}>
      <Text style={styles.kicker}>本次互动记录</Text>
      {visible.map((summary, index) => (
        <Text key={`${summary}-${index}`} style={styles.activityResultReceiptLine}>
          {summary}
        </Text>
      ))}
      {overflow > 0 ? (
        <Text style={styles.activityResultReceiptOverflow}>+{overflow} 项</Text>
      ) : null}
    </View>
  );
}
