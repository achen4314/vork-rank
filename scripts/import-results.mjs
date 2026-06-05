import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const root = process.cwd();
const EVENT = {
  slug: "capital-college-fitness-2026",
  name: "首都高校体能竞速邀请赛",
  eventDate: "2026-05-30",
  venue: "北京大学",
  timezone: "Asia/Shanghai",
};
const sourcePath =
  process.env.FINAL_RANKING_XLSX ??
  "/Users/lingchen/Desktop/首都高校体能竞速邀请赛_各组项目最终排名.xlsx";
const shouldImportDb = process.argv.includes("--import-db");

const workbook = xlsx.readFile(sourcePath, { cellDates: false });
const sheetName = workbook.SheetNames.includes("最终排名总表") ? "最终排名总表" : workbook.SheetNames[0];
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
const headerIndex = rows.findIndex((row) => row.includes("分类代码") && row.includes("最终总成绩"));
if (headerIndex < 0) {
  throw new Error(`Cannot locate header row in ${sourcePath}`);
}

const headers = rows[headerIndex].map((value) => clean(value));
const sourceUpdatedAt = new Date().toISOString();
const results = [];
const splits = [];

for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
  const row = rows[rowIndex];
  const bib = pick(row, headers, ["运动员号", "号码", "参赛号", "Bib"]);
  if (!bib) continue;

  const divisionCode = pick(row, headers, ["分类代码", "分组代码"]) || "UNKNOWN";
  const divisionName =
    pick(row, headers, ["排名分组", "分组", "分类", "组别项目"]) ||
    [pick(row, headers, ["组别"]), pick(row, headers, ["项目"])].filter(Boolean).join(" ");
  const groupName = pick(row, headers, ["组别"]) || divisionName || divisionCode;
  const projectName = pick(row, headers, ["项目"]) || "";
  const displayName =
    pick(row, headers, ["姓名", "队名", "运动员", "参赛者"]) ||
    pick(row, headers, ["团队名称"]) ||
    bib;
  const rawRank = parseRank(pick(row, headers, ["净名次", "原始名次"]));
  const finalRank = parseRank(pick(row, headers, ["最终名次", "名次"]));
  const netText = pick(row, headers, ["净成绩"]);
  const cumulativePenaltyText = pick(row, headers, ["累计罚时"]);
  const appliedPenaltyText = pick(row, headers, ["应用罚时", "罚时"]);
  const finalText = pick(row, headers, ["最终总成绩", "最终成绩", "总成绩"]);
  const status = inferStatus(row, headers, finalRank);

  const result = {
    eventSlug: EVENT.slug,
    divisionCode,
    divisionName: divisionName || divisionCode,
    groupName,
    projectName,
    bib,
    displayName,
    teamName: pick(row, headers, ["队伍", "队名", "团队"]),
    school: pick(row, headers, ["单位", "学校", "院校"]),
    gender: pick(row, headers, ["性别"]),
    rawRank,
    finalRank,
    status,
    netTimeMs: parseDuration(netText),
    cumulativePenaltyMs: parseDuration(cumulativePenaltyText) ?? 0,
    appliedPenaltyMs: parseDuration(appliedPenaltyText) ?? 0,
    finalTimeMs: parseDuration(finalText),
    netTimeText: netText,
    cumulativePenaltyText,
    appliedPenaltyText,
    finalTimeText: finalText,
    penaltyStatus: pick(row, headers, ["罚时状态", "处罚状态"]),
    note: pick(row, headers, ["违例/复核说明", "说明", "备注"]),
    sourceRow: rowIndex + 1,
  };
  results.push(result);

  splitHeaders(headers).forEach(({ key, label, index }, order) => {
    const text = clean(row[index]);
    if (!text) return;
    splits.push({
      eventSlug: EVENT.slug,
      divisionCode,
      bib,
      splitKey: key,
      splitLabel: label,
      splitOrder: order + 1,
      splitTimeMs: parseDuration(text),
      splitTimeText: text,
    });
  });
}

results.sort((a, b) => {
  if (a.divisionCode !== b.divisionCode) return a.divisionCode.localeCompare(b.divisionCode, "zh-Hans-CN");
  if (a.finalRank === null && b.finalRank !== null) return 1;
  if (a.finalRank !== null && b.finalRank === null) return -1;
  return (a.finalRank ?? 999999) - (b.finalRank ?? 999999) || (a.finalTimeMs ?? 999999999) - (b.finalTimeMs ?? 999999999);
});

const divisions = Array.from(
  new Map(results.map((entry) => [entry.divisionCode, { code: entry.divisionCode, name: entry.divisionName }])).values(),
);
const dataset = {
  event: { ...EVENT, sourceUpdatedAt },
  summary: {
    total: results.length,
    ranked: results.filter((entry) => entry.finalRank !== null).length,
    unranked: results.filter((entry) => entry.finalRank === null).length,
    divisionCount: divisions.length,
    appliedPenaltyCount: results.filter((entry) => entry.appliedPenaltyMs > 0).length,
    cumulativePenaltyCount: results.filter((entry) => entry.cumulativePenaltyMs > 0).length,
    sourceUpdatedAt,
  },
  filters: {
    groups: [...new Set(results.map((entry) => entry.groupName).filter(Boolean))].sort(),
    projects: [...new Set(results.map((entry) => entry.projectName).filter(Boolean))].sort(),
    divisions,
  },
  results,
  splits,
};

await fs.mkdir(path.join(root, "data"), { recursive: true });
await fs.mkdir(path.join(root, "database"), { recursive: true });
await fs.writeFile(path.join(root, "data", "rankings.json"), `${JSON.stringify(dataset, null, 2)}\n`);
await fs.writeFile(path.join(root, "database", "seed.sql"), buildSeedSql(dataset));

