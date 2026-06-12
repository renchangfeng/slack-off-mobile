import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AchievementApi,
  type AchievementList,
  type CosmeticInventory
} from "../api/achievements";
import {
  ActivityApi,
  type ActivityAssignment,
  type ActivityCompleteResult
} from "../api/activities";
import { BeanApi, type BeanCollection, type BeanDrawResult } from "../api/beans";
import { ApiClient } from "../api/client";
import { CheckInApi, type CheckInFinishResult, type CheckInSession } from "../api/checkins";
import {
  LeaderboardApi,
  type LeaderboardResponse,
  type LeaderboardWindow
} from "../api/leaderboards";
import { env } from "../config/env";
import { logEvent } from "../observability/logger";

type HomeScreenProps = {
  authLabel?: string;
  getAccessToken: () => Promise<string | null>;
  onSignOut: () => Promise<void>;
};

export function HomeScreen({ authLabel, getAccessToken, onSignOut }: HomeScreenProps) {
  const { achievements, activities, beans, checkIns, leaderboards } = useMemo(() => {
    const client = new ApiClient({
      baseUrl: env.apiBaseUrl,
      getAccessToken
    });
    return {
      achievements: new AchievementApi(client),
      activities: new ActivityApi(client),
      beans: new BeanApi(client),
      checkIns: new CheckInApi(client),
      leaderboards: new LeaderboardApi(client)
    };
  }, [getAccessToken]);
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [beanCollection, setBeanCollection] = useState<BeanCollection | null>(null);
  const [beanDrawResult, setBeanDrawResult] = useState<BeanDrawResult | null>(null);
  const [lastResult, setLastResult] = useState<CheckInFinishResult | null>(null);
  const [achievementList, setAchievementList] = useState<AchievementList | null>(null);
  const [activityAssignment, setActivityAssignment] = useState<ActivityAssignment | null>(null);
  const [activityResult, setActivityResult] = useState<ActivityCompleteResult | null>(null);
  const [cosmeticInventory, setCosmeticInventory] = useState<CosmeticInventory | null>(null);
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
      logEvent("info", "analytics.leaderboard.viewed", {
        screen: "home",
        window,
        itemCount: response.data?.items.length ?? 0
      });
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

  const refreshAchievements = useCallback(async () => {
    const [achievementResponse, cosmeticResponse] = await Promise.all([
      achievements.getAchievements(),
      achievements.getCosmetics()
    ]);

    if (achievementResponse.error) {
      setMessage(achievementResponse.error.message);
      return;
    }

    if (cosmeticResponse.error) {
      setMessage(cosmeticResponse.error.message);
      return;
    }

    setAchievementList(achievementResponse.data);
    setCosmeticInventory(cosmeticResponse.data);
    logEvent("info", "analytics.achievements.viewed", {
      screen: "home",
      unlockedCount:
        achievementResponse.data?.achievements.filter((achievement) => achievement.unlockedAt)
          .length ?? 0,
      cosmeticCount: cosmeticResponse.data?.cosmetics.length ?? 0
    });
  }, [achievements]);

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
    await refreshAchievements();
    await refreshLeaderboard();
  }, [checkIns, refreshAchievements, refreshBeans, refreshLeaderboard]);

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
    logEvent("info", "analytics.checkin.started", {
      screen: "home",
      sessionId: response.data?.id
    });
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
    logEvent("info", "analytics.checkin.finished", {
      screen: "home",
      rewarded: response.data?.reward.rewarded,
      score: response.data?.reward.score,
      achievementsUnlocked: response.data?.reward.achievementsUnlocked?.length ?? 0
    });
    logAchievementUnlocks(response.data?.reward.achievementsUnlocked ?? []);
    await refreshBeans();
    await refreshAchievements();
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
    logEvent("info", "analytics.bean.drawn", {
      screen: "home",
      beanCode: response.data?.bean.code,
      rarity: response.data?.bean.rarity,
      duplicate: response.data?.duplicate,
      achievementsUnlocked: response.data?.achievementsUnlocked?.length ?? 0
    });
    logAchievementUnlocks(response.data?.achievementsUnlocked ?? []);
    await refreshBeans();
    await refreshAchievements();
  }

  async function randomActivity() {
    setLoading(true);
    setMessage(null);
    setActivityResult(null);
    const response = await activities.random();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setActivityAssignment(response.data);
    logEvent("info", "analytics.activity.assigned", {
      screen: "home",
      assignmentId: response.data?.assignmentId,
      difficulty: response.data?.difficulty
    });
  }

  async function completeActivity() {
    if (!activityAssignment) {
      return;
    }

    setLoading(true);
    setMessage(null);
    const response = await activities.complete(activityAssignment.assignmentId);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (!response.data) {
      setMessage("活动结果走丢了，像一个临时会议邀请。");
      return;
    }

    setActivityResult(response.data);
    setActivityAssignment(response.data.assignment);
    logEvent("info", "analytics.activity.completed", {
      screen: "home",
      assignmentId: response.data.assignment.assignmentId,
      rewarded: response.data.reward.rewarded,
      score: response.data.reward.score,
      reason: response.data.reward.reason,
      achievementsUnlocked: response.data.reward.achievementsUnlocked.length
    });
    logAchievementUnlocks(response.data.reward.achievementsUnlocked);
    await refreshBeans();
    await refreshAchievements();
    await refreshLeaderboard();
  }

  async function equipCosmetic(id: string) {
    setLoading(true);
    setMessage(null);
    const response = await achievements.equipCosmetic(id);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    await refreshAchievements();
    await refreshLeaderboard();
    logEvent("info", "analytics.cosmetic.equipped", {
      screen: "home",
      cosmeticId: response.data?.cosmetic.id,
      cosmeticType: response.data?.cosmetic.cosmeticType
    });
  }

  const elapsedLabel = activeSession ? formatDuration(activeSession.startedAt) : "00:00";
  const unlockedAchievements =
    achievementList?.achievements.filter((achievement) => achievement.unlockedAt) ?? [];
  const recentUnlocks = [
    ...(lastResult?.reward.achievementsUnlocked ?? []),
    ...(beanDrawResult?.achievementsUnlocked ?? [])
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>Slack Off</Text>
            <Text style={styles.subtitle}>带薪休息一下，世界不会塌。</Text>
            {authLabel ? <Text style={styles.authLabel}>{authLabel}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onSignOut()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonMuted]}
          >
            <Text style={styles.signOutText}>退出</Text>
          </Pressable>
        </View>
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

      {recentUnlocks.length ? (
        <View style={styles.unlockPanel}>
          <Text style={styles.kicker}>刚刚解锁</Text>
          {recentUnlocks.map((achievement) => (
            <View key={achievement.id} style={styles.unlockItem}>
              <Text style={styles.unlockTitle}>{achievement.name}</Text>
              <Text style={styles.unlockMeta}>
                +{achievement.rewards.score} 分
                {achievement.rewards.cosmetic ? ` · ${achievement.rewards.cosmetic}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

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

      <View style={styles.activities}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.kicker}>随机摸鱼活动</Text>
          <Text style={styles.leaderboardTitle}>系统批准你离线一下</Text>
        </View>
        {activityAssignment ? (
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>{activityAssignment.title}</Text>
            <Text style={styles.activityDescription}>{activityAssignment.description}</Text>
            <Text style={styles.activityMeta}>
              {difficultyLabel(activityAssignment.difficulty)} · +{activityAssignment.rewardPreview.score} 分 · 抽豆进度 +{activityAssignment.rewardPreview.drawProgress}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={loading || activityAssignment.status !== "active"}
              onPress={completeActivity}
              style={({ pressed }) => [
                styles.activityButton,
                (pressed || loading || activityAssignment.status !== "active") && styles.buttonMuted
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {activityAssignment.status === "active" ? "完成活动" : "已完成"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.copy}>抽一个不会改变世界、但能拯救表情管理的小任务。</Text>
        )}

        {activityResult ? (
          <View style={styles.activityResult}>
            <Text style={styles.summaryLine}>
              活动奖励 +{activityResult.reward.score} 分，抽豆进度 +{activityResult.reward.drawProgress}
            </Text>
            {activityResult.reward.reason ? (
              <Text style={styles.beanTileMeta}>今日奖励上限已到，精神胜利仍然有效。</Text>
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={randomActivity}
          style={({ pressed }) => [
            styles.drawButton,
            (pressed || loading) && styles.buttonMuted
          ]}
        >
          <Text style={styles.primaryButtonText}>换个摸鱼任务</Text>
        </Pressable>
      </View>

      <View style={styles.achievements}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.kicker}>成就与徽章</Text>
          <Text style={styles.leaderboardTitle}>给摸鱼一点仪式感</Text>
        </View>
        <Text style={styles.copy}>
          已解锁 {unlockedAchievements.length}/{achievementList?.achievements.length ?? 0}
        </Text>

        <View style={styles.achievementList}>
          {achievementList?.achievements.slice(0, 5).map((achievement) => (
            <View
              key={achievement.id}
              style={[styles.achievementRow, achievement.unlockedAt && styles.achievementUnlocked]}
            >
              <View style={styles.rankUser}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
              <Text style={styles.achievementState}>
                {achievement.unlockedAt ? "已解锁" : "未解锁"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.cosmeticList}>
          {cosmeticInventory?.cosmetics.length ? (
            cosmeticInventory.cosmetics.map((cosmetic) => (
              <Pressable
                key={cosmetic.id}
                accessibilityRole="button"
                disabled={loading || cosmetic.equipped}
                onPress={() => void equipCosmetic(cosmetic.id)}
                style={({ pressed }) => [
                  styles.cosmeticChip,
                  cosmetic.equipped && styles.cosmeticChipEquipped,
                  (pressed || loading) && styles.buttonMuted
                ]}
              >
                <Text style={styles.cosmeticName}>{cosmetic.name}</Text>
                <Text style={styles.cosmeticMeta}>
                  {cosmetic.cosmeticType === "badge" ? "徽章" : "称号"} ·{" "}
                  {cosmetic.equipped ? "使用中" : "装备"}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>还没有徽章，先完成一次庄重的带薪休息。</Text>
          )}
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

function difficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: "轻松",
    normal: "正常",
    hard: "硬核"
  };

  return labels[difficulty] ?? difficulty;
}

function logAchievementUnlocks(
  achievements: Array<{
    id: string;
    code: string;
    name: string;
  }>
) {
  for (const achievement of achievements) {
    logEvent("info", "analytics.achievement.unlocked", {
      screen: "home",
      achievementId: achievement.id,
      achievementCode: achievement.code,
      achievementName: achievement.name
    });
  }
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
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  headerTitleGroup: {
    flex: 1
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
  authLabel: {
    color: "#786d60",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  signOutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
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
  unlockPanel: {
    backgroundColor: "#232323",
    borderRadius: 8,
    marginTop: 18,
    padding: 18
  },
  unlockItem: {
    borderTopColor: "#4a4a4a",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12
  },
  unlockTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  unlockMeta: {
    color: "#b7e4cd",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
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
  activities: {
    backgroundColor: "#fffdf8",
    borderColor: "#2f6f8f",
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 18,
    padding: 18
  },
  activityCard: {
    backgroundColor: "#eef8fc",
    borderColor: "#9ccfe0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14
  },
  activityTitle: {
    color: "#1b3340",
    fontSize: 19,
    fontWeight: "900"
  },
  activityDescription: {
    color: "#365260",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  activityMeta: {
    color: "#2f6f8f",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10
  },
  activityButton: {
    alignItems: "center",
    backgroundColor: "#2f6f8f",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    marginTop: 14
  },
  activityResult: {
    backgroundColor: "#f6f1e8",
    borderRadius: 8,
    marginTop: 12,
    padding: 12
  },
  achievements: {
    backgroundColor: "#fffdf8",
    borderColor: "#8b4d36",
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 18,
    padding: 18
  },
  achievementList: {
    gap: 10,
    marginTop: 16
  },
  achievementRow: {
    borderColor: "#e5ded3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  achievementUnlocked: {
    backgroundColor: "#fff5df",
    borderColor: "#c98825"
  },
  achievementName: {
    color: "#232323",
    fontSize: 15,
    fontWeight: "900"
  },
  achievementDescription: {
    color: "#746b60",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  achievementState: {
    color: "#8b4d36",
    fontSize: 13,
    fontWeight: "900",
    width: 54
  },
  cosmeticList: {
    gap: 10,
    marginTop: 14
  },
  cosmeticChip: {
    backgroundColor: "#f6f1e8",
    borderColor: "#c4b9a8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12
  },
  cosmeticChipEquipped: {
    backgroundColor: "#e5f4ed",
    borderColor: "#1f8f62"
  },
  cosmeticName: {
    color: "#232323",
    fontSize: 15,
    fontWeight: "900"
  },
  cosmeticMeta: {
    color: "#746b60",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4
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
