/**
 * Rutherford scattering physics engine — pure functions
 * No React, no Three.js dependencies
 *
 * Physics model: Classical Coulomb repulsion between an alpha particle (Z=2)
 * and a gold nucleus (Z=79). The gold nucleus is fixed at origin. Electrons
 * are ignored (charge neutralization at short range). Nuclear interactions
 * not modeled. Recoil of gold nucleus not modeled.
 *
 * Reference: Rutherford, E. (1911). The Scattering of α and β Particles by
 * Matter and the Structure of the Atom. Phil. Mag. 21(125), 669–688.
 *
 * All lengths are in femtometers (fm), energies in MeV, time in zeptoseconds (zs).
 */

import type { HistogramBin } from "../core/types";

// CODATA 2022 constants
const CODATA = {
  ALPHA_REST_ENERGY_MEV: 3727.3794118,
  LIGHT_SPEED_FM_PER_ZS: 299.792458,
  COULOMB_CONSTANT_MEV_FM: 1.43996455,
} as const;

// Gold nucleus properties
export const RUTHERFORD_GOLD_Z = 79;
export const RUTHERFORD_ALPHA_Z = 2;

// Detector radius (arbitrary for visualization)
export const RUTHERFORD_DETECTOR_RADIUS_FM = 180;

// Coulomb factor for alpha-gold interaction
export const RUTHERFORD_COULOMB_MEV_FM =
  CODATA.COULOMB_CONSTANT_MEV_FM * RUTHERFORD_ALPHA_Z * RUTHERFORD_GOLD_Z;

/** Valid parameter ranges for the experiment */
export const RUTHERFORD_LIMITS = {
  impactFm: { min: 0, max: 100 },
  energyMeV: { min: 3, max: 10 },
} as const;

/** Experiment settings */
export interface RutherfordSettings {
  readonly impactFm: number;
  readonly energyMeV: number;
}

export const RUTHERFORD_COMPARISON: readonly RutherfordSettings[] = [
  { impactFm: 90, energyMeV: 8 },
  { impactFm: 10, energyMeV: 8 },
] as const;

/** A point on the computed trajectory */
export interface RutherfordSample {
  readonly xFm: number;
  readonly yFm: number;
  readonly vxFmPerZs: number;
  readonly vyFmPerZs: number;
  readonly radiusFm: number;
  readonly elapsedZs: number;
}

/** Internal geometry parameters */
interface CoulombGeometry {
  readonly semiMajorFm: number;
  readonly focalDistanceFm: number;
  readonly parameterLimit: number;
  readonly speedAtInfinityFmPerZs: number;
}

/** Complete simulation run result */
export interface RutherfordRun extends RutherfordSettings {
  readonly durationZs: number;
  readonly scatteringAngleDeg: number;
  readonly detectorAngleDeg: number;
  readonly closestApproachFm: number;
  readonly start: RutherfordSample;
  readonly hit: RutherfordSample;
  readonly geometry: CoulombGeometry;
}

/**
 * Compute a trajectory sample at parameter u (hyperbolic parameter).
 * Uses the general solution for repulsive Coulomb scattering.
 */
function pointAtParameter(
  impactFm: number,
  geometry: CoulombGeometry,
  u: number,
  elapsedZs: number,
): RutherfordSample {
  const { semiMajorFm: a, focalDistanceFm: c, speedAtInfinityFmPerZs: v } = geometry;
  const cosh = Math.cosh(u);
  const sinh = Math.sinh(u);
  const radiusFm = a + c * cosh;

  // In periapsis axes the repulsive branch is (a cosh(u) + c, b sinh(u)).
  // Rotation gives the incoming asymptote y = b, travelling towards positive x.
  const xFm = (-a * (a * cosh + c) + impactFm ** 2 * sinh) / c;
  const yFm = impactFm + a * impactFm * Math.exp(u) / c;

  // The Coulomb time law gives du/dt = v∞ / r, including the b = 0 limit.
  return {
    xFm,
    yFm,
    vxFmPerZs: ((impactFm ** 2 * cosh - a ** 2 * sinh) / c) * v / radiusFm,
    vyFmPerZs: (a * impactFm * Math.exp(u) / c) * v / radiusFm,
    radiusFm,
    elapsedZs,
  };
}

