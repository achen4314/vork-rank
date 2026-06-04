import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dataPath = path.join(root, "data", "rankings.json");
const seedPath = path.join(root, "database", "seed.sql");

const dataset = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const errors = [];

if (dataset.event?.slug !== "capital-college-fitness-2026") {
  errors.push("unexpected event slug");
}

if (!Array.isArray(dataset.results) || dataset.results.length !== 580) {
  errors.push(`expected 580 results, got ${dataset.results?.length ?? "none"}`);
}

if (!Array.isArray(dataset.splits) || dataset.splits.length < 4000) {
  errors.push(`expected split rows, got ${dataset.splits?.length ?? "none"}`);
}

const ranked = dataset.results.filter((entry) => entry.finalRank !== null).length;
const appliedPenalty = dataset.results.filter((entry) => entry.appliedPenaltyMs > 0).length;
const duplicateKeys = new Set();
const seenKeys = new Set();

for (const entry of dataset.results) {
  const key = `${entry.eventSlug}|${entry.divisionCode}|${entry.bib}`;
  if (seenKeys.has(key)) duplicateKeys.add(key);
  seenKeys.add(key);
}

if (ranked !== dataset.summary.ranked) {
  errors.push(`summary ranked mismatch: ${dataset.summary.ranked} vs ${ranked}`);
}

if (appliedPenalty !== dataset.summary.appliedPenaltyCount) {
  errors.push(
    `summary applied penalty mismatch: ${dataset.summary.appliedPenaltyCount} vs ${appliedPenalty}`,
  );
}

if (duplicateKeys.size > 0) {
  errors.push(`duplicate event/division/bib keys: ${Array.from(duplicateKeys).slice(0, 3).join(", ")}`);
}

if (!fs.existsSync(seedPath) || fs.statSync(seedPath).size < 1000000) {
  errors.push("database/seed.sql is missing or unexpectedly small");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `data ok: ${dataset.results.length} results, ${ranked} ranked, ${appliedPenalty} applied penalties, ${dataset.splits.length} splits`,
);
