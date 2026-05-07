/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between 0 and 1, scaled to 0-100 for Brand Fit Score.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate Brand Fit Score (0-100) from cosine similarity.
 * Applies a sigmoid-like transformation to spread scores more evenly.
 */
export function calculateBrandFitScore(
  brandVector: number[],
  influencerVector: number[]
): number {
  const similarity = cosineSimilarity(brandVector, influencerVector);

  // Transform: raw cosine similarity (typically 0.5-1.0 range)
  // to a more spread 0-100 score
  const normalized = Math.max(0, (similarity - 0.3) / 0.7);
  return Math.round(normalized * 100);
}
