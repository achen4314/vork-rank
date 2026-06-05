"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDuration } from "@/lib/format";
import type { ChartAnalytics, TrendPoint } from "@/lib/types";

type TooltipPayload<T> = Array<{ dataKey: string; name: string; payload: T; value: number | null }>;

export default function TrendChart({ analytics }: { analytics: ChartAnalytics }) {
  const data = analytics.cumulativeTrend;
  const knownPoints = data.filter((point) => point.athleteMs !== null).length;

  return (
    <section className="rounded border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Cumulative Trend</p>
          <h2 className="text-xl font-black text-[var(--brand-navy)]">累计用时走势</h2>
        </div>
        <SmallStat label="计时点" value={`${knownPoints}/6`} />
      </div>
      <div className="mt-3 h-80 min-w-0">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <LineChart data={data} margin={{ left: 8, right: 18, top: 12, bottom: 8 }}>
            <CartesianGrid stroke="rgba(23,27,64,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tickFormatter={shortDuration} tick={{ fill: "var(--muted)", fontSize: 11 }} width={58} />
            <Tooltip content={<TrendTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              name="选手"
              type="monotone"
              dataKey="athleteMs"
              stroke="var(--brand-navy)"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              name="冠军参考"
              type="monotone"
              dataKey="championMs"
              stroke="var(--brand-lime)"
              strokeWidth={2}
              strokeDasharray="7 5"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              name="同组平均"
              type="monotone"
              dataKey="averageMs"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="2 5"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload<TrendPoint> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded border border-[var(--line)] bg-white p-3 text-sm shadow-sm">
      <p className="font-black text-[var(--brand-navy)]">{point.label}</p>
      <p className="mt-1">选手：{point.athleteText}</p>
      <p>冠军参考：{point.championText}</p>
      <p>同组平均：{point.averageText}</p>
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
