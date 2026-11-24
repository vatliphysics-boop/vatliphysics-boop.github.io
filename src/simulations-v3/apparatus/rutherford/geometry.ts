/**
 * Rutherford apparatus 3D builder — Three.js geometry
 * Creates each component as a distinct Three.js mesh group with stable partId (no duplicate meshes).
 *
 * Coordinate system: origin at gold foil center (D).
 *   +X: direction of initial alpha beam (source R → slit P → foil D → screen S at 0° position (1))
 *   +Y: scattering plane / up
 *   +Z: lateral
 *
 * Scale: detector screen radius 180 fm = 7.5 Three.js units.
 */

import * as THREE from "three";
import type { ApparatusComponent } from "../../core/types";

/** A built component with its Three.js object and metadata */
export interface BuiltComponent {
  readonly id: string;
  readonly mesh: THREE.Object3D;
  readonly component: ApparatusComponent;
  readonly originalPosition: THREE.Vector3;
  readonly originalRotation: THREE.Euler;
}

/** Materials for apparatus (reused to save memory) */
export function createMaterials() {
  return {
    brass: new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      metalness: 0.8,
      roughness: 0.35,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.9,
      roughness: 0.25,
    }),
    lead: new THREE.MeshStandardMaterial({
      color: 0x4a4a52,
      metalness: 0.4,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x3a2a00,
      emissiveIntensity: 0.2,
      metalness: 0.95,
      roughness: 0.2,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xaaddff,
      metalness: 0,
      roughness: 0.08,
      transmission: 0.85,
      thickness: 0.35,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
    zincSulfide: new THREE.MeshStandardMaterial({
      color: 0xd4f1f9,
      emissive: 0x164e63,
      emissiveIntensity: 0.35,
      metalness: 0.1,
      roughness: 0.6,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      metalness: 0.7,
      roughness: 0.5,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x6a6a70,
      metalness: 0,
      roughness: 0.95,
    }),
    black: new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.8,
    }),
    sourceCore: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.6,
      roughness: 0.3,
    }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

/**
 * Build the alpha source (R): internal active brass capsule + protruding emission nozzle.
 * Distinct from buildSourceHousing so no duplicate overlapping geometry is created.
 */