console.log(`rows: ${dataset.summary.total}`);
console.log(`ranked: ${dataset.summary.ranked}`);
console.log(`unranked: ${dataset.summary.unranked}`);
console.log(`applied_penalty: ${dataset.summary.appliedPenaltyCount}`);
console.log(`splits: ${dataset.splits.length}`);
console.log("wrote: data/rankings.json");
console.log("wrote: database/seed.sql");

if (shouldImportDb) {
  await importToDatabase(dataset);
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pick(row, headers, names) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) {
      const value = clean(row[index]);
      if (value) return value;
    }
  }
  return "";
}

function parseRank(value) {
  const text = clean(value);
  if (!text || /未|无|dnf|dns|dsq/i.test(text)) return null;
  const number = Number.parseInt(text, 10);
  return Number.isFinite(number) ? number : null;
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 && value <= 1 ? Math.round(value * 24 * 60 * 60 * 1000) : Math.round(value * 1000);
  }
  const text = clean(value);
  if (!text || text === "-" || text === "0") return text === "0" ? 0 : null;
  const parts = text.split(":").map((part) => Number.parseFloat(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  let seconds = 0;
  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  else seconds = parts[0];
  return Math.round(seconds * 1000);
}

function splitHeaders(headers) {
  const noteIndex = headers.findIndex((header) => ["违例/复核说明", "说明", "备注"].includes(header));
  return headers
    .map((header, index) => ({ key: slug(header || `split_${index}`), label: header, index }))
    .filter(({ label, index }) => index > noteIndex && /跑步|项目|第\d+区|分区|换项区|休息区|roxzone|split/i.test(label));
}

function inferStatus(row, headers, finalRank) {
  const explicitStatus = parseStatus(
    pick(row, headers, [
      "状态",
      "成绩状态",
      "排名状态",
      "完赛状态",
      "裁判状态",
      "Status",
      "status",
    ]),
  );
  if (explicitStatus) return explicitStatus;
  return finalRank === null ? "DNF" : "FINISHED";
}

function parseStatus(value) {
  const text = clean(value);
  if (!text) return "";
  const upper = text.toUpperCase();
  if (/\bDSQ\b|\bDQ\b|取消资格|成绩取消|犯规取消|取消排名/.test(upper)) return "DSQ";
  if (/\bDNS\b|未出发|未参赛|未到场|缺席|弃权未出发/.test(upper)) return "DNS";
  if (/\bDNF\b|未完赛|未完成|退赛|中退/.test(upper)) return "DNF";
  if (/\bFINISHED\b|\bOK\b|完赛|已完赛|有效成绩|正常/.test(upper)) return "FINISHED";
  return "";
}

function slug(value) {
  return clean(value).replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
}

function sql(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function buildSeedSql(dataset, { transaction = true } = {}) {
  const lines = [
    ...(transaction ? ["begin;"] : []),
    `delete from split_entries where event_slug = ${sql(dataset.event.slug)};`,
    `delete from result_entries where event_slug = ${sql(dataset.event.slug)};`,
    `delete from events where slug = ${sql(dataset.event.slug)};`,
    `insert into events (slug, name, event_date, venue, timezone, source_updated_at) values (${sql(dataset.event.slug)}, ${sql(dataset.event.name)}, ${sql(dataset.event.eventDate)}, ${sql(dataset.event.venue)}, ${sql(dataset.event.timezone)}, ${sql(dataset.event.sourceUpdatedAt)});`,
  ];
  for (const entry of dataset.results) {
    lines.push(
      `insert into result_entries (event_slug, division_code, division_name, group_name, project_name, bib, display_name, team_name, school, gender, raw_rank, final_rank, status, net_time_ms, cumulative_penalty_ms, applied_penalty_ms, final_time_ms, net_time_text, cumulative_penalty_text, applied_penalty_text, final_time_text, penalty_status, note, source_row) values (${[
        entry.eventSlug,
        entry.divisionCode,
        entry.divisionName,
        entry.groupName,
        entry.projectName,
        entry.bib,
        entry.displayName,
        entry.teamName,
        entry.school,
        entry.gender,
        entry.rawRank,
        entry.finalRank,
        entry.status,
        entry.netTimeMs,
        entry.cumulativePenaltyMs,
        entry.appliedPenaltyMs,
        entry.finalTimeMs,
        entry.netTimeText,
        entry.cumulativePenaltyText,
        entry.appliedPenaltyText,
        entry.finalTimeText,
        entry.penaltyStatus,
        entry.note,
        entry.sourceRow,
      ].map(sql).join(", ")});`,
    );
  }
  for (const split of dataset.splits) {
    lines.push(
      `insert into split_entries (event_slug, division_code, bib, split_key, split_label, split_order, split_time_ms, split_time_text) values (${[
        split.eventSlug,
        split.divisionCode,
        split.bib,
        split.splitKey,
        split.splitLabel,
        split.splitOrder,
        split.splitTimeMs,
        split.splitTimeText,
      ].map(sql).join(", ")});`,
    );
  }
  if (transaction) lines.push("commit;");
  lines.push("");
  return lines.join("\n");
}

async function importToDatabase(dataset) {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("SUPABASE_DB_URL is required for --import-db");
  const { Client } = await import("pg");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    await client.query("begin");
    await client.query(await fs.readFile(path.join(root, "database", "schema.sql"), "utf8"));
    await client.query(buildSeedSql(dataset, { transaction: false }));
    await client.query("commit");
  } catch (error) {
    if (connected) await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    if (connected) await client.end().catch(() => undefined);
  }
  console.log("imported to Supabase database");
}
