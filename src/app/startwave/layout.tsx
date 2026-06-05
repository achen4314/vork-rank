import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "出发查询 — Vork Rank",
  description: "首都高校体能竞速邀请赛报名出发批次查询",
  openGraph: {
    title: "出发查询 — Vork Rank",
    description: "首都高校体能竞速邀请赛报名出发批次查询",
    url: "https://vorkrank.cn/startwave",
    siteName: "Vork Rank",
    type: "website",
  },
};

export default function StartwaveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
