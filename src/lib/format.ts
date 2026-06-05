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
