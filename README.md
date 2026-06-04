# Vork Rank

首都高校体能竞速邀请赛最终排名查询页。这个仓库是独立部署版本，只包含查询网页、Supabase 表结构、数据导入脚本和 Vercel 配置，不依赖原来的完整 Vork Result 后端。

## 本地运行

```bash
pnpm install
pnpm run dev
```

打开 `http://localhost:3000`。

仓库已经包含 `data/rankings.json` 和 `database/seed.sql`。只有当你要从新版 Excel 重新生成数据时，才需要运行：

```bash
pnpm run build:data
```

## Supabase

1. 新建 Supabase 项目。
2. 在 SQL Editor 先运行 `database/schema.sql`。
3. 再运行 `database/seed.sql`。
4. 在 Vercel 环境变量里添加：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
```

本地直连导入可选：

```bash
SUPABASE_DB_URL="postgresql://postgres:[密码]@[主机]:5432/postgres" pnpm run import:supabase
```

## Vercel

Vercel 选择该仓库根目录即可：

```text
Framework Preset: Next.js
Build Command: pnpm run build
Install Command: pnpm install --frozen-lockfile
Output Directory: .next
```

域名添加 `vorkrank.cn` 和 `www.vorkrank.cn` 后，按 Vercel 提示在 DNS 控制台添加记录。

这个独立版不需要 Railway 后端；Next.js API routes 会优先读取 Supabase，未配置 Supabase 时直接读取仓库内静态 JSON。

## 数据口径

当前数据来自 `首都高校体能竞速邀请赛_各组项目最终排名.xlsx` 的 `最终排名总表`，以“最终名次 / 最终总成绩”为查询主口径；其中罚时字段保留“累计罚时”和“应用罚时”。页面会优先读取 Supabase；没有配置 Supabase 时，会使用仓库内的静态 JSON 兜底。
