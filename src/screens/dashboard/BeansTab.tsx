import { Pressable, Text, View } from "react-native";
import { EmptyState, PixelArtPlaceholder, SectionHeader } from "../../ui/components";
import { DashboardCard } from "./parts/DashboardCard";
import { ActionButton, ProgressBar } from "./parts/SharedControls";
import { GoalBanner } from "./parts/GoalPanels";
import {
  beanRarities,
  beanThemeLabel,
  beanThemes,
  rarityLabel
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
  actions
}: BeansTabProps) {
  return (
    <>
      <GoalBanner goal={goal} />
      <DashboardCard>
        <SectionHeader kicker="抽豆账户" title={`${collection?.drawChances ?? 0} 次机会`} />
        <Text style={styles.copy}>
          当前进度 {collection?.drawProgress ?? 0}/3。每满 3 点自动兑换一次机会。
        </Text>
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
          <View style={styles.resultBox}>
            <Text style={styles.kicker}>抽豆结果</Text>
            <Text style={styles.sectionTitle}>
              {drawResult.resultTitle ?? drawResult.bean.name}
            </Text>
            <Text style={styles.accentMeta}>
              {drawResult.bean.name} ·{" "}
              {beanThemeLabel(drawResult.bean.theme)} ·{" "}
              {rarityLabel(drawResult.bean.rarity)}
              {drawResult.pityTriggered ? " · 保底生效" : ""}
            </Text>
            <Text style={styles.copy}>{drawResult.bean.description}</Text>
            <Text style={styles.helperText}>
              {drawResult.resultCopy ??
                (drawResult.duplicate
                  ? `重复收藏，数量增加并获得 ${drawResult.fragmentsGranted} 个碎片。`
                  : "新豆入袋，图鉴完成度已更新。")}
            </Text>
            <Text style={styles.helperText}>
              下一步：{drawResult.nextHint ?? nextStep.title}
            </Text>
          </View>
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
                <PixelArtPlaceholder kind="bean" size={48} style={styles.showcasePlaceholder} />
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
                  <PixelArtPlaceholder kind="bean" size={56} style={styles.beanTileArt} />
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
          <EmptyState
            title="这个卡池空空如也"
            body="完成任意一次活动来攒抽豆机会"
            icon="🫘"
          />
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
              </View>
              <Text
                style={combination.completed ? styles.completedMark : styles.progressValue}
              >
                {combination.owned}/{combination.required}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState
            title="组合表还在路上"
            body="先把豆子收齐，组合就会自动出现"
            icon="🧩"
          />
        )}
      </DashboardCard>
    </>
  );
}
