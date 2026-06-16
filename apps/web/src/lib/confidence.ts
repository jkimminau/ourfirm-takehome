/**
 * Confidence tiers for region detection. Signatures in particular are inherently
 * uncertain (a footer can resemble a signature), so anything below "high" is
 * surfaced with a colour + a nudge to eyeball the crop.
 */
export type ConfidenceTier = "high" | "moderate" | "low";

export function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "moderate";
  return "low";
}

export const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "High confidence",
  moderate: "Moderate · double-check the crop",
  low: "Low · verify the crop",
};
