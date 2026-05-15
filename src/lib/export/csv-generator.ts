/**
 * CSV generation utility for exporting analysis data.
 */

interface AnalysisCsvRow {
  handle: string;
  platform: string;
  vibeScore: number | null;
  aestheticScore: number;
  engagementScore: number | null;
  consistencyScore: number | null;
  growthPotentialScore: number | null;
  authenticityScore: number | null;
  engagementRate: number | null;
  analyzedAt: string;
}

interface SavedInfluencerCsvRow {
  handle: string;
  platform: string;
  displayName: string | null;
  vibeScore: number;
  tier: string | null;
  engagementRate: number;
  category: string | null;
  savedAt: string;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map((f) => {
      if (f == null) return "";
      if (typeof f === "number") return String(f);
      return escapeCsvField(String(f));
    })
    .join(",");
}

export function generateAnalysesCsv(rows: AnalysisCsvRow[]): string {
  const header = toCsvRow([
    "Handle",
    "Platform",
    "VibeScore",
    "AestheticScore",
    "EngagementScore",
    "ConsistencyScore",
    "GrowthScore",
    "AuthenticityScore",
    "EngagementRate",
    "AnalyzedAt",
  ]);

  const dataRows = rows.map((r) =>
    toCsvRow([
      r.handle,
      r.platform,
      r.vibeScore,
      r.aestheticScore,
      r.engagementScore,
      r.consistencyScore,
      r.growthPotentialScore,
      r.authenticityScore,
      r.engagementRate != null ? (r.engagementRate * 100).toFixed(2) + "%" : null,
      new Date(r.analyzedAt).toISOString(),
    ])
  );

  return [header, ...dataRows].join("\n");
}

export function generateSavedInfluencersCsv(rows: SavedInfluencerCsvRow[]): string {
  const header = toCsvRow([
    "Handle",
    "Platform",
    "DisplayName",
    "VibeScore",
    "Tier",
    "EngagementRate",
    "Category",
    "SavedAt",
  ]);

  const dataRows = rows.map((r) =>
    toCsvRow([
      r.handle,
      r.platform,
      r.displayName,
      r.vibeScore,
      r.tier,
      (r.engagementRate * 100).toFixed(2) + "%",
      r.category,
      new Date(r.savedAt).toISOString(),
    ])
  );

  return [header, ...dataRows].join("\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
