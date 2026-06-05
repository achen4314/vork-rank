export type EventInfo = {
  slug: string;
  name: string;
  eventDate: string;
  venue: string;
  timezone: string;
  sourceUpdatedAt: string;
};

export type ResultEntry = {
  eventSlug: string;
  divisionCode: string;
  divisionName: string;
  groupName: string;
  projectName: string;
  bib: string;
  displayName: string;
  teamName: string;
  school: string;
  gender: string;
  rawRank: number | null;
  finalRank: number | null;
  status: string;
  netTimeMs: number | null;
  cumulativePenaltyMs: number;
  appliedPenaltyMs: number;
  finalTimeMs: number | null;
  netTimeText: string;
  cumulativePenaltyText: string;
  appliedPenaltyText: string;
  finalTimeText: string;
  penaltyStatus: string;
  note: string;
  sourceRow: number;
};

export type SplitEntry = {
  eventSlug: string;
  divisionCode: string;
  bib: string;
  splitKey: string;
  splitLabel: string;
  splitOrder: number;
  splitTimeMs: number | null;
  splitTimeText: string;
};

export type WorkoutSection = {
  zone: number;
  label: string;
  runLabel: string;
  runTimeMs: number | null;
  runTimeText: string;
  stationLabel: string;
  stationTimeMs: number | null;
  stationTimeText: string;
  transitionLabel: string;
  transitionTimeMs: number | null;
  transitionTimeText: string;
  totalLabel: string;
  totalTimeMs: number | null;
  totalTimeText: string;
  missing: string[];
  hasTimingConflict: boolean;
};

export type ReplayStep = {
  id: string;
  zone: number | null;
  label: string;
  kind: "run" | "station" | "transition" | "aggregate" | "extra";
  timeMs: number | null;
  timeText: string;
  cumulativeMs: number | null;
  cumulativeText: string;
  widthPct: number;
  missing: boolean;
};

export type WorkoutSummary = {
  sections: WorkoutSection[];
  extras: ReplayStep[];
  replayTotalMs: number;
  replayTotalText: string;
  missingCount: number;
  conflictCount: number;
};

export type JudgingDecision = {
  label: string;
  tone: "clear" | "review" | "penalty" | "unranked";
  penaltyText: string;
  cumulativePenaltyText: string;
  reasons: string[];
};

export type RankBucket = {
  label: string;
  rank: number | null;
  total: number;
};

export type RankContext = {
  overall: RankBucket;
  gender: RankBucket;
  group: RankBucket;
  division: RankBucket;
};

export type RankingSummary = {
  total: number;
  ranked: number;
  unranked: number;
  divisionCount: number;
  appliedPenaltyCount: number;
  cumulativePenaltyCount: number;
  sourceUpdatedAt: string;
};

export type RankingFilters = {
  groups: string[];
  projects: string[];
  divisions: { code: string; name: string }[];
};

export type RankingDataset = {
  event: EventInfo;
  summary: RankingSummary;
  filters: RankingFilters;
  results: ResultEntry[];
  splits: SplitEntry[];
};

export type ResultListResponse = {
  source: "supabase" | "static";
  event: EventInfo;
  summary: RankingSummary;
  filters: RankingFilters;
  page: number;
  pageSize: number;
  total: number;
  results: ResultEntry[];
};

export type ResultDetailResponse = {
  source: "supabase" | "static";
  result: ResultEntry | null;
  splits: SplitEntry[];
  workoutSummary: WorkoutSummary;
  raceReplay: ReplayStep[];
  judgingDecision: JudgingDecision;
  rankContext: RankContext;
};
