import { formatDuration } from "@/lib/format";
import type { ChartAnalytics, ResultEntry, SegmentBarPoint, SplitEntry, StationRadarPoint, TrendPoint } from "@/lib/types";

const ZONES = [1, 2, 3, 4, 5, 6];
const SEGMENT_KINDS: Array<"run" | "station"> = ["run", "station"];
const TIMING_TOLERANCE_MS = 1000;

type SplitStats = {
  averageMs: number | null;
  medianMs: number | null;
  minMs: number | null;
  values: number[];
};

export function buildChartAnalytics(
  result: ResultEntry | null,
  athleteSplits: SplitEntry[],
  comparisonSplits: SplitEntry[],
): ChartAnalytics {
  const divisionCode = result?.divisionCode ?? "";
  const comparison = comparisonSplits.filter((split) => !divisionCode || split.divisionCode === divisionCode);
  const athleteLookup = buildLookup(athleteSplits).get(result?.bib ?? "") ?? splitMap(athleteSplits);
  const comparisonLookup = buildLookup(comparison);
  const statsByKey = buildStatsByKey(comparison);
  const sampleSize = comparisonLookup.size;

  return {
    sampleSize,
    divisionCode,
    stationRadar: buildStationRadar(athleteLookup, statsByKey),
    cumulativeTrend: buildCumulativeTrend(athleteLookup, comparisonLookup),
    segmentBars: buildSegmentBars(athleteLookup, statsByKey),
  };
}

function buildStationRadar(athlete: Map<string, number>, statsByKey: Map<string, SplitStats>): StationRadarPoint[] {
  return ZONES.map((zone) => {
    const key = stationKey(zone);
    const stats = statsByKey.get(key) ?? emptyStats();
    const athleteMs = athlete.get(key) ?? null;
    const averageMs = stats.averageMs;
    const athletePercentile = percentileFaster(athleteMs, stats.values);
    const averagePercentile = percentileFaster(averageMs, stats.values);

    return {
      zone,
      label: key,
      athleteScore: athletePercentile ?? 0,
      averageScore: averagePercentile ?? 50,
      athletePercentile,
      averagePercentile,
      athleteTimeMs: athleteMs,
      athleteTimeText: formatDuration(athleteMs),
      averageTimeMs: averageMs,
      averageTimeText: formatDuration(averageMs),
      sampleSize: stats.values.length,
      missing: athleteMs === null,
    };
  });
}

function buildCumulativeTrend(athlete: Map<string, number>, comparison: Map<string, Map<string, number>>): TrendPoint[] {
  const athleteCumulative = cumulativeByZone(athlete);
  const allCumulative = [...comparison.values()].map(cumulativeByZone);

  return ZONES.map((zone, index) => {
    const values = allCumulative.map((points) => points[index]).filter(isValidMs);
    const championMs = values.length ? Math.min(...values) : null;
    const averageMs = average(values);
    const athleteMs = athleteCumulative[index] ?? null;

    return {
      zone,
      label: `第${zone}区`,
      athleteMs,
      championMs,
      averageMs,
      athleteText: formatDuration(athleteMs),
      championText: formatDuration(championMs),
      averageText: formatDuration(averageMs),
      sampleSize: values.length,
    };
  });
}

function buildSegmentBars(athlete: Map<string, number>, statsByKey: Map<string, SplitStats>): SegmentBarPoint[] {
  return ZONES.flatMap((zone) =>
    SEGMENT_KINDS.map((kind) => {
      const key = kind === "run" ? runKey(zone) : stationKey(zone);
      const stats = statsByKey.get(key) ?? emptyStats();
      const athleteMs = athlete.get(key) ?? null;
      const averageMs = stats.averageMs;
      const championMs = stats.minMs;

      return {
        zone,
        label: `${kind === "run" ? "R" : "S"}${zone}`,
        splitKey: key,
        kind,
        athleteMs,
        averageMs,
        championMs,
        deltaChampionMs: athleteMs !== null && championMs !== null ? athleteMs - championMs : null,
        athleteText: formatDuration(athleteMs),
        averageText: formatDuration(averageMs),
        championText: formatDuration(championMs),
        sampleSize: stats.values.length,
        missing: athleteMs === null,
      };
    }),
  );
}

