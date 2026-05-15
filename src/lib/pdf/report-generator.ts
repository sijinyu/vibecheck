import jsPDF from "jspdf";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import { getScoreGrade } from "@/lib/score-utils";

interface ReportData {
  handle: string;
  platform: string;
  displayName?: string | null;
  scores: AestheticScores;
  vibeScore?: VibeScoreResult | null;
  summary: string;
}

export function generateInfluencerReport(data: ReportData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ─── Header ───────────────────────────────────────────────
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("VibeCheck", 20, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text("Influencer Analysis Report", 20, y + 16);

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`@${data.handle}`, 20, y + 28);

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `${data.platform === "instagram" ? "Instagram" : "TikTok"} · ${new Date().toLocaleDateString("ko-KR")}`,
    20,
    y + 34
  );

  y = 55;
  doc.setTextColor(30, 30, 30);

  // ─── VibeScore Section ────────────────────────────────────
  const mainScore = data.vibeScore?.vibeScore ?? data.scores.overall;
  const scoreLabel = data.vibeScore ? "VibeScore" : "Aesthetic Score";
  const grade = getScoreGrade(mainScore);

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, y, pageWidth - 30, 30, 3, 3, "F");

  doc.setFontSize(28);
  doc.setTextColor(139, 92, 246); // primary purple
  doc.text(String(mainScore), 30, y + 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${scoreLabel} · Grade ${grade}`, 55, y + 14);

  if (data.vibeScore?.tier) {
    doc.text(
      `Tier: ${data.vibeScore.tier.toUpperCase()} · ER: ${(data.vibeScore.engagementRate * 100).toFixed(2)}%`,
      55,
      y + 22
    );
  }

  y += 40;

  // ─── Sub-scores ───────────────────────────────────────────
  if (data.vibeScore) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("VibeScore Breakdown", 15, y);
    y += 8;

    const vibeScores = [
      { label: "Aesthetic", value: data.scores.overall, weight: "25%" },
      { label: "Engagement", value: data.vibeScore.engagementScore, weight: "30%" },
      { label: "Consistency", value: data.vibeScore.consistencyScore, weight: "15%" },
      { label: "Growth Potential", value: data.vibeScore.growthPotentialScore, weight: "15%" },
      { label: "Authenticity", value: data.vibeScore.authenticityScore, weight: "15%" },
    ];

    for (const s of vibeScores) {
      drawScoreBar(doc, 15, y, s.label, s.value, s.weight, pageWidth - 30);
      y += 10;
    }

    y += 5;
  }

  // ─── Aesthetic Sub-scores ─────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("Aesthetic Analysis", 15, y);
  y += 8;

  const aestheticScores = [
    { label: "Color Harmony", value: data.scores.color },
    { label: "Composition", value: data.scores.composition },
    { label: "Tone Consistency", value: data.scores.toneConsistency },
    { label: "Trend Alignment", value: data.scores.trend },
    { label: "Style Originality", value: data.scores.styleOriginality },
  ];

  for (const s of aestheticScores) {
    drawScoreBar(doc, 15, y, s.label, s.value, undefined, pageWidth - 30);
    y += 10;
  }

  y += 5;

  // ─── AI Summary ───────────────────────────────────────────
  if (data.summary) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("AI Analysis Summary", 15, y);
    y += 7;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 30);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 4.5 + 5;
  }

  // ─── Insights ─────────────────────────────────────────────
  if (data.vibeScore?.insights && data.vibeScore.insights.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Key Insights", 15, y);
    y += 7;

    for (const insight of data.vibeScore.insights) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const icon =
        insight.type === "strength" ? "●" : insight.type === "warning" ? "▲" : "◆";
      const color =
        insight.type === "strength"
          ? [34, 197, 94]
          : insight.type === "warning"
            ? [245, 158, 11]
            : [59, 130, 246];

      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(9);
      doc.text(`${icon} ${insight.title}`, 15, y);
      y += 4.5;

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(insight.description, pageWidth - 35);
      doc.text(descLines, 20, y);
      y += descLines.length * 3.5 + 3;
    }
  }

  // ─── Metrics Table ────────────────────────────────────────
  if (data.vibeScore) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Performance Metrics", 15, y);
    y += 8;

    const metrics = [
      ["Avg. Likes/Post", String(Math.round(data.vibeScore.avgLikesPerPost))],
      ["Avg. Comments/Post", String(Math.round(data.vibeScore.avgCommentsPerPost))],
      ["Posting Frequency", `Every ${data.vibeScore.postingFrequencyDays.toFixed(1)} days`],
      ["Engagement Rate", `${(data.vibeScore.engagementRate * 100).toFixed(2)}%`],
    ];

    doc.setFontSize(9);
    for (const [label, value] of metrics) {
      doc.setTextColor(100, 100, 100);
      doc.text(label, 20, y);
      doc.setTextColor(30, 30, 30);
      doc.text(value, 100, y);
      y += 6;
    }
  }

  // ─── Footer ───────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated by VibeCheck · ${new Date().toISOString().split("T")[0]}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc;
}

function drawScoreBar(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: number,
  suffix: string | undefined,
  maxWidth: number
): void {
  const barX = x + 55;
  const barWidth = maxWidth - 80;
  const barHeight = 5;

  // Label
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(label, x, y + 4);

  // Background bar
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(barX, y, barWidth, barHeight, 1, 1, "F");

  // Filled bar
  const fillWidth = (value / 100) * barWidth;
  const r = value >= 80 ? 139 : value >= 60 ? 245 : 156;
  const g = value >= 80 ? 92 : value >= 60 ? 158 : 163;
  const b = value >= 80 ? 246 : value >= 60 ? 11 : 175;
  doc.setFillColor(r, g, b);
  doc.roundedRect(barX, y, fillWidth, barHeight, 1, 1, "F");

  // Value
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const valueText = suffix ? `${value} (${suffix})` : String(value);
  doc.text(valueText, barX + barWidth + 3, y + 4);
}