export function buildAlphaSource(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Internal active radioactive capsule
  const activeSource = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.4, 24),
    mat.sourceCore,
  );
  activeSource.rotation.z = -Math.PI / 2;
  activeSource.position.set(0.1, 0, 0);
  group.add(activeSource);

  // Brass exit nozzle protruding out the front of the lead shield for clear selection
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.48, 1.1, 24),
    mat.brass,
  );
  nozzle.rotation.z = -Math.PI / 2;
  nozzle.position.set(1.65, 0, 0);
  group.add(nozzle);

  group.position.set(-18, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the lead source housing surrounding source R.
 */
export function buildSourceHousing(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Outer lead housing — hollow cylinder
  const housingOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 3.0, 32, 1, true),
    mat.lead,
  );
  housingOuter.rotation.z = -Math.PI / 2;
  group.add(housingOuter);

  // Back lead cap
  const backCap = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32), mat.lead);
  backCap.position.set(-1.5, 0, 0);
  backCap.rotation.y = -Math.PI / 2;
  group.add(backCap);

  // Front cap with central exit aperture
  const frontCap = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 1.25, 32),
    mat.lead,
  );
  frontCap.position.set(1.5, 0, 0);
  frontCap.rotation.y = Math.PI / 2;
  group.add(frontCap);

  group.position.set(-18, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the collimator (P): a lead plate with narrow slit, collimating the beam.
 */
export function buildCollimator(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const slitWidth = 0.28;
  const sideWidth = (4 - slitWidth) / 2;

  const slitLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 4, sideWidth),
    mat.lead,
  );
  slitLeft.position.set(0, 0, -(4 + slitWidth) / 4);
  group.add(slitLeft);

  const slitRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 4, sideWidth),
    mat.lead,
  );
  slitRight.position.set(0, 0, (4 + slitWidth) / 4);
  group.add(slitRight);

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.2, slitWidth + 0.2),
    mat.darkMetal,
  );
  topBar.position.set(0, 1.4, 0);
  group.add(topBar);

  const bottomBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.2, slitWidth + 0.2),
    mat.darkMetal,
  );
  bottomBar.position.set(0, -1.4, 0);
  group.add(bottomBar);

  group.position.set(-10, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the gold foil (D): thin gold disc at apparatus center.
 */
export function buildGoldFoil(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const foil = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.06, 64),
    mat.gold,
  );
  foil.rotation.z = -Math.PI / 2;
  group.add(foil);

  group.position.set(0, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the foil holder: brass ring and support stem holding gold foil D at center.
 */
export function buildFoilHolder(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const holderRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.06, 0.11, 12, 64),
    mat.brass,
  );
  holderRing.rotation.y = Math.PI / 2;
  group.add(holderRing);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 2.5, 12),
    mat.brass,
  );
  stem.position.set(0, -3.3, 0);
  group.add(stem);

  group.position.set(0, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the scintillation screen (S): circular ZnS detector ring in the XY scattering plane.
 * Note: The trajectory lies in the Z=0 (XY) plane at detector radius 7.5 units,
 * so the ZnS ring lies in the XY plane around the foil center (0, 0, 0)!
 */
export function buildScintillationScreen(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // ZnS band in XY plane (axis along Z) surrounding foil D at r = 7.5
  const screenBand = new THREE.Mesh(
    new THREE.CylinderGeometry(7.48, 7.48, 1.1, 72, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xd4f1f9,
      emissive: 0x164e63,
      emissiveIntensity: 0.35,
      metalness: 0.1,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  screenBand.rotation.x = Math.PI / 2;
  group.add(screenBand);

  // Brass outer rim edges
  const rimFront = new THREE.Mesh(
    new THREE.TorusGeometry(7.55, 0.08, 10, 72),
    mat.brass,
  );
  rimFront.position.z = 0.55;
  group.add(rimFront);

  const rimBack = new THREE.Mesh(
    new THREE.TorusGeometry(7.55, 0.08, 10, 72),
    mat.brass,
  );
  rimBack.position.z = -0.55;
  group.add(rimBack);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

export const MICROSCOPE_RADIUS_UNITS = 7.5;

/**
 * Position and orient the rotating microscope (M) at a given scattering angle (0°..160°).
 * Local +X points radially outward from foil center (0,0,0) through screen S:
 *   - Mounting arm runs inward from screen to foil pivot
 *   - Objective lens sits just outside screen S looking inward at flashes
 *   - Eyepiece points radially outward for the human observer
 */
export function setMicroscopeAngle(
  built: BuiltComponent,
  angleDeg: number,
  explodedOffset?: readonly [number, number, number],
): void {
  const rad = (angleDeg * Math.PI) / 180;
  const ox = explodedOffset?.[0] ?? 0;
  const oy = explodedOffset?.[1] ?? 0;
  const oz = explodedOffset?.[2] ?? 0;

  built.mesh.position.set(
    MICROSCOPE_RADIUS_UNITS * Math.cos(rad) + ox,
    MICROSCOPE_RADIUS_UNITS * Math.sin(rad) + oy,
    oz,
  );
  built.mesh.rotation.set(0, 0, rad);
}

/**
 * Build the rotating microscope (M): mounted on a rotating arm around foil center.
 */
export function buildRotatingMicroscope(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Objective lens facing inward toward ZnS screen (at local x = +0.35)
  const objective = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.35, 16),
    mat.steel,
  );
  objective.rotation.z = -Math.PI / 2;
  objective.position.set(0.35, 0, 0);
  group.add(objective);

  // Microscope barrel (local x = +0.5 to +2.5)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 2.0, 20),
    mat.darkMetal,
  );
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(1.5, 0, 0);
  group.add(barrel);

  // Eyepiece where observer places eye (local x = +2.7)
  const eyepiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 0.5, 20),
    mat.brass,
  );
  eyepiece.rotation.z = -Math.PI / 2;
  eyepiece.position.set(2.7, 0, 0);
  group.add(eyepiece);

  // Rotating radial arm from center pivot (local x = -7.5) to screen mount (local x = 0)
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 5.2, 10),
    mat.steel,
  );
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-2.7, 0, 0.65);
  group.add(arm);

  const built: BuiltComponent = {
    id: component.id,
    mesh: group,
    component,
    originalPosition: new THREE.Vector3(MICROSCOPE_RADIUS_UNITS, 0, 0),
    originalRotation: new THREE.Euler(0, 0, 0),
  };

  setMicroscopeAngle(built, 0);
  return built;
}

/**
 * Build the angular scale: protractor arc around the foil (0° to 180°).
 */
export function buildAngularScale(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const arcRadius = 8.2;
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(arcRadius, 0.05, 6, 128, (200 * Math.PI) / 180),
    mat.steel,
  );
  arc.rotation.z = (-10 * Math.PI) / 180;
  group.add(arc);

  for (let deg = 0; deg <= 180; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.09, 0.09),
      mat.steel,
    );
    tick.position.set(
      arcRadius * Math.cos(rad),
      arcRadius * Math.sin(rad),
      0,
    );
    tick.rotation.z = rad;
    group.add(tick);
  }

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the vacuum chamber frame (G): metallic end flanges and tie rods.
 */