function cumulativeByZone(lookup: Map<string, number>): Array<number | null> {
  const aggregateMode = detectAggregateMode(lookup);
  let cumulative = 0;

  return ZONES.map((zone) => {
    const aggregate = validLookupMs(lookup, cumulativeKey(zone));
    const segmentTotal = segmentTotalMs(lookup, zone);

    if (aggregate !== null) {
      if (aggregateMode === "cumulative") {
        cumulative = aggregate;
        return cumulative;
      }
      cumulative += aggregate;
      return cumulative;
    }

    if (segmentTotal === null) return null;
    cumulative += segmentTotal;
    return cumulative;
  });
}

function detectAggregateMode(lookup: Map<string, number>): "interval" | "cumulative" {
  let intervalVotes = 0;
  let cumulativeVotes = 0;
  let previousAggregate: number | null = null;

  ZONES.forEach((zone) => {
    const aggregate = validLookupMs(lookup, cumulativeKey(zone));
    if (aggregate === null) return;

    const segmentTotal = segmentTotalMs(lookup, zone);
    if (previousAggregate !== null && aggregate < previousAggregate - TIMING_TOLERANCE_MS) {
      intervalVotes += 2;
    }
    if (zone > 1 && segmentTotal !== null) {
      if (nearlyEqual(aggregate, segmentTotal)) intervalVotes += 1;
      else if (aggregate > segmentTotal + TIMING_TOLERANCE_MS && previousAggregate !== null && aggregate >= previousAggregate) {
        cumulativeVotes += 1;
      }
    }

    previousAggregate = aggregate;
  });

  return cumulativeVotes > intervalVotes ? "cumulative" : "interval";
}

function segmentTotalMs(lookup: Map<string, number>, zone: number): number | null {
  const values = [lookup.get(runKey(zone)), lookup.get(stationKey(zone))].filter(isValidMs);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function validLookupMs(lookup: Map<string, number>, key: string): number | null {
  const value = lookup.get(key);
  return isValidMs(value) ? value : null;
}

function buildLookup(splits: SplitEntry[]): Map<string, Map<string, number>> {
  return splits.reduce((lookup, split) => {
    const ms = splitMs(split);
    if (ms === null) return lookup;
    const byBib = lookup.get(split.bib) ?? new Map<string, number>();
    byBib.set(normalizeSplitKey(split), ms);
    lookup.set(split.bib, byBib);
    return lookup;
  }, new Map<string, Map<string, number>>());
}

function splitMap(splits: SplitEntry[]): Map<string, number> {
  return splits.reduce((lookup, split) => {
    const ms = splitMs(split);
    if (ms !== null) lookup.set(normalizeSplitKey(split), ms);
    return lookup;
  }, new Map<string, number>());
}

function buildStatsByKey(splits: SplitEntry[]): Map<string, SplitStats> {
  const valuesByKey = splits.reduce((lookup, split) => {
    const key = normalizeSplitKey(split);
    const ms = splitMs(split);
    if (ms === null) return lookup;
    const values = lookup.get(key) ?? [];
    values.push(ms);
    lookup.set(key, values);
    return lookup;
  }, new Map<string, number[]>());

  return new Map(
    [...valuesByKey.entries()].map(([key, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return [
        key,
        {
          averageMs: average(sorted),
          medianMs: median(sorted),
          minMs: sorted[0] ?? null,
          values: sorted,
        },
      ];
    }),
  );
}

function percentileFaster(value: number | null, distribution: number[]): number | null {
  if (value === null || !distribution.length) return null;
  const faster = distribution.filter((item) => item > value).length;
  const tied = distribution.filter((item) => item === value).length;
  return round1(((faster + tied * 0.5) / distribution.length) * 100);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2);
}

function splitMs(split: SplitEntry): number | null {
  return isValidMs(split.splitTimeMs) ? split.splitTimeMs : null;
}

function isValidMs(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIMING_TOLERANCE_MS;
}

function normalizeSplitKey(split: SplitEntry): string {
  return split.splitKey || split.splitLabel;
}

function emptyStats(): SplitStats {
  return { averageMs: null, medianMs: null, minMs: null, values: [] };
}

function runKey(zone: number): string {
  return `跑步${zone}`;
}

function stationKey(zone: number): string {
  return `项目${zone}`;
}

function cumulativeKey(zone: number): string {
  return `第${zone}区`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
