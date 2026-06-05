export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "-";
  const sign = ms < 0 ? "-" : "";
  const value = Math.floor(Math.abs(ms));
  const totalSeconds = Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${sign}${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function compactText(value: string | null | undefined, fallback = "-"): string {
  const text = `${value ?? ""}`.trim();
  return text.length ? text : fallback;
}

export function rankLabel(rank: number | null): string {
  return rank === null ? "未排名" : `第 ${rank} 名`;
}

export function rankDeltaText(rawRank: number | null, finalRank: number | null): string {
  if (rawRank === null && finalRank === null) return "未排名";
  if (rawRank === null) return `最终 ${rankLabel(finalRank)}`;
  if (finalRank === null) return `净名次 第 ${rawRank} 名 / 未排名`;
  if (rawRank === finalRank) return `净名次同为第 ${finalRank} 名`;
  const delta = finalRank - rawRank;
  return `净名次第 ${rawRank} 名 → 最终第 ${finalRank} 名（${delta > 0 ? `下降 ${delta}` : `上升 ${Math.abs(delta)}`} 名）`;
}