export function buildVacuumChamber(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const flangeLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(9.35, 9.35, 0.5, 64),
    mat.brass,
  );
  flangeLeft.rotation.z = -Math.PI / 2;
  flangeLeft.position.set(-16, 0, 0);
  group.add(flangeLeft);

  const flangeRight = new THREE.Mesh(
    new THREE.CylinderGeometry(9.35, 9.35, 0.5, 64),
    mat.brass,
  );
  flangeRight.rotation.z = -Math.PI / 2;
  flangeRight.position.set(16, 0, 0);
  group.add(flangeRight);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the transparent glass window wall of vacuum chamber (G).
 * Distinct from buildVacuumChamber so glass is rendered once with depthWrite=false.
 */
export function buildChamberWindow(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const windowShell = new THREE.Mesh(
    new THREE.CylinderGeometry(9.0, 9.0, 31.5, 64, 1, true),
    mat.glass,
  );
  windowShell.rotation.z = -Math.PI / 2;
  windowShell.renderOrder = 2;
  group.add(windowShell);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the base platform: concrete slab supporting everything.
 */
export function buildBasePlatform(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.8, 24),
    mat.concrete,
  );
  group.add(slab);

  const legPositions = [
    [-16, 0, -9],
    [-16, 0, 9],
    [16, 0, -9],
    [16, 0, 9],
  ];
  for (const [x, , z] of legPositions) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 4, 1.5),
      mat.darkMetal,
    );
    leg.position.set(x, -2.4, z);
    group.add(leg);
  }

  group.position.set(0, -10.2, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Deterministic sample angles (in degrees) illustrating experimental flash density on ZnS screen S:
 * Dense cluster near 0° (Position 1), sparse at medium angles, isolated rare spot > 90° (Position 2).
 */
const SAMPLE_SCINTILLATION_SPOTS: readonly { readonly deg: number; readonly z: number }[] = [
  { deg: -6, z: -0.18 },
  { deg: -4, z: 0.14 },
  { deg: -2.5, z: -0.06 },
  { deg: -1.2, z: 0.2 },
  { deg: -0.5, z: -0.12 },
  { deg: 0, z: 0.04 },
  { deg: 0.8, z: -0.22 },
  { deg: 1.6, z: 0.16 },
  { deg: 2.8, z: -0.08 },
  { deg: 4.2, z: 0.12 },
  { deg: 6.5, z: -0.15 },
  { deg: 11, z: 0.18 },
  { deg: -12, z: -0.1 },
  { deg: 22, z: -0.16 },
  { deg: -25, z: 0.14 },
  { deg: 42, z: 0.08 },
  { deg: 72, z: -0.12 },
  { deg: 142, z: 0.05 }, // Rare backscatter flash at Position (2) (> 90°)
];

/**
 * Build Layer 1: Experimental ZnS scintillation spots (sample density + bright flash at run.hit).
 */
export function buildScintillationLayer(
  hitPoint3D: THREE.Vector3 | null,
  showActiveHitFlash: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const sampleRadius = 7.38;

  const sampleGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const sampleMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.72,
  });

  for (const spot of SAMPLE_SCINTILLATION_SPOTS) {
    const rad = (spot.deg * Math.PI) / 180;
    const dot = new THREE.Mesh(sampleGeo, sampleMat);
    dot.position.set(
      sampleRadius * Math.cos(rad),
      sampleRadius * Math.sin(rad),
      spot.z,
    );
    group.add(dot);
  }

  if (hitPoint3D && showActiveHitFlash) {
    const coreFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x86efac }),
    );
    coreFlash.position.copy(hitPoint3D);
    group.add(coreFlash);

    const glowHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.62, 24),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      }),
    );
    glowHalo.position.copy(hitPoint3D);
    group.add(glowHalo);
  }

  return group;
}

/**
 * Build all components of the Rutherford apparatus without duplicating any mesh.
 * Returns a map from partId to BuiltComponent.
 */
export function buildRutherfordApparatus(
  components: readonly ApparatusComponent[],
): Map<string, BuiltComponent> {
  const mat = createMaterials();
  const result = new Map<string, BuiltComponent>();

  const builders: Record<string, (c: ApparatusComponent, m: Materials) => BuiltComponent> = {
    "alpha-source": buildAlphaSource,
    "source-housing": buildSourceHousing,
    collimator: buildCollimator,
    "gold-foil": buildGoldFoil,
    "foil-holder": buildFoilHolder,
    "scintillation-screen": buildScintillationScreen,
    "rotating-microscope": buildRotatingMicroscope,
    "angular-scale": buildAngularScale,
    "vacuum-chamber": buildVacuumChamber,
    "chamber-window": buildChamberWindow,
    "base-platform": buildBasePlatform,
  };

  for (const component of components) {
    const builder = builders[component.id];
    if (builder) {
      result.set(component.id, builder(component, mat));
    } else {
      console.warn(`[Rutherford] No 3D builder for component ${component.id}`);
    }
  }

  return result;
}
