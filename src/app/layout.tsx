import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://vorkrank.cn";
const title = "Vork Rank";
const description = "首都高校体能竞速邀请赛成绩查询、分段分析与个人成绩单。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: title,
    title,
    description,
    images: [
      {
        url: "/brand/vork-icon.png",
        width: 512,
        height: 512,
        alt: "Vork Rank",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/brand/vork-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/brand/vork-icon.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "首都高校体能竞速邀请赛",
    url: siteUrl,
    organizer: {
      "@type": "Organization",
      name: "VORK",
    },
  };

  return (
    <html lang="zh-CN">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
      </body>
    </html>
  );
}
