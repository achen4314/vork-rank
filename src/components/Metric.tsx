export default function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-words font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}
