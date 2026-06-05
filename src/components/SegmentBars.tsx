"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDuration } from "@/lib/format";
import type { ChartAnalytics, SegmentBarPoint } from "@/lib/types";

type TooltipPayload<T> = Array<{ payload: T }>;

export default function SegmentBars({ analytics }: { analytics: ChartAnalytics }) {
  const data = analytics.segmentBars;
  const knownSegments = data.filter((point) => !point.missing).length;

  return (
    <section className="rounded border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Segment Bars</p>
          <h2 className="text-xl font-black text-[var(--brand-navy)]">逐段用时对比</h2>
        </div>
        <SmallStat label="分段" value={`${knownSegments}/12`} />
      </div>
      <div className="mt-3 h-80 min-w-0">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <BarChart data={data} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
            <CartesianGrid stroke="rgba(23,27,64,0.12)" vertical={false} />
            <XAxis dataKey="label" interval={0} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tickFormatter={shortDuration} tick={{ fill: "var(--muted)", fontSize: 11 }} width={58} />
            <Tooltip content={<SegmentTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar name="选手" dataKey="athleteMs" fill="var(--brand-navy)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar name="同组平均" dataKey="averageMs" fill="var(--brand-lime)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function SegmentTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload<SegmentBarPoint> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded border border-[var(--line)] bg-white p-3 text-sm shadow-sm">
      <p className="font-black text-[var(--brand-navy)]">{point.splitKey}</p>
      <p className="mt-1">选手：{point.athleteText}</p>
      <p>同组平均：{point.averageText}</p>
      <p>冠军参考：{point.championText}</p>
      <p className={point.deltaChampionMs !== null && point.deltaChampionMs > 0 ? "text-[var(--red)]" : "text-[var(--brand-navy)]"}>
        差值：{formatDelta(point.deltaChampionMs)}
      </p>
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

function shortDuration(value: number): string {
  const text = formatDuration(value);
  return text.startsWith("00:") ? text.slice(3) : text;
}

function formatDelta(value: number | null): string {
  if (value === null) return "-";
  return value > 0 ? `+${formatDuration(value)}` : formatDuration(value);
}
