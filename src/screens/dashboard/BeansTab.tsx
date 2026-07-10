import { Pressable, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { EmptyState, RewardRow, SectionHeader, StatusBadge } from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import { ActionButton, ProgressBar } from "./parts/SharedControls";
import { GoalBanner } from "./parts/GoalPanels";
import { FishTankCard } from "./parts/FishTankCard";
import {
  beanRarities,
  beanThemeLabel,
  beanThemes,
  rarityLabel,
  resourceIcon
} from "./helpers";
import styles from "./styles";
import type { BeansTabProps } from "./types";

export function BeansTab({
  loading,
  goal,
  collection,
  drawResult,
  selectedTheme,
  showcasePosition,
  nextStep,
  todayLoop,
  fishTank,
  fishTankLoading,
  fishTankError,
  fishTankResultCopy,
  hatchResult,
  hatchError,
  hatchLoading,
  actions
}: BeansTabProps) {
  const beanDelight =
    todayLoop.resultDelight?.kind === "bean-draw" ? todayLoop.resultDelight : null;
  return (
    <>
      <GoalBanner goal={goal} />
      <FishTankCard
        loading={fishTankLoading}
        summary={fishTank}
        error={fishTankError}
        resultCopy={fishTankResultCopy}
        hatchResult={hatchResult}
        hatchError={hatchError}
        hatchLoading={hatchLoading}
        onInitialize={actions.initializeTank}
        onFeed={actions.feedFish}
        onHatch={actions.hatchFish}
        onDismissHatchResult={actions.dismissHatchResult}
        onRetry={actions.refreshFishTank}
      />
      <DashboardCard>
        <SectionHeader kicker="抽豆账户" title={`${collection?.drawChances ?? 0} 次机会`} />
        <Text style={styles.copy}>
          当前进度 {collection?.drawProgress ?? 0}/3。每满 3 点自动兑换一次机会。
        </Text>
        {todayLoop.drawChanceSource ? (
          <Text style={styles.helperText}>
            {beanChanceSourceText(todayLoop.drawChanceSource)}
          </Text>
        ) : null}
        <View style={styles.beanCollectionSummary}>
          <View style={styles.flex}>
            <Text style={styles.kickerSection}>图鉴完成度</Text>
            <Text style={styles.rowTitle}>
              {collection?.summary.collected ?? 0}/
              {collection?.summary.total ?? 0} ·{" "}
              {collection?.summary.percent ?? 0}%
            </Text>
            <ProgressBar
              value={collection?.summary.percent ?? 0}
              max={100}
              color="#1f8f62"
              trackColor="#d5e9dc"
            />
          </View>
          <Text style={styles.pendingMark}>
            {collection?.nextTarget
              ? `追 ${collection.nextTarget.name}`
              : "全图鉴"}
          </Text>
        </View>
        <Text style={styles.helperText}>
          {collection?.nextTarget?.hint ??
            collection?.summary.nextAction ??
            "继续攒机会，给豆仓一点命运的响动。"}
        </Text>
        <ProgressBar
          value={collection?.drawProgress ?? 0}
          max={3}
          color="#1f8f62"
        />
        <Text style={styles.kickerSection}>选择主题卡池</Text>
        <View style={styles.beanThemeRow}>
          {beanThemes.map((theme) => {
            const summary = collection?.themes.find((item) => item.theme === theme);
            return (
              <Pressable
                key={theme}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTheme === theme }}
                onPress={() => actions.setTheme(theme)}
                style={[
                  styles.beanThemeButton,
                  selectedTheme === theme && styles.beanThemeButtonActive
                ]}
              >
                <Text
                  style={[
                    styles.beanThemeButtonText,
                    selectedTheme === theme && styles.beanThemeButtonTextActive
                  ]}
                >
                  {beanThemeLabel(theme)}
                </Text>
                <Text
                  style={[
                    styles.beanThemeCount,
                    selectedTheme === theme && styles.beanThemeButtonTextActive
                  ]}
                >
                  {summary?.collected ?? 0}/{summary?.total ?? 0}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.beanEconomyGrid}>
          <View style={styles.beanEconomyCell}>
            <Text style={styles.kicker}>稀有保底</Text>
            <Text style={styles.beanEconomyValue}>
              {collection?.pityCount ?? 0}/{collection?.pityThreshold ?? 8}
            </Text>
            <Text style={styles.smallCopy}>第 8 次必出稀有以上</Text>
          </View>
          <View style={styles.beanEconomyCell}>
            <Text style={styles.kicker}>重复碎片</Text>
            <Text style={styles.beanEconomyValue}>
              {collection?.fragments ?? 0}
            </Text>
            <Text style={styles.smallCopy}>
              {collection?.fragmentExchangeCost ?? 10} 个换 1 次
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <ArtSlot slotId="bean-draw-machine" size={72} />
        </View>
        <ActionButton
          label={`从${beanThemeLabel(selectedTheme)}抽一颗`}
          disabled={loading || (collection?.drawChances ?? 0) <= 0}
          onPress={actions.drawBean}
        />
        <ActionButton
          label="用碎片兑换 1 次机会"
          dark
          disabled={
            loading ||
            (collection?.fragments ?? 0) <
              (collection?.fragmentExchangeCost ?? 10)
          }
          onPress={actions.exchangeFragments}
        />
        {drawResult ? (
          <MotionFeedback
            variant="bean-reveal"
            trigger={drawResult.bean.id}
            animateOnMount
          >
          <View style={styles.resultBox}>
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <ArtSlot slotId="bean-draw-result" size={80} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              <StatusBadge
                tone={drawResult.duplicate ? "warning" : "completed"}
                label={drawResult.duplicate ? "重复" : "新豆"}
              />
              {drawResult.pityTriggered ? (
                <StatusBadge tone="active" label="保底" />
              ) : null}
            </View>
            <Text style={styles.kicker}>抽豆结果</Text>
            <Text style={styles.sectionTitle}>
              {beanDelight?.title ?? drawResult.resultTitle ?? drawResult.bean.name}
            </Text>
            <Text style={styles.accentMeta}>
              {drawResult.bean.name} ·{" "}
              {beanThemeLabel(drawResult.bean.theme)} ·{" "}
              {rarityLabel(drawResult.bean.rarity)}
            </Text>
            <Text style={styles.copy}>
              {beanDelight?.copy ?? drawResult.bean.description}
            </Text>
            <View style={{ marginTop: 8 }}>
              <RewardRow
                icon={drawResult.duplicate ? "🧩" : "🫘"}
                label={drawResult.duplicate ? "重复奖励" : "图鉴更新"}
                value={
                  drawResult.duplicate
                    ? `+${drawResult.fragmentsGranted} 碎片`
                    : "新豆入袋"
                }
                positive={!drawResult.duplicate}
              />
              <RewardRow
                icon="⭐"
                label="剩余机会"
                value={`${drawResult.remainingDrawChances} 次`}
              />
              {drawResult.fishTankOutcomes?.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.kicker}>鱼缸也收到了</Text>
                  {drawResult.fishTankOutcomes.map((outcome) => (
                    <RewardRow
                      key={outcome.resourceType}
                      icon={resourceIcon(outcome.resourceType)}
                      label={outcome.label}
                      value={`+${outcome.quantity}`}
                      positive
                    />
                  ))}
                  <Text style={styles.helperText}>
                    {drawResult.fishTankOutcomes[0]?.copy}
                  </Text>
                  <ActionButton
                    label="看看鱼缸库存"
                    disabled={loading}
                    onPress={actions.inspectFishTank}
                  />
                </View>
              ) : null}
            </View>
            <View style={styles.resultReceiptBox}>
              <Text style={styles.kicker}>{beanDelight?.receiptTitle ?? "抽豆回执"}</Text>
              <Text style={styles.rowTitle}>
                {beanDelight?.rewardLabel ??
                  (drawResult.duplicate
                    ? `碎片 +${drawResult.fragmentsGranted} · 剩余机会 ${drawResult.remainingDrawChances}`
                    : `图鉴更新 · 剩余机会 ${drawResult.remainingDrawChances}`)}
              </Text>
            </View>
            <Text style={styles.helperText}>
              下一步：{drawResult.nextHint ?? nextStep.title}
            </Text>
            {todayLoop.resultFollowUps.primary ? (
              <ActionButton
                label={todayLoop.resultFollowUps.primary.actionLabel}
                disabled={loading}
                onPress={() => actions.runTodayLoopAction(todayLoop.resultFollowUps.primary!)}
              />
            ) : null}
          </View>
          </MotionFeedback>
        ) : null}
      </DashboardCard>
      <DashboardCard>
        <SectionHeader kicker="展示柜" title="选一个槽位，再点一颗已拥有的豆" />
        <View style={styles.showcaseRow}>
          {[1, 2, 3].map((position) => {
            const item = collection?.showcase.find(
              (showcase) => showcase.position === position
            );
            return (
              <Pressable
                key={position}
                accessibilityRole="button"
                accessibilityState={{ selected: showcasePosition === position }}
                onPress={() => actions.setShowcasePosition(position)}
                style={[
                  styles.showcaseSlot,
                  showcasePosition === position && styles.showcaseSlotActive
                ]}
              >
                <ArtSlot slotId="bean-showcase-slot" size={48} style={styles.showcasePlaceholder} />
                <Text style={styles.kicker}>第 {position} 格</Text>
                <Text style={styles.showcaseBeanName}>
                  {item?.bean.name ?? "空位"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader
          kicker="豆子图鉴"
          title={`已收集 ${collection?.beans.filter((bean) => bean.owned).length ?? 0}/${collection?.beans.length ?? 0}`}
        />
        <View style={styles.raritySummaryRow}>
          {beanRarities.map((rarity) => {
            const rarityBeans = collection?.beans.filter(
              (bean) => bean.rarity === rarity
            ) ?? [];
            return (
              <View key={rarity} style={styles.raritySummaryCell}>
                <Text style={styles.kicker}>{rarityLabel(rarity)}</Text>
                <Text style={styles.raritySummaryValue}>
                  {rarityBeans.filter((bean) => bean.owned).length}/{rarityBeans.length}
                </Text>
              </View>
            );
          })}
        </View>
        {collection?.beans.filter((bean) => bean.theme === selectedTheme).length ? (
          <View style={styles.grid}>
            {collection?.beans
              .filter((bean) => bean.theme === selectedTheme)
              .map((bean) => (
                <Pressable
                  key={bean.id}
                  accessibilityRole={bean.owned ? "button" : undefined}
                  disabled={!bean.owned || loading}
                  onPress={() => actions.setShowcase(bean.id)}
                  style={[styles.beanTile, bean.owned && styles.beanTileOwned]}
                >
                  <ArtSlot slotId="bean-gallery-item" size={56} style={styles.beanTileArt} />
                  <Text style={styles.rowTitle}>{bean.name}</Text>
                  <Text style={styles.rowMeta}>
                    {rarityLabel(bean.rarity)} · x{bean.quantity}
                  </Text>
                  <Text style={styles.smallCopy}>
                    {bean.owned ? bean.description : "尚未获得，先保持一点神秘。"}
                  </Text>
                  {bean.owned ? (
                    <Text style={styles.showcaseHint}>放入第 {showcasePosition} 格</Text>
                  ) : null}
                </Pressable>
              ))}
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId="empty-state-beans"
              size={72}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title="这个卡池空空如也"
              body="完成任意一次活动来攒抽豆机会"
              icon="🫘"
            />
          </View>
        )}
      </DashboardCard>
      <DashboardCard>
        <SectionHeader kicker="豆子组合" title="只看收藏，不消耗豆子" />
        {collection?.combinations.length ? (
          collection.combinations.map((combination) => (
            <View
              key={combination.code}
              style={[styles.listRow, combination.completed && styles.listRowCompleted]}
            >
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{combination.name}</Text>
                <Text style={styles.rowMeta}>收集指定豆子即可自动完成</Text>
                {combination.fishTankEffect ? (
                  <Text style={styles.combinationFishHint}>
                    {combination.fishTankEffect.available ? "已解锁" : "鱼缸联动"} ·{" "}
                    {combination.fishTankEffect.label}：{combination.fishTankEffect.hint}
                  </Text>
                ) : null}
              </View>
              <Text
                style={combination.completed ? styles.completedMark : styles.progressValue}
              >
                {combination.owned}/{combination.required}
              </Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId="empty-state-generic"
              size={64}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title="组合表还在路上"
              body="先把豆子收齐，组合就会自动出现"
              icon="🧩"
            />
          </View>
        )}
      </DashboardCard>
    </>
  );
}

function beanChanceSourceText(source: NonNullable<BeansTabProps["todayLoop"]["drawChanceSource"]>) {
  if (source === "activity") return "这次机会来自刚完成的摸鱼任务。";
  if (source === "check-in") return "这次机会来自刚结算的打卡。";
  if (source === "goal-reward") return "这次机会来自刚领取的成长奖励。";
  return "这次机会来自碎片兑换。";
}
