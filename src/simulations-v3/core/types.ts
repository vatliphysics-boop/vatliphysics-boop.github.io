/**
 * Core types for apparatus-first 3D simulations
 * Pure TypeScript contracts — no Three.js, no React
 */

/** Camera preset modes for apparatus viewing */
export type CameraMode =
  | "orbit"          // Free rotation around apparatus
  | "front"          // Front view
  | "back"           // Back view
  | "left"           // Left side
  | "right"          // Right side
  | "top"            // Top-down view
  | "cutaway"        // Cross-section view
  | "exploded"       // Exploded view with parts separated
  | "instrument"     // Point-of-view from a specific instrument
  | "measurement";   // View optimized for reading measurements

/** Apparatus component with localized names */
export interface ApparatusComponent {
  readonly id: string;
  readonly nameVi: string;
  readonly nameEn: string;
  readonly role: string;          // Function in Vietnamese
  readonly roleEn?: string;       // Function in English (optional)
  readonly category: "source" | "collimator" | "target" | "detector" | "structure" | "measurement" | "control";
}

/** Registry of all apparatus components */
export interface ComponentRegistry {
  readonly components: readonly ApparatusComponent[];
  getById(id: string): ApparatusComponent | undefined;
  getByCategory(category: ApparatusComponent["category"]): readonly ApparatusComponent[];
}

/** Physics state contract — apparatus-agnostic */
export interface PhysicsState<T = unknown> {
  readonly clock: number;         // Simulation time in appropriate units
  readonly running: boolean;
  readonly data: T;               // Physics-specific state
}

/** Physics engine contract */
export interface PhysicsEngine<TState, TAction> {
  readonly initialState: PhysicsState<TState>;
  step(state: PhysicsState<TState>, deltaTime: number): PhysicsState<TState>;
  dispatch(state: PhysicsState<TState>, action: TAction): PhysicsState<TState>;
  reset(): PhysicsState<TState>;
}

/** Measurement data point */
export interface MeasurementPoint {
  readonly timestamp: number;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
}

/** Histogram bin for angular distribution */
export interface HistogramBin {
  readonly angleDeg: number;      // Bin center angle
  readonly count: number;         // Event count
  readonly binWidthDeg: number;   // Bin width
}

/** Scientific source citation */
export interface ScientificSource {
  readonly label: string;
  readonly url: string;
  readonly citation?: string;
}
