import { formatDuration } from "@/lib/format";
import type {
  JudgingDecision,
  RankBucket,
  RankContext,
  ReplayStep,
  ResultDetailResponse,
  ResultEntry,
  SplitEntry,
  WorkoutSection,
  WorkoutSummary,
} from "@/lib/types";

const EVENT_ZONE_COUNT = 6;

export function buildResultDetailResponse(
  source: "supabase" | "static",
  result: ResultEntry | null,
  splits: SplitEntry[],
  rankingPool: ResultEntry[],
): ResultDetailResponse {
  const sortedSplits = [...splits].sort((a, b) => a.splitOrder - b.splitOrder);
  const { workoutSummary, raceReplay } = buildWorkout(sortedSplits);
  return {
    source,
    result,
    splits: sortedSplits,
    workoutSummary,
    raceReplay,
    judgingDecision: buildJudgingDecision(result),
    rankContext: buildRankContext(result, rankingPool),
  };
}

function buildWorkout(splits: SplitEntry[]): { workoutSummary: WorkoutSummary; raceReplay: ReplayStep[] } {
  const runByZone = new Map<number, SplitEntry>();
  const stationByZone = new Map<number, SplitEntry>();
  const totalByZone = new Map<number, SplitEntry>();
  const extras: SplitEntry[] = [];

  splits.forEach((split) => {
    const parsed = parseSplit(split.splitLabel || split.splitKey);
    if (parsed.kind === "run" && parsed.zone) runByZone.set(parsed.zone, split);
    else if (parsed.kind === "station" && parsed.zone) stationByZone.set(parsed.zone, split);
    else if (parsed.kind === "aggregate" && parsed.zone) totalByZone.set(parsed.zone, split);
    else extras.push(split);
  });

  const maxKnownZone = Math.max(
    EVENT_ZONE_COUNT,
    ...[...runByZone.keys(), ...stationByZone.keys(), ...totalByZone.keys()],
  );
  const sections: WorkoutSection[] = [];
  const replayBase: ReplayStep[] = [];

  for (let zone = 1; zone <= maxKnownZone; zone += 1) {
    const run = runByZone.get(zone) ?? null;
    const station = stationByZone.get(zone) ?? null;
    const aggregate = totalByZone.get(zone) ?? null;
    const runMs = run?.splitTimeMs ?? null;
    const stationMs = station?.splitTimeMs ?? null;
    const aggregateMs = aggregate?.splitTimeMs ?? null;
    const missing: string[] = [];
    if (!run) missing.push(`跑步${zone}`);
    if (!station) missing.push(`项目${zone}`);
    if (!aggregate) missing.push(`第${zone}区`);

    const transitionMs = inferTransitionMs(runMs, stationMs, aggregateMs);
    const totalMs = aggregateMs ?? sumKnown([runMs, stationMs, transitionMs]);
    const hasTimingConflict = hasConflict(runMs, stationMs, aggregateMs);

    const section: WorkoutSection = {
      zone,
      label: `第${zone}区`,
      runLabel: run?.splitLabel ?? `跑步${zone}`,
      runTimeMs: runMs,
      runTimeText: run?.splitTimeText || formatDuration(runMs),
      stationLabel: station?.splitLabel ?? `项目${zone}`,
      stationTimeMs: stationMs,
      stationTimeText: station?.splitTimeText || formatDuration(stationMs),
      transitionLabel: "Roxzone 换项",
      transitionTimeMs: transitionMs,
      transitionTimeText: formatDuration(transitionMs),
      totalLabel: aggregate?.splitLabel ?? `第${zone}区`,
      totalTimeMs: totalMs,
      totalTimeText: aggregate?.splitTimeText || formatDuration(totalMs),
      missing,
      hasTimingConflict,
    };
    sections.push(section);

    if (run) replayBase.push(baseStep(`run-${zone}`, zone, run.splitLabel, "run", runMs, false));
    if (station) replayBase.push(baseStep(`station-${zone}`, zone, station.splitLabel, "station", stationMs, false));
    if (transitionMs && transitionMs > 0) {
      replayBase.push(baseStep(`transition-${zone}`, zone, section.transitionLabel, "transition", transitionMs, false));
    }
    if (aggregate && (run || station) && (!run || !station)) {
      const residualMs = aggregateMs === null ? null : aggregateMs - (runMs ?? 0) - (stationMs ?? 0);
      if (residualMs !== null && residualMs > 1000) {
        replayBase.push(baseStep(`aggregate-residual-${zone}`, zone, `${aggregate.splitLabel}未拆分余量`, "aggregate", residualMs, false));
      }
    }
    if (!run && !station && aggregate) {
      replayBase.push(baseStep(`aggregate-${zone}`, zone, aggregate.splitLabel, "aggregate", aggregateMs, false));
    }
  }

  const extraSteps = extras.map((split) =>
    baseStep(`extra-${split.splitOrder}-${split.splitKey}`, null, split.splitLabel, "extra", split.splitTimeMs, false),
  );
  const replayTotalMs = [...replayBase, ...extraSteps].reduce((total, step) => total + (step.timeMs ?? 0), 0);
  const raceReplay = withReplayProgress([...replayBase, ...extraSteps], replayTotalMs);
  const workoutSummary: WorkoutSummary = {
    sections,
    extras: withReplayProgress(extraSteps, replayTotalMs),
    replayTotalMs,
    replayTotalText: formatDuration(replayTotalMs),
    missingCount: sections.reduce((total, section) => total + section.missing.length, 0),
    conflictCount: sections.filter((section) => section.hasTimingConflict).length,
  };

  return { workoutSummary, raceReplay };
}

