export type DashboardTab = "home" | "activities" | "beans" | "rankings" | "profile";

export type DashboardTabDefinition = {
  value: DashboardTab;
  label: string;
  glyph: string;
  title: string;
  subtitle: string;
};

export const dashboardTabs: DashboardTabDefinition[] = [
  {
    value: "home",
    label: "首页",
    glyph: "休",
    title: "今天也别太用力",
    subtitle: "先完成一个小目标，再决定要不要拯救世界。"
  },
  {
    value: "activities",
    label: "活动",
    glyph: "玩",
    title: "摸鱼任务",
    subtitle: "一些不会改变世界，但能改善表情管理的小事。"
  },
  {
    value: "beans",
    label: "豆仓",
    glyph: "豆",
    title: "工位命运豆",
    subtitle: "没有现金价值，但有相当充分的精神价值。"
  },
  {
    value: "rankings",
    label: "排行",
    glyph: "榜",
    title: "休息排行榜",
    subtitle: "看看今天谁把喘气这件事做得最认真。"
  },
  {
    value: "profile",
    label: "我的",
    glyph: "我",
    title: "个人档案",
    subtitle: "你的休息履历、成就，以及那些来之不易的称号。"
  }
];

export function getDashboardTab(tab: DashboardTab): DashboardTabDefinition {
  return dashboardTabs.find((item) => item.value === tab) ?? dashboardTabs[0];
}
