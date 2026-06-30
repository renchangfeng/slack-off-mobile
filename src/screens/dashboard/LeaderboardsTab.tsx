import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { EmptyState, SectionHeader } from "../../ui/components";
import { DashboardCard } from "./parts/DashboardCard";
import { ActionButton } from "./parts/SharedControls";
import {
  getLeaderboardList,
  getLeaderboardPodium,
  isLeaderboardCurrentUser,
  leaderboardScopes,
  leaderboardWindows
} from "./helpers";
import styles from "./styles";
import type { LeaderboardsTabProps } from "./types";

export function LeaderboardsTab({
  loading,
  leaderboardLoading,
  leaderboard,
  window,
  scope,
  social,
  socialInput,
  actions
}: LeaderboardsTabProps) {
  const podium = getLeaderboardPodium(leaderboard);
  const list = getLeaderboardList(leaderboard);

  return (
    <>
      <DashboardCard>
        <SectionHeader
          kicker="今日休息榜"
          title={`${social?.reactions.remainingToday ?? 0}/${social?.reactions.dailyLimit ?? 10} 次善意额度`}
        />
        <View style={styles.segmented}>
          {leaderboardScopes.map((scopeOption) => (
            <Pressable
              key={scopeOption.value}
              accessibilityRole="button"
              onPress={() => void actions.selectScope(scopeOption.value)}
              style={[styles.segment, scope === scopeOption.value && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  scope === scopeOption.value && styles.segmentTextActive
                ]}
              >
                {scopeOption.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.segmented}>
          {leaderboardWindows.map((windowOption) => (
            <Pressable
              key={windowOption.value}
              accessibilityRole="button"
              onPress={() => void actions.selectWindow(windowOption.value)}
              style={[
                styles.segment,
                window === windowOption.value && styles.segmentActive
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  window === windowOption.value && styles.segmentTextActive
                ]}
              >
                {windowOption.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.leaderboardBody}>
          {leaderboard?.items.length ? (
            <>
              <View style={styles.podiumRow}>
                {podium.map((item) => {
                  const isCurrentUser = isLeaderboardCurrentUser(item, leaderboard.currentUser);
                  const isFirstPlace = item.rank === 1;
                  return (
                    <View
                      key={`podium-${item.rank}-${item.userId ?? item.displayName}`}
                      style={[
                        styles.podiumCard,
                        isFirstPlace && styles.podiumCardFirst,
                        isCurrentUser && styles.podiumCardMine
                      ]}
                    >
                      <Text style={styles.podiumCrown}>{isFirstPlace ? "冠军" : `#${item.rank}`}</Text>
                      <Text style={styles.podiumAvatar}>{isFirstPlace ? "休" : "榜"}</Text>
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {item.displayName}
                        {isCurrentUser ? "（你）" : ""}
                      </Text>
                      <Text style={styles.podiumTitle} numberOfLines={1}>
                        {item.equippedBadge ?? item.equippedTitle ?? "认真摸鱼中"}
                      </Text>
                      <Text style={styles.podiumScore}>{item.score}</Text>
                    </View>
                  );
                })}
              </View>
              {list.map((item) => {
                const isCurrentUser = isLeaderboardCurrentUser(item, leaderboard.currentUser);
                return (
                  <View
                    key={`${item.rank}-${item.userId ?? item.displayName}`}
                    style={[styles.rankRow, isCurrentUser && styles.rankRowMine]}
                  >
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankNo}>#{item.rank}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>
                        {item.displayName}
                        {isCurrentUser ? "（你）" : ""}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {item.equippedBadge ?? item.equippedTitle ?? "认真摸鱼中"}
                      </Text>
                    </View>
                    <View style={styles.rankActions}>
                      <Text style={styles.rankScore}>{item.score}</Text>
                      {item.userId && item.userId !== leaderboard.currentUser?.userId ? (
                        <View style={styles.reactionRow}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => void actions.sendReaction(item.userId!, "tissue")}
                            style={styles.reactionButton}
                          >
                            <Text style={styles.reactionText}>纸 {item.reactions.tissue}</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => void actions.sendReaction(item.userId!, "like")}
                            style={styles.reactionButton}
                          >
                            <Text style={styles.reactionText}>赞 {item.reactions.like}</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <EmptyState
              title={
                leaderboard?.suppressed
                  ? leaderboard.suppressionReason === "COMPANY_TOO_SMALL"
                    ? "公司榜还差几位"
                    : "加入小队或公司后开始热闹"
                  : "榜单还空着"
              }
              body={
                leaderboard?.suppressed
                  ? leaderboard.suppressionReason === "COMPANY_TOO_SMALL"
                    ? "公司榜至少需要 3 位成员，避免一眼认出谁是谁。"
                    : "加入对应的小队或公司后，这里才会开始热闹。"
                  : "完成一次摸鱼活动，就能挤进前三名。"
              }
              icon="🐟"
            />
          )}
          <View style={styles.myRankSlot}>
            {leaderboard?.currentUser ? (
              <View style={styles.myRank}>
                <Text style={styles.myRankText}>
                  你现在第 {leaderboard.currentUser.rank} 名 ·{" "}
                  {leaderboard.currentUser.score} 分
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader kicker="轻社交" title={`好友码 ${social?.friendCode ?? "加载中"}`} />
        <Text style={styles.smallCopy}>
          没有私信，没有动态，只有排行和一点善意。今天已送{" "}
          {social?.reactions.sentToday ?? 0} 次。
        </Text>
        <TextInput
          accessibilityLabel="好友码、小队名或邀请码"
          autoCapitalize="characters"
          onChangeText={actions.setSocialInput}
          placeholder="输入好友码；小队名；或 #邀请码"
          placeholderTextColor="#8a8176"
          style={styles.socialInput}
          value={socialInput}
        />
        <View style={styles.socialActions}>
          <ActionButton
            label="加好友"
            disabled={loading || !socialInput.trim()}
            onPress={() => actions.submitSocialAction("friend")}
          />
          <ActionButton
            label="小队：新建/加入"
            disabled={loading || !socialInput.trim() || Boolean(social?.squad)}
            onPress={() => actions.submitSocialAction("squad")}
            dark
          />
          <ActionButton
            label="公司：新建/加入"
            disabled={loading || !socialInput.trim() || Boolean(social?.company)}
            onPress={() => actions.submitSocialAction("company")}
          />
        </View>
        <Text style={styles.kickerSection}>好友 {social?.friends.length ?? 0}</Text>
        {social?.friends.map((friend) => (
          <Text key={friend.userId} style={styles.rowMeta}>{friend.displayName}</Text>
        ))}
        {social?.squad ? (
          <>
            <Text style={styles.accentMeta}>
              小队：{social.squad.name} · #{social.squad.inviteCode} · {social.squad.memberCount} 人
            </Text>
            <ActionButton label="离开小队" onPress={() => actions.leaveGroup("squad")} dark />
          </>
        ) : null}
        {social?.company ? (
          <>
            <Text style={styles.accentMeta}>
              公司：{social.company.name} · 匿名身份 {social.company.anonymousAlias} · #
              {social.company.inviteCode}
            </Text>
            <ActionButton label="离开公司" onPress={() => actions.leaveGroup("company")} dark />
          </>
        ) : null}
      </DashboardCard>
    </>
  );
}
