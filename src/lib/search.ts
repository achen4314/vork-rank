export function normalizeSearchTerm(value: string, maxLength = 80): string {
  return value
    .trim()
    .normalize("NFKC")
    .replace(/[,%_*()[\]{}'"`;\\|<>/]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, maxLength)
    .trim()
    .toLowerCase();
}