function parseSplit(label: string): { kind: "run" | "station" | "aggregate" | "extra"; zone: number | null } {
  const run = label.match(/^跑步(\d+)$/);
  if (run) return { kind: "run", zone: Number.parseInt(run[1], 10) };
  const station = label.match(/^项目(\d+)$/);
  if (station) return { kind: "station", zone: Number.parseInt(station[1], 10) };
  const aggregate = label.match(/^第(\d+)区$/);
  if (aggregate) return { kind: "aggregate", zone: Number.parseInt(aggregate[1], 10) };
  return { kind: "extra", zone: null };
}

function inferTransitionMs(runMs: number | null, stationMs: number | null, aggregateMs: number | null): number | null {
  if (runMs === null || stationMs === null || aggregateMs === null) return null;
  const delta = aggregateMs - runMs - stationMs;
  if (Math.abs(delta) <= 1000) return 0;
  return delta > 0 ? delta : null;
}

function hasConflict(runMs: number | null, stationMs: number | null, aggregateMs: number | null): boolean {
  if (runMs === null || stationMs === null || aggregateMs === null) return false;
  return aggregateMs - runMs - stationMs < -1000;
}

function sumKnown(values: Array<number | null>): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? known.reduce((total, value) => total + value, 0) : null;
}

function baseStep(
  id: string,
  zone: number | null,
  label: string,
  kind: ReplayStep["kind"],
  timeMs: number | null,
  missing: boolean,
): ReplayStep {
  return {
    id,
    zone,
    label,
    kind,
    timeMs,
    timeText: formatDuration(timeMs),
    cumulativeMs: null,
    cumulativeText: "-",
    widthPct: 0,
    missing,
  };
}

function withReplayProgress(steps: ReplayStep[], totalMs: number): ReplayStep[] {
  let cumulative = 0;
  return steps.map((step) => {
    cumulative += step.timeMs ?? 0;
    const widthPct = totalMs > 0 && step.timeMs ? Math.max(3, (step.timeMs / totalMs) * 100) : 3;
    return {
      ...step,
      cumulativeMs: step.timeMs === null ? null : cumulative,
      cumulativeText: step.timeMs === null ? "-" : formatDuration(cumulative),
      widthPct,
    };
  });
}

