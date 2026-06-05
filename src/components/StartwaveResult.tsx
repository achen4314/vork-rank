import type { ReactNode } from "react";
import { BuildingIcon, CalendarIcon, ClockIcon, FlagIcon, HashIcon, MapPinIcon, UserIcon } from "@/components/Icons";
import type { StartwaveEntry, StartwaveSuccessResponse } from "@/lib/types";

type StartwaveResultProps = {
  data: StartwaveSuccessResponse;
  onReset: () => void;
};

export default function StartwaveResult({ data, onReset }: StartwaveResultProps) {
  const { event, athlete, entries } = data;

  return (
    <div className="flex flex-col gap-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">查询结果</p>
          <h2 className="mt-1 text-xl font-black text-[var(--brand-navy)]">{entries.length ? `共 ${entries.length} 条出发记录` : "暂无出发记录"}</h2>
        </div>
        <button type="button" onClick={onReset} className="text-sm text-[var(--muted)] underline transition hover:text-[var(--brand-navy)]">
          重新查询
        </button>
      </div>

      <div>
        <p className="text-2xl font-black text-[var(--brand-navy)]">{athlete.name}</p>
        {athlete.phoneMasked ? <p className="mt-1 text-sm text-[var(--muted)]">{athlete.phoneMasked}</p> : null}
      </div>

      {entries.length ? (
        entries.map((entry) => (
          <StartwaveCard
            key={`${entry.bibOrChip}-${entry.projectName}-${entry.startDatetime}`}
            athleteName={athlete.name}
            entry={entry}
            event={event}
          />
        ))
      ) : (
        <p className="rounded border border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">已找到报名运动员，但尚未分配出发批次。</p>
      )}
    </div>
  );
}

function StartwaveCard({
  athleteName,
  entry,
  event,
}: {
  athleteName: string;
  entry: StartwaveEntry;
  event: StartwaveSuccessResponse["event"];
}) {
  return (
    <article className="overflow-hidden rounded border border-[var(--line)] bg-white shadow-sm">
      <div className="brand-stripe" aria-hidden="true" />
      <div className="px-5 py-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Startwave</p>
        <p className="mt-2 flex items-center justify-center gap-2 text-base text-[var(--brand-navy)]">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(entry.startDate)}
        </p>
        <p className="mt-1 flex items-center justify-center gap-2 font-mono text-5xl font-black tracking-tight text-[var(--brand-navy)]">
          <ClockIcon className="h-8 w-8" />
          {entry.startTime || "--:--"}
        </p>
        <p className="mt-3 inline-block rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-navy)]">已分配出发时间</p>
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--paper)]">
        <div className="border-b border-[var(--line)] px-5 py-3">
          <h3 className="font-bold text-[var(--brand-navy)]">VORK {event.name}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPinIcon className="h-4 w-4" />
            {event.venue || "--"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{entry.projectName}</p>
        </div>

        <dl className="divide-y divide-[var(--line)]">
          <Row label="出发批次" value={entry.waveLabel} icon={<FlagIcon className="h-4 w-4" />} bold />
          <Row label="脚环/号码" value={entry.bibOrChip} icon={<HashIcon className="h-4 w-4" />} mono bold />
          <Row label="姓名" value={athleteName} icon={<UserIcon className="h-4 w-4" />} bold />
          <Row label="性别" value={entry.gender ?? "--"} />
          <Row label="组别" value={entry.division} />
          <Row label="项目" value={entry.projectName} />
          {entry.teamCode ? <Row label="队伍编号" value={entry.teamCode} mono /> : null}
          {entry.teamName ? <Row label="队伍名称" value={entry.teamName} /> : null}
          {entry.memberIndex !== null ? <Row label="成员序号" value={`第 ${entry.memberIndex} 人`} /> : null}
          {entry.organization ? <Row label="院系/单位" value={entry.organization} icon={<BuildingIcon className="h-4 w-4" />} /> : null}
        </dl>
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  icon,
  mono = false,
  bold = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <dt className="flex min-w-[5.5rem] items-center gap-2 text-sm text-[var(--muted)]">
        {icon}
        {label}
      </dt>
      <dd className={`min-w-0 break-words text-sm text-[var(--ink)] ${mono ? "font-mono" : ""} ${bold ? "font-bold" : ""}`}>{value || "--"}</dd>
    </div>
  );
}

function formatDate(dateText: string): string {
  if (!dateText) return "--";
  const [year, month, day] = dateText.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${year}.${month}.${day} ${weekdays[date.getDay()] ?? ""}`.trim();
}
