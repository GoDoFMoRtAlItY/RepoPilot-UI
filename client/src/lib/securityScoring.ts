/**
 * Calculates a security score based on vulnerability counts.
 * Uses a diminishing returns formula: the first few vulnerabilities of a certain
 * severity hurt the score significantly, but subsequent ones hurt progressively less.
 * Weights can be tuned later if needed.
 */
export function calculateSecurityScore({ 
  critical = 0, 
  high = 0, 
  medium = 0, 
  low = 0 
}: { 
  critical?: number, 
  high?: number, 
  medium?: number, 
  low?: number 
}) {
  const penalty =
    10 * Math.sqrt(critical) +
    5  * Math.sqrt(high) +
    2  * Math.sqrt(medium) +
    0.5 * Math.sqrt(low);

  // Floor at 10 so a repo never shows a demoralizing 0
  return Math.max(10, Math.round(100 - penalty));
}