function buildJudgingDecision(result: ResultEntry | null): JudgingDecision {
  if (!result) {
    return {
      label: "暂无判罚信息",
      tone: "unranked",
      penaltyText: "-",
      cumulativePenaltyText: "-",
      reasons: [],
    };
  }
  const reasons = splitReasons(result.note || result.penaltyStatus);
  const penaltyText = result.appliedPenaltyText || formatDuration(result.appliedPenaltyMs);
  const cumulativePenaltyText = result.cumulativePenaltyText || formatDuration(result.cumulativePenaltyMs);
  const status = `${result.status} ${result.penaltyStatus} ${result.note}`.toLowerCase();

  if (result.status !== "FINISHED" || result.finalRank === null) {
    return {
      label: result.status === "FINISHED" ? "未排名 / 需复核" : result.status,
      tone: "unranked",
      penaltyText,
      cumulativePenaltyText,
      reasons,
    };
  }
  if (result.appliedPenaltyMs > 0) {
    return {
      label: "Penalty Applied",
      tone: "penalty",
      penaltyText,
      cumulativePenaltyText,
      reasons,
    };
  }
  if (result.cumulativePenaltyMs > 0 || /penalty|罚时|处罚|加罚/.test(status)) {
    return {
      label: "Penalty Recorded",
      tone: "penalty",
      penaltyText,
      cumulativePenaltyText,
      reasons,
    };
  }
  if (result.cumulativePenaltyMs > 0 || /复核|缺失|少跑|警告|异常/.test(status)) {
    return {
      label: "Review Note",
      tone: "review",
      penaltyText,
      cumulativePenaltyText,
      reasons,
    };
  }
  return {
    label: "Clear",
    tone: "clear",
    penaltyText,
    cumulativePenaltyText,
    reasons: reasons.length ? reasons : ["无额外判罚记录"],
  };
}

function splitReasons(text: string): string[] {
  return text
    .split(/[；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRankContext(result: ResultEntry | null, rankingPool: ResultEntry[]): RankContext {
  return {
    overall: rankBucket("总排名", result, rankingPool, () => true),
    gender: rankBucket(result?.gender ? `${result.gender}子排名` : "性别排名", result, rankingPool, (entry) => entry.gender === result?.gender),
    group: rankBucket(result?.groupName || "组别排名", result, rankingPool, (entry) => entry.groupName === result?.groupName),
    division: rankBucket(result?.divisionName || "分组排名", result, rankingPool, (entry) => entry.divisionCode === result?.divisionCode),
  };
}

function rankBucket(
  label: string,
  result: ResultEntry | null,
  rankingPool: ResultEntry[],
  predicate: (entry: ResultEntry) => boolean,
): RankBucket {
  const ranked = rankingPool.filter((entry) => entry.finalTimeMs !== null && entry.finalRank !== null && predicate(entry)).sort(compareResultTime);
  const index = result ? ranked.findIndex((entry) => sameEntry(entry, result)) : -1;
  return {
    label,
    rank: index >= 0 ? index + 1 : null,
    total: ranked.length,
  };
}

function compareResultTime(a: ResultEntry, b: ResultEntry): number {
  const timeA = a.finalTimeMs ?? Number.POSITIVE_INFINITY;
  const timeB = b.finalTimeMs ?? Number.POSITIVE_INFINITY;
  if (timeA !== timeB) return timeA - timeB;
  return (a.finalRank ?? Number.POSITIVE_INFINITY) - (b.finalRank ?? Number.POSITIVE_INFINITY);
}

function sameEntry(a: Pick<ResultEntry, "bib" | "divisionCode">, b: Pick<ResultEntry, "bib" | "divisionCode">) {
  return a.bib === b.bib && a.divisionCode === b.divisionCode;
}
