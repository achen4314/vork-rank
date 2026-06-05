import type { ResultEntry } from "@/lib/types";

export type RankFilterState = {
  q: string;
  group: string;
  project: string;
  division: string;
  status: string;
};

export type ResultSelection = Pick<ResultEntry, "bib" | "divisionCode">;

export const emptyFilters: RankFilterState = {
  q: "",
  group: "",
  project: "",
  division: "",
  status: "",
};
