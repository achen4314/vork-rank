import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vork Rank",
  description: "首都高校体能竞速邀请赛成绩查询",
  icons: {
    icon: "/brand/vork-icon.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
