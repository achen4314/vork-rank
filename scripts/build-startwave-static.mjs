import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const [, , sourcePath, outputPath = "data/startwave.json"] = process.argv;

if (!sourcePath) {
  console.error("Usage: node scripts/build-startwave-static.mjs <source-json> [output-json]");
  process.exit(1);
}

const raw = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const event = {
  slug: raw.event?.event_slug ?? "capital-college-fitness-2026",
  name: raw.event?.event_name ?? "首都高校体能竞速邀请赛",
  date: raw.event?.event_date ?? "2026-05-30",
  venue: raw.event?.venue ?? "北京大学",
};

const grouped = new Map();
for (const row of raw.entries ?? []) {
  const key = row.lookup_key || `${row.athlete_name}:${row.phone_last4 ?? ""}:${row.identity_last4 ?? ""}`;
  const current = grouped.get(key) ?? {
    name: String(row.athlete_name ?? "").trim(),
    credentialHashes: new Set(),
    entries: [],
  };

  for (const suffix of [row.phone_last4, row.identity_last4]) {
    const normalized = normalizeSuffix(suffix);
    if (normalized) current.credentialHashes.add(hashCredential(event.slug, current.name, normalized));
  }

  current.entries.push({
    projectName: clean(row.project_name),
    waveLabel: clean(row.wave_label),
    startDate: clean(row.start_date),
    startTime: clean(row.start_time).slice(0, 5),
    startDatetime: clean(row.start_datetime),
    bibOrChip: clean(row.bib_or_chip),
    teamCode: nullable(row.team_code),
    teamName: nullable(row.team_name),
    memberIndex: Number.isInteger(row.member_index) ? row.member_index : null,
    gender: nullable(row.gender),
    division: clean(row.division),
    organization: nullable(row.organization),
  });

  grouped.set(key, current);
}

const athletes = [...grouped.values()]
  .filter((athlete) => athlete.name && athlete.entries.length)
  .map((athlete, index) => ({
    id: index + 1,
    name: athlete.name,
    credentialHashes: [...athlete.credentialHashes].sort(),
    entries: athlete.entries.sort(compareEntries),
  }))
  .sort((a, b) => {
    const name = a.name.localeCompare(b.name, "zh-Hans-CN");
    if (name !== 0) return name;
    return String(a.entries[0]?.bibOrChip ?? "").localeCompare(String(b.entries[0]?.bibOrChip ?? ""), "zh-Hans-CN");
  });

const output = {
  event,
  source: {
    generatedFrom: raw.source?.generated_from ?? "startwave_roster",
    generatedAt: raw.source?.generated_at ?? new Date().toISOString(),
    entryCount: athletes.reduce((sum, athlete) => sum + athlete.entries.length, 0),
    athleteCount: athletes.length,
    privacy: "Credential suffixes are stored as hashes only; raw phone/id suffixes are intentionally omitted.",
  },
  athletes,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${outputPath}: ${output.source.entryCount} entries, ${output.source.athleteCount} athletes`);

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function nullable(value) {
  const text = clean(value);
  return text ? text : null;
}

function normalizeSuffix(value) {
  const text = clean(value).toUpperCase();
  return /^[0-9A-Z]{4}$/.test(text) ? text : null;
}

function hashCredential(eventSlug, name, suffix) {
  return createHash("sha256").update(`${eventSlug}::${normalizeName(name)}::${suffix}`).digest("hex");
}

function normalizeName(value) {
  return clean(value).replace(/\s+/g, "");
}

function compareEntries(a, b) {
  const time = a.startDatetime.localeCompare(b.startDatetime);
  if (time !== 0) return time;
  const project = a.projectName.localeCompare(b.projectName, "zh-Hans-CN");
  if (project !== 0) return project;
  return a.bibOrChip.localeCompare(b.bibOrChip, "zh-Hans-CN");
}
