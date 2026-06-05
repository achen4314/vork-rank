"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartAnalytics, StationRadarPoint } from "@/lib/types";

type TooltipPayload<T> = Array<{ payload: T }>;

export default function RadarChart({ analytics }: { analytics: ChartAnalytics }) {
  const data = analytics.stationRadar;
  const knownStations = data.filter((point) => !point.missing).length;

  return (
    <section className="rounded border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Station Radar</p>
          <h2 className="text-xl font-black text-[var(--brand-navy)]">体能站百分位</h2>
        </div>
        <SmallStat label="站点" value={`${knownStations}/6`} />
      </div>
      <div className="mt-3 h-80 min-w-0">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <RechartsRadarChart data={data} outerRadius="74%">
            <PolarGrid stroke="rgba(23,27,64,0.18)" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "var(--brand-navy)", fontSize: 12, fontWeight: 700 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip content={<RadarTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Radar
              name="选手"
              dataKey="athleteScore"
              stroke="var(--brand-navy)"
              fill="var(--brand-navy)"
              fillOpacity={0.2}
              isAnimationActive={false}
            />
            <Radar
              name="同组平均"
              dataKey="averageScore"
              stroke="var(--brand-lime)"
              strokeDasharray="6 4"
              fill="var(--brand-lime)"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RadarTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload<StationRadarPoint> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded border border-[var(--line)] bg-white p-3 text-sm shadow-sm">
      <p className="font-black text-[var(--brand-navy)]">{point.label}</p>
      <p className="mt-1">选手：{point.athleteTimeText} / {formatPercent(point.athletePercentile)}</p>
      <p>平均：{point.averageTimeText} / {formatPercent(point.averagePercentile)}</p>
      <p className="text-xs text-[var(--muted)]">样本 {point.sampleSize} 人</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2 text-sm">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function formatPercent(value: number | null): string {
  return value === null ? "缺失" : `${value.toFixed(1)}%`;
}
