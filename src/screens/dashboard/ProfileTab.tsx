import { ScrollView, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import {
  EmptyState,
  IconTile,
  PrimaryButton,
  SectionHeader
} from "../../ui/components";
import { colors } from "../../ui/tokens";
import {
  AchievementFocusCard,
  AchievementRecommendationSection,
  AchievementWallRow
} from "./parts/GoalPanels";
import { CategoryChip } from "./parts/SharedControls";
import { DashboardCard } from "./parts/DashboardCard";
import { CosmeticRewardRow, LifetimeStats } from "./parts/ProfileRewards";
import { achievementCategories, achievementCategoryLabel, pickAchievementFocus } from "./helpers";
import styles from "./styles";
import type { ProfileTabProps } from "./types";

function IdentityCard({
  authLabel,
  progression,
  equippedTitle,
  equippedBadge
}: {
  authLabel?: string;
  progression: ProfileTabProps["progression"];
  equippedTitle: string | null;
  equippedBadge: string | null;
}) {
  return (
    <DashboardCard>
      <IconTile size={64} accent={colors.gold} style={styles.profileLevelTile}>
        <Text style={styles.profileLevelText}>LV {progression?.level ?? 1}</Text>
      </IconTile>
      <View style={styles.flex}>
        <Text style={styles.profileName}>{authLabel ?? "摸鱼同学"}</Text>
        <Text style={styles.rowMeta}>
          连续休息 {progression?.currentStreakDays ?? 0} 天 · 最长{" "}
          {progression?.longestStreakDays ?? 0} 天
        </Text>
        <Text style={styles.accentMeta}>
          {equippedTitle ? `称号：${equippedTitle}` : "称号：还没装备"} ·{" "}
          {equippedBadge ? `徽章：${equippedBadge}` : "徽章：还没装备"}
        </Text>
      </View>
    </DashboardCard>
  );
}

function OverviewMode(props: ProfileTabProps) {
  const { authLabel, progression, achievementList, cosmeticInventory, actions } = props;
  const achievementFocus = pickAchievementFocus(achievementList);
  const unlockedAchievements =
    achievementList?.achievements.filter((achievement) => achievement.unlockedAt) ?? [];
  const equippedTitle = cosmeticInventory?.equippedTitle?.name ?? null;
  const equippedBadge = cosmeticInventory?.equippedBadge?.name ?? null;

  return (
    <>
      <IdentityCard
        authLabel={authLabel}
        progression={progression}
        equippedTitle={equippedTitle}
        equippedBadge={equippedBadge}
      />
      <LifetimeStats progression={progression} />
      <DashboardCard>
        <SectionHeader kicker="休息连续性" title={`已连续 ${progression?.currentStreakDays ?? 0} 天`} />
        <Text style={styles.copy}>
          最长记录 {progression?.longestStreakDays ?? 0} 天。漏掉一天不会扣分，也不需要付费恢复，想起来时继续就好。
        </Text>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader kicker="目标板" title="今天别乱卷，挑一个顺手的" />
        <AchievementFocusCard
          achievement={achievementFocus}
          unlockedCount={unlockedAchievements.length}
          totalCount={achievementList?.achievements.length ?? 0}
          onPress={actions.jumpToAchievementTarget}
        />
        <Text style={styles.kickerSection}>近期进展</Text>
        <Text style={styles.rowMeta}>
          今日目标 {progression?.dailyGoals.completed ?? 0}/
          {progression?.dailyGoals.total ?? 3} · 本周目标{" "}
          {progression?.weeklyGoals.completed ?? 0}/
          {progression?.weeklyGoals.total ?? 3} · 成就解锁{" "}
          {unlockedAchievements.length}/{achievementList?.achievements.length ?? 0}
        </Text>
      </DashboardCard>
    </>
  );
}

function AchievementsMode(props: ProfileTabProps) {
  const { achievementList, categoryFilter, actions } = props;
  const achievementFocus = pickAchievementFocus(achievementList);
  const unlockedAchievements =
    achievementList?.achievements.filter((achievement) => achievement.unlockedAt) ?? [];
  const sortedAchievements = [...(achievementList?.achievements ?? [])].sort((left, right) => {
    if (Boolean(left.unlockedAt) !== Boolean(right.unlockedAt)) {
      return left.unlockedAt ? 1 : -1;
    }
    return right.progress.percent - left.progress.percent;
  });
  const filteredAchievements = sortedAchievements.filter(
    (achievement) => categoryFilter === "all" || achievement.category === categoryFilter
  );
  const secondaryAchievementRecommendations = achievementList
    ? [
        ...achievementList.recommendations.nearest,
        ...achievementList.recommendations.today,
        ...achievementList.recommendations.long_term
      ].filter((achievement) => achievement.id !== achievementFocus?.id)
    : [];

  return (
    <>
      <DashboardCard>
        <SectionHeader kicker="目标板" title="今天别乱卷，挑一个顺手的" />
        <AchievementFocusCard
          achievement={achievementFocus}
          unlockedCount={unlockedAchievements.length}
          totalCount={achievementList?.achievements.length ?? 0}
          onPress={actions.jumpToAchievementTarget}
        />
        <Text style={styles.kickerSection}>推荐追逐目标</Text>
        <AchievementRecommendationSection
          title="离你最近"
          items={achievementList?.recommendations?.nearest ?? []}
          focusId={achievementFocus?.id}
          onPress={actions.jumpToAchievementTarget}
        />
        <AchievementRecommendationSection
          title="今天顺手能做"
          items={achievementList?.recommendations?.today ?? []}
          focusId={achievementFocus?.id}
          onPress={actions.jumpToAchievementTarget}
        />
        <AchievementRecommendationSection
          title="长期目标"
          items={achievementList?.recommendations?.long_term ?? []}
          focusId={achievementFocus?.id}
          onPress={actions.jumpToAchievementTarget}
        />
        {!achievementFocus && !secondaryAchievementRecommendations.length ? (
          <View style={{ alignItems: "center" }}>
            <ArtSlot slotId="empty-state-generic" size={72} style={{ marginBottom: 12 }} />
            <EmptyState
              title="今天没有催你的目标"
              body="成就板很安静，你已经把休息做得挺像回事了。"
              icon="🌿"
            />
          </View>
        ) : null}
      </DashboardCard>
      <DashboardCard>
        <SectionHeader
          kicker="成就墙"
          title={`已解锁 ${unlockedAchievements.length}/${achievementList?.achievements.length ?? 0}`}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="全部"
            selected={categoryFilter === "all"}
            onPress={() => actions.setCategoryFilter("all")}
          />
          {achievementCategories.map((category) => (
            <CategoryChip
              key={category}
              label={achievementCategoryLabel(category)}
              selected={categoryFilter === category}
              onPress={() => actions.setCategoryFilter(category)}
            />
          ))}
        </ScrollView>
        {filteredAchievements.length ? (
          filteredAchievements.map((achievement) => (
            <AchievementWallRow key={achievement.id} achievement={achievement} />
          ))
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot slotId="achievement-badge" size={64} style={{ marginBottom: 12 }} />
            <EmptyState
              title="这个分类还没有成就"
              body="完成任意一个活动来解锁第一枚徽章"
              icon="🎖️"
            />
          </View>
        )}
      </DashboardCard>
    </>
  );
}

function RewardsMode(props: ProfileTabProps) {
  const { cosmeticInventory, actions } = props;
  return (
    <>
      <DashboardCard>
        <SectionHeader kicker="徽章与称号" title="奖励墙" />
        {cosmeticInventory?.cosmetics.length ? (
          cosmeticInventory.cosmetics.map((cosmetic) => (
            <CosmeticRewardRow
              key={cosmetic.id}
              cosmetic={cosmetic}
              loading={false}
              onEquip={actions.equipCosmetic}
            />
          ))
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot slotId="empty-state-profile" size={72} style={{ marginBottom: 12 }} />
            <EmptyState
              title="还没有装扮"
              body="先认真完成几次休息，再来挑一个喜欢的称号"
              icon="✨"
            />
          </View>
        )}
      </DashboardCard>
      <PrimaryButton label="退出当前账号" dark onPress={() => void actions.signOut()} />
    </>
  );
}

export function ProfileTab(props: ProfileTabProps) {
  if (props.mode === "achievements") {
    return (
      <View onLayout={(event) => props.onLandingLayout("achievement", event.nativeEvent.layout.y)}>
        <AchievementsMode {...props} />
      </View>
    );
  }
  if (props.mode === "rewards") {
    return (
      <View onLayout={(event) => props.onLandingLayout("cosmetic", event.nativeEvent.layout.y)}>
        <RewardsMode {...props} />
      </View>
    );
  }
  return <OverviewMode {...props} />;
}
