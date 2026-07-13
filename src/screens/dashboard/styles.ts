import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../ui/tokens";

const styles = StyleSheet.create({
  app: { backgroundColor: colors.background, flex: 1 },
  container: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 760,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: 52,
    width: "100%"
  },
  header: { marginBottom: 22 },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  uiLabButton: {
    alignItems: "center",
    borderColor: colors.inkBlue,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 10
  },
  uiLabButtonText: {
    color: colors.inkBlue,
    fontSize: 12,
    fontWeight: "900"
  },
  pageTitle: { color: colors.inkBlue, fontSize: 30, fontWeight: "900", marginTop: 8 },
  pageSubtitle: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  topLoader: { marginBottom: spacing.md },
  panel: {
    backgroundColor: "#fffdf8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18
  },
  featurePanel: {
    backgroundColor: "#fffdf8",
    borderColor: "#4ca6a8",
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    padding: 18
  },
  activityHeroCard: {
    backgroundColor: "#fff6df",
    borderLeftWidth: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  activityCardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  historyCard: {
    backgroundColor: "#fffdf8",
    borderColor: "#d8d0c4",
    borderLeftWidth: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  historyCardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  activityBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activityStat: {
    color: "#625b52",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
    paddingTop: 4
  },
  activityHeadline: {
    color: "#18232b",
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 29
  },
  activityScene: {
    color: "#47413a",
    fontSize: 14,
    lineHeight: 21
  },
  activityPromptBox: {
    backgroundColor: "#ffffff",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    padding: 12
  },
  activityPrompt: {
    color: "#2f2a25",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21
  },
  activityFeedbackBox: {
    backgroundColor: "#fff8e8",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    padding: 12
  },
  activityFeedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  progressionPanel: {
    backgroundColor: "#18232b",
    borderRadius: 8,
    marginBottom: 16,
    padding: 18
  },
  progressionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressionLevel: { color: "#ffffff", fontSize: 34, fontWeight: "900", marginTop: 5 },
  progressionXp: { color: "#b7f05a", fontSize: 18, fontWeight: "900" },
  progressionMeta: { color: "#c8c1b7", fontSize: 13, marginTop: 8 },
  darkKicker: { color: "#bdb5aa", fontSize: 12, fontWeight: "900" },
  kicker: { color: "#756c61", fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: "#18232b", fontSize: 21, fontWeight: "900", marginTop: 6 },
  timer: { color: "#18232b", fontSize: 58, fontWeight: "900", marginTop: 8 },
  copy: { color: "#47413a", fontSize: 15, lineHeight: 22, marginTop: 8 },
  smallCopy: { color: "#746b60", fontSize: 12, lineHeight: 18, marginTop: 7 },
  helperText: { color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 10 },
  kickerSection: { color: "#756c61", fontSize: 12, fontWeight: "900", marginTop: 20 },
  accentMeta: { color: "#2f6f8f", fontSize: 13, fontWeight: "900", marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#17a36b",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  actionButtonDark: { backgroundColor: "#18232b" },
  actionButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900", textAlign: "center" },
  buttonMuted: { opacity: 0.42 },
  inlineActionButton: {
    alignItems: "center",
    backgroundColor: "#18232b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 74,
    paddingHorizontal: 12
  },
  inlineActionText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  nextStepFallbackPanel: {
    backgroundColor: "#18232b",
    borderRadius: 8,
    marginBottom: 16,
    padding: 18
  },
  todayRouteList: {
    gap: 8,
    marginTop: 14
  },
  todayRouteHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  todayRouteProgressPill: {
    backgroundColor: "#18232b",
    borderRadius: 8,
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  todayRouteProgressText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  todayRouteProgressTrack: {
    backgroundColor: "#e2dbd0",
    borderColor: "#d8d0c4",
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    marginBottom: 10,
    marginTop: 8,
    overflow: "hidden"
  },
  todayRouteProgressFill: {
    backgroundColor: "#1f8f62",
    height: "100%"
  },
  todayRouteDelightBox: {
    backgroundColor: "#fff8df",
    borderColor: "#d4a838",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  todayRouteDelightBoxDone: {
    backgroundColor: "#edf8f2",
    borderColor: "#82b99f"
  },
  todayRouteStep: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    padding: 10
  },
  todayRouteStepActive: {
    backgroundColor: "#fff4c9",
    borderColor: "#d4a838"
  },
  todayRouteStepClaimable: {
    backgroundColor: "#eef7f3",
    borderColor: "#82b99f"
  },
  todayRouteStepDone: {
    backgroundColor: "#edf8f2",
    borderColor: "#82b99f"
  },
  todayRouteStepOptional: {
    backgroundColor: "#f0edf8",
    borderColor: "#b7a6d8"
  },
  todayRouteStepGlyph: {
    color: "#18232b",
    fontSize: 18,
    fontWeight: "900",
    minWidth: 22,
    textAlign: "center"
  },
  todayRoutePrimary: {
    backgroundColor: "#eef7f3",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  todayRouteSecondaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  todayRouteSecondaryButton: {
    alignItems: "center",
    backgroundColor: "#18232b",
    borderRadius: 8,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12
  },
  todayObjectiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  todayObjectiveCell: {
    backgroundColor: "#fffdf8",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 76,
    padding: 10
  },
  todayObjectiveCellDone: {
    backgroundColor: "#edf8f2",
    borderColor: "#82b99f"
  },
  nextStepTitle: { color: "#ffffff", fontSize: 21, fontWeight: "900", marginTop: 7 },
  nextStepCopy: { color: "#d5cec4", fontSize: 14, lineHeight: 21, marginTop: 7 },
  rewardPreview: {
    alignSelf: "flex-start",
    backgroundColor: "#eef7f3",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  rewardPreviewDark: {
    backgroundColor: "#35322e",
    borderColor: "#6d655b"
  },
  rewardPreviewText: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  rewardPreviewTextDark: { color: "#f0c95a" },
  resultPanel: {
    backgroundColor: "#e7f4ed",
    borderColor: "#1f8f62",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18
  },
  levelUpPanel: { backgroundColor: "#fff4c9", borderColor: "#d4a838" },
  resultBox: {
    backgroundColor: "#eef7f3",
    borderRadius: 8,
    marginTop: 14,
    padding: 14
  },
  resultReceiptBox: {
    backgroundColor: "#fffdf8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  dailyReportCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  dailyReportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  dailyReportCell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 68,
    justifyContent: "center",
    padding: 10
  },
  dailyReportValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  dailyReportLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 4
  },
  dailyReportSummary: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  insightSuggestion: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10
  },
  expiredMark: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "900"
  },
  mementoTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 6
  },
  mementoReceiptBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 10,
    padding: 12
  },
  historyCardCompleted: {
    backgroundColor: colors.mintLight,
    borderColor: colors.mintMid
  },
  historyCardSkipped: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.goldDeep
  },
  historyCardExpired: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  activityResultCertificate: {
    backgroundColor: "#eef7f3",
    borderLeftWidth: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14
  },
  activityResultReceipt: {
    backgroundColor: "#ffffff",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  activityResultReceiptLine: {
    color: "#2f2a25",
    fontSize: 13,
    lineHeight: 19
  },
  activityResultReceiptOverflow: {
    color: "#746b60",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4
  },
  activityResultTitle: {
    color: "#232323",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 10
  },
  resultFollowUpBox: {
    gap: 8,
    marginTop: 12
  },
  interactionPanel: {
    backgroundColor: "#f7f2e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  interactionStep: {
    backgroundColor: "#fffdf8",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  interactionStepDone: {
    backgroundColor: "#edf8f2",
    borderColor: "#82b99f"
  },
  interactionStepDisabled: {
    opacity: 0.72
  },
  timerMini: {
    color: "#232323",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 10
  },
  tapAreaCompleted: {
    backgroundColor: "#e7f4ed",
    borderColor: "#82b99f"
  },
  tapAreaCompletedText: {
    color: "#1f8f62"
  },
  sortRow: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 10
  },
  sortLabel: {
    color: "#232323",
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900" as const,
    lineHeight: 20,
    marginRight: 8
  },
  reactionCue: {
    color: "#746b60",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  choiceButton: {
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "30%",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12
  },
  choiceButtonSelected: {
    backgroundColor: "#232323",
    borderColor: "#232323"
  },
  choiceButtonText: { color: "#625b52", fontSize: 13, fontWeight: "900", textAlign: "center" },
  choiceButtonTextSelected: { color: "#ffffff" },
  categoryRow: { gap: 8, paddingTop: 14 },
  categoryChip: {
    alignItems: "center",
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 13
  },
  categoryChipSelected: { backgroundColor: "#232323", borderColor: "#232323" },
  categoryChipText: { color: "#625b52", fontSize: 13, fontWeight: "900" },
  categoryChipTextSelected: { color: "#ffffff" },
  skipReasonBox: {
    gap: 4,
    paddingTop: 4
  },
  activityCatalogRow: {
    alignItems: "flex-start",
    borderTopColor: "#e2dbd0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14
  },
  readyMark: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  cooldownMark: {
    color: "#8b4d36",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  goalCount: { color: "#1f8f62", fontSize: 26, fontWeight: "900" },
  listRow: {
    alignItems: "center",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    minHeight: 62,
    padding: 12
  },
  listRowCompleted: { backgroundColor: "#edf8f2", borderColor: "#82b99f" },
  rowTitle: { color: "#232323", fontSize: 15, fontWeight: "900" },
  rowMeta: { color: "#746b60", fontSize: 12, lineHeight: 17, marginTop: 3 },
  completedMark: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  pendingMark: { color: "#8b4d36", fontSize: 12, fontWeight: "900" },
  progressValue: {
    color: "#8b4d36",
    fontSize: 13,
    fontWeight: "900",
    minWidth: 44,
    textAlign: "right"
  },
  goalRewardRow: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    minHeight: 58,
    padding: 12
  },
  flex: { flex: 1 },
  goalBanner: {
    backgroundColor: "#fff7df",
    borderColor: "#d4a838",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14
  },
  goalBannerCompleted: { backgroundColor: "#edf8f2", borderColor: "#82b99f" },
  progressTrack: {
    backgroundColor: "#514d48",
    borderRadius: 4,
    height: 8,
    marginTop: 14,
    overflow: "hidden"
  },
  progressFill: { borderRadius: 4, height: 8 },
  grid: { gap: 10, marginTop: 14 },
  beanTile: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 13
  },
  beanTileOwned: { backgroundColor: colors.mintLight, borderColor: colors.mintMid },
  beanTileArt: { marginBottom: 8 },
  fishCollectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10
  },
  fishCollectionCell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "22%",
    flexGrow: 1,
    minHeight: 76,
    justifyContent: "center",
    padding: 8
  },
  fishCollectionName: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center"
  },
  hatchRevealBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(20, 19, 17, 0.72)",
    borderRadius: 8,
    justifyContent: "center",
    left: 0,
    margin: -18,
    minHeight: "100%",
    padding: 18,
    position: "absolute",
    right: 0,
    top: 0
  },
  hatchRevealPanel: {
    borderRadius: 8,
    borderWidth: 2,
    maxWidth: 460,
    padding: 18,
    width: "100%"
  },
  beanThemeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  beanThemeButton: {
    alignItems: "center",
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    padding: 7
  },
  beanThemeButtonActive: { backgroundColor: "#232323", borderColor: "#232323" },
  beanThemeButtonText: { color: "#625b52", fontSize: 12, fontWeight: "900", textAlign: "center" },
  beanThemeButtonTextActive: { color: "#ffffff" },
  beanThemeCount: { color: "#746b60", fontSize: 11, marginTop: 3 },
  beanCollectionSummary: {
    alignItems: "center",
    backgroundColor: "#eef7f3",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 12
  },
  beanEconomyGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  beanEconomyCell: {
    backgroundColor: "#f4f0e8",
    borderRadius: 8,
    flex: 1,
    minHeight: 102,
    padding: 12
  },
  beanEconomyValue: { color: "#232323", fontSize: 24, fontWeight: "900", marginTop: 5 },
  showcaseRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  showcaseSlot: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    padding: 10
  },
  showcaseSlotActive: { backgroundColor: colors.warningSoft, borderColor: colors.goldDeep },
  showcasePlaceholder: { marginBottom: 6 },
  showcaseBeanName: { color: colors.ink, fontSize: 13, fontWeight: "900", marginTop: 7 },
  showcaseHint: { color: colors.primary, fontSize: 11, fontWeight: "900", marginTop: 9 },
  combinationFishHint: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 5
  },
  raritySummaryRow: { flexDirection: "row", gap: 5, marginTop: 14 },
  raritySummaryCell: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderRadius: 6,
    flex: 1,
    minHeight: 50,
    padding: 6
  },
  raritySummaryValue: { color: "#232323", fontSize: 14, fontWeight: "900", marginTop: 3 },
  segmented: {
    backgroundColor: "#eee8df",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
    padding: 4
  },
  segment: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 38
  },
  segmentActive: { backgroundColor: "#232323" },
  segmentText: { color: "#625b52", fontSize: 13, fontWeight: "900" },
  segmentTextActive: { color: "#ffffff" },
  leaderboardBody: {
    minHeight: 156
  },
  leaderboardEmptyState: {
    justifyContent: "center",
    minHeight: 78
  },
  podiumRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 12
  },
  podiumCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 132,
    padding: 10
  },
  podiumCardFirst: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.goldDeep,
    minHeight: 156
  },
  podiumCardMine: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  podiumCrown: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: "900"
  },
  podiumAvatar: {
    backgroundColor: colors.acid,
    borderColor: colors.ink,
    borderRadius: 8,
    borderWidth: 2,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  podiumName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
    width: "100%"
  },
  podiumTitle: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
    width: "100%"
  },
  podiumScore: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7
  },
  rankRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingVertical: 10
  },
  rankRowMine: {
    backgroundColor: colors.mintLight,
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 8
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: colors.acid,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 44
  },
  rankNo: { color: colors.inkBlue, fontSize: 14, fontWeight: "900" },
  rankScore: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  rankActions: { alignItems: "flex-end", gap: 6 },
  reactionRow: { flexDirection: "row", gap: 5 },
  reactionButton: { backgroundColor: colors.surfaceMuted, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 5 },
  reactionText: { color: colors.inkMuted, fontSize: 11, fontWeight: "900" },
  socialInput: {
    backgroundColor: "#f4f0e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    color: "#232323",
    fontSize: 14,
    marginTop: 14,
    minHeight: 46,
    paddingHorizontal: 12
  },
  socialActions: { flexDirection: "row", gap: 7 },
  myRankSlot: { minHeight: 54 },
  myRank: { backgroundColor: "#232323", borderRadius: 8, marginTop: 14, padding: 13 },
  myRankText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  profileLevelTile: {
    backgroundColor: colors.ink,
    borderColor: colors.goldDeep,
    borderWidth: 2
  },
  profileLevelText: { color: colors.gold, fontSize: 18, fontWeight: "900" },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 82,
    padding: 8
  },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.inkMuted, fontSize: 11, marginTop: 4, textAlign: "center" },
  recommendationBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12
  },
  focusAchievementCard: {
    alignItems: "center",
    backgroundColor: colors.mintLight,
    borderColor: colors.mintMid,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 14
  },
  recommendationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8
  },
  cosmeticRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    padding: 12
  },
  cosmeticRowLocked: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.82
  },
  message: {
    color: "#a23b3b",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  notice: {
    color: "#1f6f4f",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginBottom: 12
  },
  unlockBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(20, 19, 17, 0.72)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  unlockPanel: {
    backgroundColor: "#fffdf8",
    borderColor: "#d4a838",
    borderRadius: 8,
    borderWidth: 2,
    maxWidth: 460,
    padding: 24,
    width: "100%"
  },
  unlockEyebrow: {
    color: "#8b6b16",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  unlockMark: {
    color: "#d4a838",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center"
  },
  unlockTitle: {
    color: "#232323",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  unlockRule: {
    alignSelf: "center",
    backgroundColor: "#d4a838",
    height: 3,
    marginVertical: 18,
    width: 54
  },
  unlockRewardTitle: { color: "#756c61", fontSize: 12, fontWeight: "900", textAlign: "center" },
  unlockRewardCopy: {
    color: "#232323",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 6,
    textAlign: "center"
  },
  cosmeticReveal: {
    backgroundColor: "#fff4c9",
    borderRadius: 8,
    marginTop: 16,
    padding: 13
  },
  inlineEquipButton: {
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 36,
    paddingHorizontal: 12
  },
  inlineEquipText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  decorItemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 10
  },
  decorItemRowLocked: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.82
  },
  decorPreviewCell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "22%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 76,
    padding: 8
  },
  decorPreviewLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center"
  },
  unlockRemaining: {
    color: "#746b60",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center"
  },
  emptyText: { color: "#746b60", fontSize: 14, lineHeight: 21, marginTop: 12 }
});

export default styles;
