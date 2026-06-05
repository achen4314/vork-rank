import type { MetadataRoute } from "next";
import { getStaticDataset } from "@/lib/localData";
import { resultHref } from "@/lib/resultLinks";

const siteUrl = "https://vorkrank.cn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  try {
    const dataset = await getStaticDataset();
    const updatedAt = dataset.event.sourceUpdatedAt ? new Date(dataset.event.sourceUpdatedAt) : now;
    const rankedDetails = dataset.results
      .filter((entry) => entry.finalRank !== null)
      .slice(0, 250)
      .map((entry) => ({
        url: `${siteUrl}${resultHref(entry)}`,
        lastModified: updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [
      {
        url: siteUrl,
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${siteUrl}/startwave`,
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      ...rankedDetails,
    ];
  } catch {
    return [
      {
        url: siteUrl,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${siteUrl}/startwave`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
      },
    ];
  }
}
