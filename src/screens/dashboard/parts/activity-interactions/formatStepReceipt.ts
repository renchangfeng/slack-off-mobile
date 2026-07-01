export function formatStepReceipt(summaries: string[]) {
  const visible = summaries.slice(0, 3);
  const overflow = summaries.length - visible.length;
  return { visible, overflow };
}