/**
 * Invert the time law: given time from periapsis, find parameter u.
 * The time law t(u) is strictly increasing, so bisection works.
 */
function timeFromPeriapsis(geometry: CoulombGeometry, u: number): number {
  return (
    (geometry.semiMajorFm * u + geometry.focalDistanceFm * Math.sinh(u)) /
    geometry.speedAtInfinityFmPerZs
  );
}

/**
 * Create a complete Rutherford scattering run with given parameters.
 * Throws RangeError if parameters are outside valid limits.
 */
export function createRutherfordRun({
  impactFm,
  energyMeV,
}: RutherfordSettings): RutherfordRun {
  const impact = RUTHERFORD_LIMITS.impactFm;
  const energy = RUTHERFORD_LIMITS.energyMeV;

  if (
    !Number.isFinite(impactFm) ||
    impactFm < impact.min ||
    impactFm > impact.max ||
    !Number.isFinite(energyMeV) ||
    energyMeV < energy.min ||
    energyMeV > energy.max
  ) {
    throw new RangeError("Tham số tán xạ nằm ngoài miền khảo sát.");
  }

  const semiMajorFm = RUTHERFORD_COULOMB_MEV_FM / (2 * energyMeV);
  const focalDistanceFm = Math.hypot(semiMajorFm, impactFm);

  const geometry: CoulombGeometry = {
    semiMajorFm,
    focalDistanceFm,
    parameterLimit: Math.acosh(
      (RUTHERFORD_DETECTOR_RADIUS_FM - semiMajorFm) / focalDistanceFm,
    ),
    speedAtInfinityFmPerZs:
      CODATA.LIGHT_SPEED_FM_PER_ZS *
      Math.sqrt((2 * energyMeV) / CODATA.ALPHA_REST_ENERGY_MEV),
  };

  const durationZs = 2 * timeFromPeriapsis(geometry, geometry.parameterLimit);
  const hit = pointAtParameter(impactFm, geometry, geometry.parameterLimit, durationZs);

  return {
    impactFm,
    energyMeV,
    geometry,
    durationZs,
    scatteringAngleDeg: 2 * Math.atan2(semiMajorFm, impactFm) * (180 / Math.PI),
    detectorAngleDeg: Math.atan2(hit.yFm, hit.xFm) * (180 / Math.PI),
    closestApproachFm: semiMajorFm + focalDistanceFm,
    start: pointAtParameter(impactFm, geometry, -geometry.parameterLimit, 0),
    hit,
  };
}

/**
 * Sample the trajectory at given elapsed time.
 * Clamps to start/hit if time is out of range.
 */
export function sampleRutherford(
  run: RutherfordRun,
  elapsedZs: number,
): RutherfordSample {
  if (!Number.isFinite(elapsedZs)) {
    throw new RangeError("Thời gian mô hình phải hữu hạn.");
  }
  if (elapsedZs <= 0) return run.start;
  if (elapsedZs >= run.durationZs) return run.hit;

  const centeredTime = elapsedZs - run.durationZs / 2;
  if (centeredTime === 0) {
    return pointAtParameter(run.impactFm, run.geometry, 0, elapsedZs);
  }

  // Invert the strictly increasing time law, without numerical time stepping.
  let low = -run.geometry.parameterLimit;
  let high = run.geometry.parameterLimit;
  for (let i = 0; i < 48; i += 1) {
    const mid = (low + high) / 2;
    if (timeFromPeriapsis(run.geometry, mid) < centeredTime) low = mid;
    else high = mid;
  }
  return pointAtParameter(run.impactFm, run.geometry, (low + high) / 2, elapsedZs);
}

/**
 * Generate a trail of trajectory points for visualization.
 */
export function rutherfordTrail(
  run: RutherfordRun,
  elapsedZs = run.durationZs,
  points = 120,
): RutherfordSample[] {
  if (!Number.isSafeInteger(points) || points < 2) {
    throw new RangeError("Cần ít nhất hai điểm trên quỹ đạo.");
  }
  const span = sampleRutherford(run, elapsedZs).elapsedZs;
  return Array.from({ length: points }, (_, index) =>
    sampleRutherford(run, span * (index / (points - 1))),
  );
}

