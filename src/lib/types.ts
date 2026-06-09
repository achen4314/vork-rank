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
  penaltyStatusText: string;
  noteText: string;
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

export type StationRadarPoint = {
  zone: number;
  label: string;
  athleteScore: number;
  averageScore: number;
  athletePercentile: number | null;
  averagePercentile: number | null;
  athleteTimeMs: number | null;
  athleteTimeText: string;
  averageTimeMs: number | null;
  averageTimeText: string;
  sampleSize: number;
  missing: boolean;
};

export type TrendPoint = {
  zone: number;
  label: string;
  athleteMs: number | null;
  championMs: number | null;
  averageMs: number | null;
  athleteText: string;
  championText: string;
  averageText: string;
  sampleSize: number;
};

export type SegmentBarPoint = {
  zone: number;
  label: string;
  splitKey: string;
  kind: "run" | "station";
  athleteMs: number | null;
  averageMs: number | null;
  championMs: number | null;
  deltaChampionMs: number | null;
  athleteText: string;
  averageText: string;
  championText: string;
  sampleSize: number;
  missing: boolean;
};

export type ChartAnalytics = {
  sampleSize: number;
  divisionCode: string;
  stationRadar: StationRadarPoint[];
  cumulativeTrend: TrendPoint[];
  segmentBars: SegmentBarPoint[];
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
  chartAnalytics: ChartAnalytics;
};

export type StartwaveEntry = {
  projectName: string;
  waveLabel: string;
  startDate: string;
  startTime: string;
  startDatetime: string;
  bibOrChip: string;
  teamCode: string | null;
  teamName: string | null;
  memberIndex: number | null;
  gender: string | null;
  division: string;
  organization: string | null;
};

export type StartwaveRequest = {
  name: string;
  phoneSuffix?: string;
  event?: string;
};

export type StartwaveCandidate = {
  name: string;
  projects: string[];
};

export type StartwaveSuccessResponse = {
  success: true;
  event: {
    slug: string;
    name: string;
    date: string;
    venue: string;
  };
  athlete: {
    name: string;
    phoneMasked: string | null;
  };
  entries: StartwaveEntry[];
};

export type StartwaveNotFoundResponse = {
  success: false;
  multiple?: false;
  message: string;
};

export type StartwaveMultipleResponse = {
  success: false;
  multiple: true;
  message: string;
  candidates: StartwaveCandidate[];
};

export type StartwaveErrorResponse = {
  success: false;
  message: string;
  error?: string;
};

export type StartwaveResponse =
  | StartwaveSuccessResponse
  | StartwaveNotFoundResponse
  | StartwaveMultipleResponse
  | StartwaveErrorResponse;

// ============================================================
// Registration System Types
// ============================================================

export type RegistrationStatus =
  | "pending"
  | "reviewed"
  | "approved"
  | "rejected"
  | "bib_assigned"
  | "wave_assigned"
  | "confirmed"
  | "checked_in"
  | "racing"
  | "finished"
  | "cancelled";

export type RegistrationProject =
  | "单项测试"
  | "男子单人"
  | "女子单人"
  | "男子双人"
  | "女子双人"
  | "混合4人";

export type RegistrationTeamMember = {
  name: string;
  gender: string;
  phone: string;
  id_card?: string;
  birth_date?: string;
  organization?: string;
};

export type RegistrationEntry = {
  id: number;
  eventSlug: string;
  name: string;
  gender: string;
  idCard: string | null;
  phone: string;
  email: string;
  birthDate: string | null;
  nationality: string;
  organization: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  project: string;
  divisionHint: string | null;
  teamName: string | null;
  teammates: RegistrationTeamMember[] | null;
  status: RegistrationStatus;
  statusNote: string | null;
  healthOk: boolean;
  waiverOk: boolean;
  medicalNote: string | null;
  bib: string | null;
  divisionCode: string | null;
  waveLabel: string | null;
  startTime: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type RegistrationListResponse = {
  data: RegistrationEntry[];
  total: number;
  page: number;
  limit: number;
};

export type RegistrationFilters = {
  status?: RegistrationStatus;
  project?: string;
  division?: string;
  wave?: string;
  q?: string;
};

export type RegistrationFormData = {
  eventSlug: string;
  name: string;
  gender: string;
  idCard?: string;
  phone: string;
  email: string;
  birthDate?: string;
  nationality?: string;
  organization?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  project: string;
  divisionHint?: string;
  teamName?: string;
  teammates?: RegistrationTeamMember[];
  healthOk: boolean;
  waiverOk: boolean;
  medicalNote?: string;
  verificationCode: string;
};

export type WaveEntry = {
  id: number;
  eventSlug: string;
  waveLabel: string;
  startTime: string;
  intervalMin: number;
  capacity: number;
  enrolledCount: number;
  projectFilter: string[] | null;
  divisionFilter: string[] | null;
  status: "planned" | "open" | "full" | "closed" | "finished";
  createdAt: string;
  updatedAt: string;
};

export type AdminRole = "super_admin" | "manager" | "viewer";

export type AdminEntry = {
  id: number;
  userId: string;
  eventSlug: string | null;
  role: AdminRole;
  createdAt: string;
};

export type AuditLogEntry = {
  id: number;
  eventSlug: string;
  tableName: string;
  recordId: number | null;
  action: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  performedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type DashboardStats = {
  totalRegistrations: number;
  pending: number;
  approved: number;
  rejected: number;
  waveAssigned: number;
  checkedIn: number;
  byProject: { project: string; count: number }[];
  byStatus: { status: string; count: number }[];
  waveUtilization: { waveLabel: string; capacity: number; enrolled: number }[];
};

export type VerificationResponse = {
  success: boolean;
  message: string;
};

export type RegistrationStatusResponse = {
  success: boolean;
  message?: string;
  registrations?: RegistrationEntry[];
};

export type RegistrationSubmitResponse = {
  success: boolean;
  message: string;
  registrationId?: number;
};
