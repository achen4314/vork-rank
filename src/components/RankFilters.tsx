import { RotateCcw, Search } from "lucide-react";
import type { RankFilterState } from "@/components/rankTypes";
import type { RankingFilters } from "@/lib/types";

type RankFiltersProps = {
  filters: RankFilterState;
  searchValue: string;
  options: RankingFilters;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof RankFilterState, value: string) => void;
  onReset: () => void;
};

export default function RankFilters({
  filters,
  searchValue,
  options,
  onSearchChange,
  onFilterChange,
  onReset,
}: RankFiltersProps) {
  return (
    <section className="grid gap-3 rounded border border-[var(--line)] bg-white p-3 shadow-sm lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr_auto]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="姓名 / 号码 / 学校"
          aria-label="搜索"
          className="h-11 w-full rounded border border-[var(--line)] bg-white pl-9 pr-3 text-[var(--ink)]"
        />
      </label>
      <Select value={filters.group} onChange={(group) => onFilterChange("group", group)} options={options.groups} label="组别" />
      <Select value={filters.project} onChange={(project) => onFilterChange("project", project)} options={options.projects} label="项目" />
      <Select
        value={filters.division}
        onChange={(division) => onFilterChange("division", division)}
        options={options.divisions.map((division) => division.code)}
        label="分组"
      />
      <select
        value={filters.status}
        onChange={(event) => onFilterChange("status", event.target.value)}
        aria-label="状态"
        className={selectClassName}
      >
        <option value="">全部</option>
        <option value="ranked">已排名</option>
        <option value="penalty">有罚时</option>
      </select>
      <button
        type="button"
        title="重置"
        aria-label="重置筛选"
        onClick={onReset}
        className="grid h-11 w-11 place-items-center rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] text-[var(--brand-navy)] transition hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </section>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className={selectClassName}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export const selectClassName = "h-11 rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]";
