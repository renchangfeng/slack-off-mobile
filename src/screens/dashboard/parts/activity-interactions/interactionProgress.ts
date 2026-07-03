import type {
  ActivityAssignment,
  ActivityInteractionProgress
} from "../../../../api/activities";
import type { Dispatch, SetStateAction } from "react";

export type ActivityStep = ActivityAssignment["interaction"]["steps"][number];

export function isStepComplete(
  step: ActivityStep,
  progress: ActivityInteractionProgress
): boolean {
  if (step.type === "ack") {
    return Boolean(progress.completedStepIds?.includes(step.id));
  }
  if (step.type === "timer") {
    return (progress.timerSeconds?.[step.id] ?? 0) >= (step.durationSeconds ?? 0);
  }
  if (step.type === "choice") {
    const answer = progress.choiceAnswers?.[step.id];
    const validOptionIds = new Set(step.options?.map((option) => option.id) ?? []);
    return Boolean(
      answer &&
        validOptionIds.has(answer) &&
        (!step.correctOptionId || answer === step.correctOptionId)
    );
  }
  if (step.type === "mini_game") {
    return progress.miniGameResults?.[step.id]?.passed === true;
  }
  if (step.type === "tap-pattern") {
    return (progress.tapCounts?.[step.id] ?? 0) >= (step.requiredTaps ?? 1);
  }
  if (step.type === "shuffle-pick" || step.type === "reveal") {
    const selected = progress.selectedOptions?.[step.id];
    if (!selected) return false;
    const validIds = step.items?.map((item) => item.id) ?? [];
    return validIds.includes(selected);
  }
  if (step.type === "sort") {
    const submitted = progress.sortedItemIds?.[step.id];
    if (!submitted) return false;
    const configuredIds = step.items?.map((item) => item.id) ?? [];
    const idsMatch =
      submitted.length === configuredIds.length &&
      configuredIds.every((id) => submitted.includes(id));
    if (!idsMatch) return false;
    if (step.correctOrder && step.correctOrder.length > 0) {
      return (
        submitted.length === step.correctOrder.length &&
        submitted.every((id, index) => id === step.correctOrder![index])
      );
    }
    return true;
  }
  if (step.type === "breath") {
    return (progress.breathRounds?.[step.id] ?? 0) >= (step.requiredRounds ?? 1);
  }
  if (step.type === "reaction") {
    const result = progress.reactionResults?.[step.id];
    if (!result) return false;
    return result.successCount >= (step.requiredSuccessCount ?? 1);
  }
  if (step.type === "micro-journal") {
    const entry = progress.journalEntries?.[step.id];
    if (!entry) return false;
    const mode = step.journalMode ?? "text";
    if (mode === "text" || mode === "both") {
      const text = (entry.text ?? "").trim();
      const min = step.textMinLength ?? 0;
      const max = step.textMaxLength ?? 200;
      if (text.length < min || text.length > max) return false;
    }
    if (mode === "tags" || mode === "both") {
      const tagCount = entry.tagIds?.length ?? 0;
      const min = step.minTagCount ?? 0;
      const max = step.maxTagCount ?? (step.tags?.length ?? 1);
      if (tagCount < min || tagCount > max) return false;
      const validTagIds = new Set(step.tags?.map((tag) => tag.id) ?? []);
      if ((entry.tagIds ?? []).some((id) => !validTagIds.has(id))) return false;
    }
    if (mode === "text" && entry.tagIds && entry.tagIds.length > 0) {
      return false;
    }
    if (mode === "tags" && entry.text && entry.text.trim().length > 0) {
      return false;
    }
    return true;
  }
  return false;
}

export function shouldLockChoiceSelection(
  step: ActivityStep,
  progress: ActivityInteractionProgress
): boolean {
  if (step.type !== "choice") return false;
  const answer = progress.choiceAnswers?.[step.id];
  if (!answer) return false;
  if (!step.correctOptionId) return true;
  return answer === step.correctOptionId;
}

