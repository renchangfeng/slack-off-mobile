import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BeanApi, type BeanCollection, type BeanDrawResult } from "../api/beans";
import { ApiClient } from "../api/client";
import { CheckInApi, type CheckInFinishResult, type CheckInSession } from "../api/checkins";
import {
  LeaderboardApi,
  type LeaderboardResponse,
  type LeaderboardWindow
} from "../api/leaderboards";
import { env } from "../config/env";

export function HomeScreen() {
  const { beans, checkIns, leaderboards } = useMemo(() => {
    const client = new ApiClient({
      baseUrl: env.apiBaseUrl
    });
    return {
      beans: new BeanApi(client),
      checkIns: new CheckInApi(client),
      leaderboards: new LeaderboardApi(client)
    };
  }, []);
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [beanCollection, setBeanCollection] = useState<BeanCollection | null>(null);
  const [beanDrawResult, setBeanDrawResult] = useState<BeanDrawResult | null>(null);
  const [lastResult, setLastResult] = useState<CheckInFinishResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>("daily");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshLeaderboard = useCallback(
    async (window: LeaderboardWindow = leaderboardWindow) => {
      const response = await leaderboards.getLeaderboard(window);
      if (response.error) {
        setMessage(response.error.message);
        return;
      }

      setLeaderboard(response.data);
    },
    [leaderboardWindow, leaderboards]
  );

  const refreshBeans = useCallback(async () => {
    const response = await beans.getCollection();
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setBeanCollection(response.data);
  }, [beans]);

  const refreshActive = useCallback(async () => {
    setLoading(true);
    const response = await checkIns.getActive();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setActiveSession(response.data);
    await refreshBeans();
    await refreshLeaderboard();
  }, [checkIns, refreshBeans, refreshLeaderboard]);

  useEffect(() => {
    void refreshActive();
  }, [refreshActive]);

  async function selectLeaderboardWindow(window: LeaderboardWindow) {
    setLeaderboardWindow(window);
    await refreshLeaderboard(window);
  }

  async function startSession() {
    setLoading(true);
    setMessage(null);
    setLastResult(null);
    const response = await checkIns.start();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setActiveSession(response.data);
  }

  async function finishSession() {
    if (!activeSession) {
      return;
    }

    setLoading(true);
    setMessage(null);
    const response = await checkIns.finish(activeSession.id);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setActiveSession(null);
    setLastResult(response.data);
    await refreshBeans();
    await refreshLeaderboard();
  }

  async function drawBean() {
    setLoading(true);
    setMessage(null);
    const response = await beans.draw();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setBeanDrawResult(response.data);
    await refreshBeans();
  }

  const elapsedLabel = activeSession ? formatDuration(activeSession.startedAt) : "00:00";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Slack Off</Text>
        <Text style={styles.subtitle}>带薪休息一下，世界不会塌。</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.kicker}>当前打卡</Text>
        <Text style={styles.timer}>{elapsedLabel}</Text>
        <Text style={styles.copy}>
          {activeSession
            ? "正在认真休息。保持镇定，像是在排查线上问题。"
            : "没有进行中的打卡。可以开始一次庄严的带薪摸鱼。"}
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={loading || Boolean(activeSession)}
            onPress={startSession}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || loading || activeSession) && styles.buttonMuted
            ]}
          >
            <Text style={styles.primaryButtonText}>开始</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={loading || !activeSession}
            onPress={finishSession}
            style={({ pressed }) => [
              styles.secondaryButton,
              (pressed || loading || !activeSession) && styles.buttonMuted
            ]}
          >
            <Text style={styles.secondaryButtonText}>结束</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color="#232323" style={styles.loader} /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      {lastResult ? (
        <View style={styles.summary}>
          <Text style={styles.kicker}>结算</Text>
          <Text style={styles.summaryTitle}>
            {lastResult.reward.rewarded ? "这次休息有被系统承认" : "这次休息太短，系统假装没看见"}
          </Text>
          <Text style={styles.summaryLine}>得分 +{lastResult.reward.score}</Text>
          <Text style={styles.summaryLine}>抽豆进度 +{lastResult.reward.drawProgress}</Text>
          <Text style={styles.summaryLine}>
            抽豆机会 +{lastResult.reward.drawChancesGranted ?? 0}
          </Text>
        </View>
      ) : null}

      <View style={styles.beans}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.kicker}>拼豆模式</Text>
          <Text style={styles.leaderboardTitle}>抽一颗工位命运豆</Text>
        </View>
        <Text style={styles.copy}>
          机会 {beanCollection?.drawChances ?? 0} 次，进度 {beanCollection?.drawProgress ?? 0}/3
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={loading || (beanCollection?.drawChances ?? 0) <= 0}
          onPress={drawBean}
          style={({ pressed }) => [
            styles.drawButton,
            (pressed || loading || (beanCollection?.drawChances ?? 0) <= 0) && styles.buttonMuted
          ]}
        >
          <Text style={styles.primaryButtonText}>抽豆</Text>
        </Pressable>

        {beanDrawResult ? (
          <View style={styles.beanReveal}>
            <Text style={styles.beanName}>{beanDrawResult.bean.name}</Text>
            <Text style={styles.beanMeta}>
              {rarityLabel(beanDrawResult.bean.rarity)}
              {beanDrawResult.duplicate ? " · 重复也算缘分" : " · 新豆入袋"}
            </Text>
            <Text style={styles.beanDescription}>{beanDrawResult.bean.description}</Text>
          </View>
        ) : null}

        <View style={styles.beanGrid}>
          {beanCollection?.beans.map((bean) => (
            <View key={bean.id} style={[styles.beanTile, bean.owned && styles.beanTileOwned]}>
              <Text style={styles.beanTileName}>{bean.name}</Text>
              <Text style={styles.beanTileMeta}>
                {rarityLabel(bean.rarity)} · x{bean.quantity}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.leaderboard}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.kicker}>排行榜</Text>
          <Text style={styles.leaderboardTitle}>今天谁最会休息</Text>
        </View>
        <View style={styles.tabs}>
          {leaderboardWindows.map((window) => (
            <Pressable
              key={window.value}
              accessibilityRole="button"
              onPress={() => void selectLeaderboardWindow(window.value)}
              style={[
                styles.tab,
                leaderboardWindow === window.value && styles.tabActive
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  leaderboardWindow === window.value && styles.tabTextActive
                ]}
              >
                {window.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {leaderboard?.items.length ? (
          leaderboard.items.map((item) => (
            <View key={`${item.rank}-${item.userId}`} style={styles.rankRow}>
              <Text style={styles.rankNo}>#{item.rank}</Text>
              <View style={styles.rankUser}>
                <Text style={styles.rankName}>{item.displayName}</Text>
                <Text style={styles.rankBadge}>
                  {item.equippedBadge ?? item.equippedTitle ?? "认真摸鱼中"}
                </Text>
              </View>
              <Text style={styles.rankScore}>{item.score}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>榜单还空着，等第一个人勇敢坐下。</Text>
        )}

        {leaderboard?.currentUser ? (
          <View style={styles.myRank}>
            <Text style={styles.myRankText}>
              你现在第 {leaderboard.currentUser.rank} 名，分数 {leaderboard.currentUser.score}
            </Text>
          </View>
        ) : null}
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

function rarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: "普通",
    uncommon: "少见",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说"
  };

  return labels[rarity] ?? rarity;
}

const leaderboardWindows: Array<{ value: LeaderboardWindow; label: string }> = [
  { value: "daily", label: "日" },
  { value: "weekly", label: "周" },
  { value: "monthly", label: "月" },
  { value: "all_time", label: "总" }
];

function formatDuration(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f6f1e8",
    padding: 20,
    paddingTop: 72
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
  timer: {
    color: "#232323",
    fontSize: 60,
    fontWeight: "900",
    marginTop: 10
  },
  copy: {
    color: "#3f3a34",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1f8f62",
    borderRadius: 8,
    flex: 1,
    minHeight: 52,
    justifyContent: "center"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 8,
    flex: 1,
    minHeight: 52,
    justifyContent: "center"
  },
  buttonMuted: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  loader: {
    marginTop: 16
  },
  message: {
    color: "#a23b3b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14
  },
  summary: {
    backgroundColor: "#e5f4ed",
    borderColor: "#1f8f62",
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 18,
    padding: 18
  },
  summaryTitle: {
    color: "#1d3d31",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8
  },
  summaryLine: {
    color: "#24483a",
    fontSize: 16,
    marginTop: 8
  },
  beans: {
    backgroundColor: "#fffdf8",
    borderColor: "#1f8f62",
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 18,
    padding: 18
  },
  drawButton: {
    alignItems: "center",
    backgroundColor: "#1f8f62",
    borderRadius: 8,
    minHeight: 50,
    justifyContent: "center",
    marginTop: 16
  },
  beanReveal: {
    backgroundColor: "#e5f4ed",
    borderRadius: 8,
    marginTop: 14,
    padding: 14
  },
  beanName: {
    color: "#1d3d31",
    fontSize: 20,
    fontWeight: "900"
  },
  beanMeta: {
    color: "#45725d",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4
  },
  beanDescription: {
    color: "#24483a",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  beanGrid: {
    gap: 10,
    marginTop: 14
  },
  beanTile: {
    borderColor: "#e5ded3",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12
  },
  beanTileOwned: {
    backgroundColor: "#f0fbf5",
    borderColor: "#1f8f62"
  },
  beanTileName: {
    color: "#232323",
    fontSize: 15,
    fontWeight: "900"
  },
  beanTileMeta: {
    color: "#746b60",
    fontSize: 13,
    marginTop: 3
  },
  leaderboard: {
    backgroundColor: "#fffdf8",
    borderColor: "#232323",
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 18,
    padding: 18
  },
  leaderboardHeader: {
    gap: 6
  },
  leaderboardTitle: {
    color: "#232323",
    fontSize: 22,
    fontWeight: "900"
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16
  },
  tab: {
    alignItems: "center",
    borderColor: "#c4b9a8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center"
  },
  tabActive: {
    backgroundColor: "#232323",
    borderColor: "#232323"
  },
  tabText: {
    color: "#5f574d",
    fontSize: 14,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#ffffff"
  },
  rankRow: {
    alignItems: "center",
    borderTopColor: "#e5ded3",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 62,
    paddingVertical: 10
  },
  rankNo: {
    color: "#1f8f62",
    fontSize: 18,
    fontWeight: "900",
    width: 44
  },
  rankUser: {
    flex: 1
  },
  rankName: {
    color: "#232323",
    fontSize: 16,
    fontWeight: "800"
  },
  rankBadge: {
    color: "#746b60",
    fontSize: 13,
    marginTop: 3
  },
  rankScore: {
    color: "#232323",
    fontSize: 20,
    fontWeight: "900"
  },
  emptyText: {
    color: "#746b60",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 18
  },
  myRank: {
    backgroundColor: "#f6f1e8",
    borderRadius: 8,
    marginTop: 14,
    padding: 12
  },
  myRankText: {
    color: "#3f3a34",
    fontSize: 14,
    fontWeight: "800"
  }
});