/**
 * Generate a histogram of scattering angles from a set of impact parameters.
 * This models the angular distribution expected from Geiger–Marsden experiment.
 *
 * Each impact parameter b corresponds to scattering angle θ via:
 *   tan(θ/2) = kZ₁Z₂e² / (2Eb)
 *
 * Note: This assumes uniform distribution in b (which is not physically accurate
 * for a real foil, where the distribution in b² is uniform). The histogram is
 * illustrative, showing how angle depends on impact parameter.
 */
export function generateAngularHistogram(
  settings: RutherfordSettings[],
  binWidthDeg: number = 10,
): HistogramBin[] {
  if (binWidthDeg <= 0) {
    throw new RangeError("Độ rộng bin phải dương.");
  }

  // Generate runs and collect scattering angles
  const angles: number[] = [];
  for (const setting of settings) {
    try {
      const run = createRutherfordRun(setting);
      angles.push(run.scatteringAngleDeg);
    } catch {
      // Skip out-of-range settings
    }
  }

  // Bin the angles (0–180 degrees)
  const numBins = Math.ceil(180 / binWidthDeg);
  const bins: number[] = new Array(numBins).fill(0);

  for (const angle of angles) {
    const binIndex = Math.min(Math.floor(angle / binWidthDeg), numBins - 1);
    bins[binIndex] += 1;
  }

  return bins.map((count, i) => ({
    angleDeg: i * binWidthDeg + binWidthDeg / 2,
    count,
    binWidthDeg,
  }));
}

/**
 * Generate a synthetic angular histogram representing the Geiger–Marsden result.
 * Uses the Rutherford scattering formula for differential cross-section:
 *   dσ/dΩ ∝ 1/sin⁴(θ/2)
 *
 * This produces the characteristic distribution: most particles at small angles,
 * very few at large angles. Normalized to a total count.
 */
export function generateRutherfordDistribution(
  totalCount: number = 8000,
  binWidthDeg: number = 10,
  seed: number = 42,
): HistogramBin[] {
  if (totalCount <= 0 || binWidthDeg <= 0) {
    throw new RangeError("Số đếm và độ rộng bin phải dương.");
  }

  // Simple seeded RNG (Mulberry32)
  let state = seed;
  function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Sample angles from 1/sin⁴(θ/2) distribution
  const angles: number[] = [];

  // CDF of dσ/dΩ ∝ 1/sin⁴(θ/2) has closed form:
  // Integrate over solid angle: sin θ dθ / sin⁴(θ/2)
  // Let u = θ/2, then dθ = 2du, sin θ = 2 sin u cos u, sin⁴ u
  // dσ/dθ ∝ (2 sin u cos u · 2du) / sin⁴ u ∝ cos u / sin³ u du
  // ∫ cos u / sin³ u du = -1/(2 sin² u) → CDF(u) ∝ 1/sin² u
  // Normalize: CDF(θ) = (1/sin²(θ/2) - 1) / (1/sin²(θ_min/2) - 1)
  // Inverse: sin²(θ/2) = 1 / (1 + u·(1/sin²(θ_min/2) - 1))

  const thetaMin = 2; // degrees
  const sinMinHalf = Math.sin((thetaMin / 2) * (Math.PI / 180));
  const invNorm = 1 / (sinMinHalf * sinMinHalf) - 1;

  for (let i = 0; i < totalCount; i += 1) {
    const u = random();
    const sinHalf = 1 / Math.sqrt(1 + u * invNorm);
    const halfAngleRad = Math.asin(Math.min(sinHalf, 1));
    const angleDeg = (2 * halfAngleRad * 180) / Math.PI;
    angles.push(angleDeg);
  }

  // Bin the angles
  const numBins = Math.ceil(180 / binWidthDeg);
  const bins: number[] = new Array(numBins).fill(0);

  for (const angle of angles) {
    const binIndex = Math.min(Math.floor(angle / binWidthDeg), numBins - 1);
    bins[binIndex] += 1;
  }

  return bins.map((count, i) => ({
    angleDeg: i * binWidthDeg + binWidthDeg / 2,
    count,
    binWidthDeg,
  }));
}
