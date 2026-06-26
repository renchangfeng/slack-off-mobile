import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ActivityPreviewCard,
  BrandManifestoCard,
  Pill,
  PrimaryButton,
  ProgressMeter,
  SignalTile,
  Surface
} from "../../ui/components";
import { activeTheme, brandVoice, colors, spacing, typography } from "../../ui/tokens";

type UiLabScreenProps = {
  onClose: () => void;
};

export function UiLabScreen({ onClose }: UiLabScreenProps) {
  return (
    <View style={styles.app}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>{brandVoice.name} UI Lab</Text>
          <Text style={styles.title}>{brandVoice.concept}</Text>
          <Text style={styles.subtitle}>
            年轻、抽象、但不闹眼睛。像一张允许你短暂离线的工位许可。
          </Text>
          <Text style={styles.themeMeta}>
            {activeTheme.name} / {activeTheme.iconStyle} / {activeTheme.targetViewport.minWidth}
            px+
          </Text>
        </View>

        <BrandManifestoCard />

        <Surface>
          <Text style={styles.sectionTitle}>Signals</Text>
          <View style={styles.tileRow}>
            <SignalTile
              label="今日卷度"
              value="37%"
              accentColor={colors.acid}
              tilted
            />
            <SignalTile label="离线权" value="已批准" accentColor={colors.cyan} />
            <SignalTile label="荒诞值" value="83" accentColor={colors.coral} tilted />
          </View>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.stack}>
            <PrimaryButton label="领取摸鱼任务" onPress={() => undefined} />
            <PrimaryButton label="深色操作" dark onPress={() => undefined} />
            <PrimaryButton label="不可点击状态" disabled onPress={() => undefined} />
          </View>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Pills</Text>
          <View style={styles.pillRow}>
            <Pill label="全部" selected />
            <Pill label="小游戏" />
            <Pill label="办公室表演" accentColor={colors.danger} selected />
          </View>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.stack}>
            <ProgressMeter label="今日目标" value={2} total={3} />
            <ProgressMeter label="抽豆进度" value={1} total={3} />
          </View>
        </Surface>

        <ActivityPreviewCard
          badge="水杯研究所"
          headline="凝视水杯，暂停世界"
          scene="这只杯子什么都不催，是难得的稳定同事。"
          prompt="盯住它 30 秒，不分析根因，不刷新消息。"
          statLabel="液体哲学"
          statValue="58%"
          tone="calm"
        />

        <ActivityPreviewCard
          badge="加载中演员"
          headline="表情进度条缓慢前进"
          scene="眉头轻皱，像是在等待一个非常重要的响应。"
          prompt="选择你的加载中表情，维持短短几秒，注意别演过头。"
          statLabel="表演可信度"
          statValue="83%"
          tone="absurd"
        />

        <PrimaryButton label="返回 App" dark onPress={onClose} />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1
  },
  container: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 96
  },
  header: {
    marginBottom: spacing.sm
  },
  brand: {
    color: colors.primary,
    ...typography.kicker
  },
  title: {
    color: colors.ink,
    marginTop: spacing.sm,
    ...typography.display
  },
  subtitle: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body
  },
  themeMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.md
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.title
  },
  stack: {
    gap: spacing.md
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  tileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  }
});