export function summarizeStep(
  step: ActivityStep,
  progress: ActivityInteractionProgress
): string {
  if (!isStepComplete(step, progress)) {
    return "待完成";
  }
  if (step.type === "ack") {
    return "已确认";
  }
  if (step.type === "timer") {
    return `倒计时完成（${progress.timerSeconds?.[step.id] ?? step.durationSeconds ?? 0} 秒）`;
  }
  if (step.type === "choice") {
    const answer = progress.choiceAnswers?.[step.id];
    const option = step.options?.find((o) => o.id === answer);
    return option ? `选择了「${option.label}」` : "完成选择";
  }
  if (step.type === "mini_game") {
    const result = progress.miniGameResults?.[step.id];
    return result?.passed ? `小游戏通过（分数 ${result.score ?? 0}）` : "完成小游戏";
  }
  if (step.type === "tap-pattern") {
    return `点击 ${progress.tapCounts?.[step.id] ?? step.requiredTaps ?? 1} 次`;
  }
  if (step.type === "shuffle-pick" || step.type === "reveal") {
    const selected = progress.selectedOptions?.[step.id];
    const item = step.items?.find((i) => i.id === selected);
    const verb = step.type === "reveal" ? "翻开" : "抽到";
    return item ? `${verb}「${item.label}」` : "完成抽取";
  }
  if (step.type === "sort") {
    return "完成排序";
  }
  if (step.type === "breath") {
    return `完成 ${progress.breathRounds?.[step.id] ?? step.requiredRounds ?? 1} 轮呼吸`;
  }
  if (step.type === "reaction") {
    const result = progress.reactionResults?.[step.id];
    return result ? `命中 ${result.successCount} 次` : "完成反应挑战";
  }
  if (step.type === "micro-journal") {
    const entry = progress.journalEntries?.[step.id];
    const mode = step.journalMode ?? "text";
    if (mode === "tags" && entry?.tagIds?.length) {
      const labels = entry.tagIds
        .map((id) => step.tags?.find((t) => t.id === id)?.label)
        .filter(Boolean);
      return `标记了：${labels.join("、")}`;
    }
    if (mode === "text" && entry?.text?.trim()) {
      const snippet = entry.text.trim();
      return `记录了「${snippet.length > 16 ? `${snippet.slice(0, 16)}…` : snippet}」`;
    }
    if (mode === "both" && entry) {
      const pieces: string[] = [];
      if (entry.text?.trim()) {
        const snippet = entry.text.trim();
        pieces.push(`记录了「${snippet.length > 12 ? `${snippet.slice(0, 12)}…` : snippet}」`);
      }
      if (entry.tagIds?.length) {
        const labels = entry.tagIds
          .map((id) => step.tags?.find((t) => t.id === id)?.label)
          .filter(Boolean);
        pieces.push(`标记了：${labels.join("、")}`);
      }
      return pieces.length ? pieces.join("，") : "完成记录";
    }
    return "完成记录";
  }
  return "已完成";
}

export function markAck(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string
) {
  onChange((current) => ({
    ...current,
    completedStepIds: Array.from(new Set([...(current.completedStepIds ?? []), stepId]))
  }));
}

export function markTimer(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  seconds: number
) {
  onChange((current) => ({
    ...current,
    timerSeconds: { ...(current.timerSeconds ?? {}), [stepId]: seconds }
  }));
}

export function markChoice(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  optionId: string
) {
  onChange((current) => ({
    ...current,
    choiceAnswers: { ...(current.choiceAnswers ?? {}), [stepId]: optionId }
  }));
}

export function markMiniGame(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  score: number
) {
  onChange((current) => ({
    ...current,
    miniGameResults: {
      ...(current.miniGameResults ?? {}),
      [stepId]: { passed: true, score }
    }
  }));
}

export function markTapPattern(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  count: number
) {
  onChange((current) => ({
    ...current,
    tapCounts: { ...(current.tapCounts ?? {}), [stepId]: count }
  }));
}

export function markSelectedOption(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  itemId: string
) {
  onChange((current) => ({
    ...current,
    selectedOptions: { ...(current.selectedOptions ?? {}), [stepId]: itemId }
  }));
}

export function markSortedItems(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  itemIds: string[]
) {
  onChange((current) => ({
    ...current,
    sortedItemIds: { ...(current.sortedItemIds ?? {}), [stepId]: itemIds }
  }));
}

export function markBreathRounds(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  rounds: number
) {
  onChange((current) => ({
    ...current,
    breathRounds: { ...(current.breathRounds ?? {}), [stepId]: rounds }
  }));
}

export function markReactionResult(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  result: { successCount: number; attempts: number }
) {
  onChange((current) => ({
    ...current,
    reactionResults: { ...(current.reactionResults ?? {}), [stepId]: result }
  }));
}

export function markJournalEntry(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  entry: { text?: string; tagIds?: string[] }
) {
  onChange((current) => ({
    ...current,
    journalEntries: { ...(current.journalEntries ?? {}), [stepId]: entry }
  }));
}
