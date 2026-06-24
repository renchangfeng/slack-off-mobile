export type GameplayStepKind =
  | "start-checkin"
  | "finish-checkin"
  | "draw-bean"
  | "complete-activity"
  | "get-activity"
  | "claim-daily-reward"
  | "claim-weekly-reward";

export type GameplayStep = {
  kind: GameplayStepKind;
  title: string;
  description: string;
  actionLabel: string;
  targetSection: "home" | "activities" | "beans" | "rankings" | "profile";
  rewardPreview?: {
    score: number;
    drawProgress: number;
    drawChances: number;
  } | null;
};

type GameplayState = {
  hasActiveCheckIn: boolean;
  drawChances: number;
  activityStatus?: string | null;
  activityUnavailable: boolean;
  hasProgress: boolean;
  serverNextActions?: ServerNextAction[];
};

type ServerNextAction = {
  code: string;
  title: string;
  description: string;
  actionLabel: string;
  targetSection: "home" | "activities" | "beans" | "rankings" | "profile";
  priority: number;
  rewardPreview?: {
    score: number;
    drawProgress: number;
    drawChances: number;
  } | null;
};

export function deriveGameplayStep(state: GameplayState): GameplayStep {
  if (state.hasActiveCheckIn) {
    return {
      kind: "finish-checkin",
      title: "先把这次休息坐实",
      description: "计时正在进行。休息够了以后结束打卡，系统会结算分数和抽豆进度。",
      actionLabel: "结束并结算",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
  }

  if (state.drawChances > 0) {
    return {
      kind: "draw-bean",
      title: `你有 ${state.drawChances} 次抽豆机会`,
      description: "机会已经到账，不花掉它就像把调休留到过期。",
      actionLabel: "立即抽豆",
      targetSection: "beans",
      rewardPreview: { score: 0, drawProgress: 0, drawChances: state.drawChances }
    };
  }

  if (state.activityStatus === "active") {
    return {
      kind: "complete-activity",
      title: "当前摸鱼任务等你交差",
      description: "先按任务描述完成它，再回来领取分数和抽豆进度。",
      actionLabel: "我做完了，领取奖励",
      targetSection: "activities",
      rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
    };
  }

  const serverStep = deriveServerStep(state.serverNextActions ?? []);
  if (serverStep) {
    return serverStep;
  }

  if (state.activityUnavailable) {
    return {
      kind: "start-checkin",
      title: "任务池暂时休息了",
      description: "当前没有可领取的随机活动。可以开始下一次打卡，继续积累分数和抽豆进度。",
      actionLabel: "开始下一次打卡",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
  }

  if (state.hasProgress) {
    return {
      kind: "get-activity",
      title: "继续攒抽豆进度",
      description: "完成随机摸鱼活动也能增加进度。每累计 3 点进度可获得 1 次抽豆机会。",
      actionLabel: "领取摸鱼任务",
      targetSection: "activities",
      rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
    };
  }

  return {
    kind: "start-checkin",
    title: "从一次带薪休息开始",
    description: "开始计时，结束后获得排行榜分数和抽豆进度，然后再去做随机摸鱼活动。",
    actionLabel: "开始打卡",
    targetSection: "home",
    rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
  };
}

function deriveServerStep(actions: ServerNextAction[]): GameplayStep | null {
  const action = [...actions].sort((left, right) => left.priority - right.priority)[0];
  if (!action) return null;
  return {
    kind: mapServerActionKind(action.code),
    title: action.title,
    description: action.description,
    actionLabel: action.actionLabel,
    targetSection: action.targetSection,
    rewardPreview: action.rewardPreview ?? null
  };
}

function mapServerActionKind(code: string): GameplayStepKind {
  if (code === "draw_bean") return "draw-bean";
  if (code === "complete_activity") return "get-activity";
  if (code === "claim_daily_reward") return "claim-daily-reward";
  if (code === "claim_weekly_reward") return "claim-weekly-reward";
  return "start-checkin";
}
