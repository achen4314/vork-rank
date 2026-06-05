import type { ResultEntry } from "@/lib/types";

export function sameEntry(a: Pick<ResultEntry, "bib" | "divisionCode">, b: Pick<ResultEntry, "bib" | "divisionCode">) {
  return a.bib === b.bib && a.divisionCode === b.divisionCode;
}

export function resultHref(entry: Pick<ResultEntry, "bib" | "divisionCode">) {
  return `/results/${encodeURIComponent(entry.divisionCode)}/${encodeURIComponent(entry.bib)}`;
}
