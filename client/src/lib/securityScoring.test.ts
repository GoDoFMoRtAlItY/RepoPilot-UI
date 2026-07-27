import { describe, it, expect } from 'vitest';
import { calculateSecurityScore } from './securityScoring';

describe('calculateSecurityScore', () => {
  it('returns 100 when there are no vulnerabilities', () => {
    expect(calculateSecurityScore({})).toBe(100);
    expect(calculateSecurityScore({ critical: 0, high: 0, medium: 0, low: 0 })).toBe(100);
  });

  it('returns around 90 for 1 critical only', () => {
    const score = calculateSecurityScore({ critical: 1 });
    expect(score).toBe(90); // 100 - (10 * sqrt(1)) = 90
  });

  it('returns around 55 for mixed severities (8 crit, 6 high, 2 med, 12 low)', () => {
    const score = calculateSecurityScore({ critical: 8, high: 6, medium: 2, low: 12 });
    // Penalty:
    // 10 * sqrt(8) = ~28.28
    // 5 * sqrt(6) = ~12.25
    // 2 * sqrt(2) = ~2.83
    // 0.5 * sqrt(12) = ~1.73
    // Total penalty = ~45.09
    // Score = 100 - 45.09 = 54.91 -> 55
    expect(score).toBe(55);
  });

  it('returns around 33 for 20 critical and 20 high', () => {
    const score = calculateSecurityScore({ critical: 20, high: 20 });
    // Penalty:
    // 10 * sqrt(20) = ~44.72
    // 5 * sqrt(20) = ~22.36
    // Total penalty = ~67.08
    // Score = 100 - 67.08 = 32.92 -> 33
    expect(score).toBe(33);
  });

  it('floors at 10 for extreme cases (100 critical)', () => {
    const score = calculateSecurityScore({ critical: 100 });
    // Penalty: 10 * sqrt(100) = 100
    // 100 - 100 = 0 -> floors to 10
    expect(score).toBe(10);
  });

  it('calculates correctly for only lows', () => {
    const score = calculateSecurityScore({ low: 16 });
    // Penalty: 0.5 * sqrt(16) = 2
    // 100 - 2 = 98
    expect(score).toBe(98);
  });
});
