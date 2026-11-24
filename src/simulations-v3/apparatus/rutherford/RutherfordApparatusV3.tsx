"use client";

/**
 * RutherfordApparatusV3 — Apparatus-first 3D Rutherford scattering simulation
 *
 * Features:
 * - Interactive 3D apparatus built from scientific equipment components (SGK Hình 21.2: R, P, D, S, M, G)
 * - 10 camera presets (orbit, front, top, cutaway, exploded, instrument POV, etc.)
 * - 2-way synced Core Parts Identification Bar (touch-friendly at 390px)
 * - 2 independent display layer toggles:
 *     Layer 1: ZnS scintillation flashes (experimental observable)
 *     Layer 2: Alpha particle trajectory (explanatory model curve)
 * - Rotating microscope M control (0° Position (1) → 160° Position (2)) synced with 3D + 21.2a↔21.2b cross-section & eyepiece field of view (~10⁴ frequency ratio)
 * - Persistent state via localStorage ("b21-rutherford-v3-state-v1") using useSyncExternalStore
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  createRutherfordRun,
  generateRutherfordDistribution,
  rutherfordTrail,
  RUTHERFORD_LIMITS,
  type RutherfordSettings,
} from "../../physics/rutherford-engine";
import {
  buildRutherfordApparatus,
  buildScintillationLayer,
  setMicroscopeAngle,
  type BuiltComponent,
} from "./geometry";
import {
  CORE_SGK_21_2_PARTS,
  CUTAWAY_HIDDEN_PARTS,
  describeObserverPosition,
  INITIAL_RUTHERFORD_V3_STATE,
  parseRutherfordV3State,
  resolveRutherfordRaycastPart,
  RUTHERFORD_COMPONENTS,
  sampleEqualTimeFlashCount,
} from "./parts";
import { evaluateRutherfordInquiry } from "./inquiry";
import {
  CAMERA_PRESETS,
  type CameraMode,
} from "../../core/CameraPresets";
import type { HistogramBin } from "../../core/types";
import {
  getRutherfordV3RawSnapshot,
  RutherfordInquiryTask,
  subscribeRutherfordV3Storage,
  writeRutherfordV3State,
  type InquiryRun,
} from "@/components/learning/RutherfordInquiryTask";

const EMPTY_RAW = () => "";

/** Camera positions for each preset (Three.js units) */
const CAMERA_POSITIONS: Record<CameraMode, { pos: [number, number, number]; target: [number, number, number] }> = {
  orbit: { pos: [12, 10, 20], target: [0, 0, 0] },
  front: { pos: [-25, 6, 4], target: [-4, 0, 0] },
  back: { pos: [24, 6, 4], target: [4, 0, 0] },
  left: { pos: [0, 6, -22], target: [0, 0, 0] },
  right: { pos: [0, 6, 22], target: [0, 0, 0] },
  top: { pos: [0, 26, 0.01], target: [0, 0, 0] },
  cutaway: { pos: [12, 9, 16], target: [0, 0, 0] },
  exploded: { pos: [0, 9, 32], target: [0, 0, 0] },
  instrument: { pos: [11, 2, 3], target: [6.5, 0, 0] },
  measurement: { pos: [6, 12, 16], target: [0, 0, 0] },
};

/** Exploded view offsets per component */
const EXPLODED_OFFSETS: Record<string, [number, number, number]> = {
  "alpha-source": [-8, 0, 0],
  "source-housing": [-12, 0, 0],
  collimator: [-4, 0, 0],
  "gold-foil": [0, 0, 0],
  "foil-holder": [0, -3.5, 0],
  "scintillation-screen": [4, 0, 0],
  "rotating-microscope": [5, 3, 0],
  "angular-scale": [2, -4, 0],
  "vacuum-chamber": [0, 8, 0],
  "chamber-window": [0, 10.5, 0],
  "base-platform": [0, -4, 0],
};

/** Tọa độ đốm sáng mẫu cố định trong thị trường kính hiển vi M (không dùng Math.random khi render) */
const EYEPIECE_FLASH_SPOTS: readonly [number, number, number][] = [
  [0, 0, 4.2],
  [-14, -8, 3.4],
  [16, 10, 3.6],
  [-8, 18, 3.0],
  [12, -16, 3.2],
  [-24, 6, 2.8],
  [22, -4, 2.9],
  [4, 26, 2.7],
  [-18, -24, 2.6],
  [28, 18, 2.5],
  [-30, -10, 2.6],
  [8, -30, 2.5],
  [-6, -12, 3.3],
  [19, 24, 2.4],
  [-26, 24, 2.4],
  [34, -14, 2.3],
  [-36, 12, 2.3],
  [0, 38, 2.2],
  [-14, 34, 2.2],
  [26, -28, 2.3],
  [-32, -26, 2.1],
  [38, 6, 2.2],
  [-42, -2, 2.0],
  [15, 39, 2.0],
  [-22, -38, 2.0],
  [32, 30, 2.0],
  [-4, -42, 2.1],
  [42, -22, 1.9],
];

const OBSERVER_QUICK_PRESETS: readonly { readonly deg: number; readonly label: string }[] = [
  { deg: 0, label: "0° · Vị trí (1)" },
  { deg: 30, label: "30° · Lệch nhỏ" },
  { deg: 90, label: "90° · Vuông góc" },
  { deg: 140, label: "140° · Vị trí (2)" },
  { deg: 160, label: "160° · Vị trí (2)" },
];

function disposeGroup(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}

export interface RutherfordApparatusV3Props {
  onProgress?: (done: boolean) => void;
}

export function RutherfordApparatusV3({ onProgress }: RutherfordApparatusV3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    components: Map<string, BuiltComponent>;
    raycaster: THREE.Raycaster;
    trailGroup: THREE.Group | null;
    scintillationGroup: THREE.Group | null;
    selectionRing: THREE.Mesh | null;
    frameId: number;
  } | null>(null);

  const storedRaw = useSyncExternalStore(
    subscribeRutherfordV3Storage,
    getRutherfordV3RawSnapshot,
    EMPTY_RAW,
  );
  const persisted = useMemo(() => parseRutherfordV3State(storedRaw), [storedRaw]);

  const {
    cameraMode,
    selectedPartId,
    showScintillation,
    showBeam,
    observerAngleDeg,
    countPos1 = null,
    countPos2 = null,
    countTrialSeed = 1,
  } = persisted;

  const settings = useMemo<RutherfordSettings>(
    () => ({
      impactFm: persisted.impactFm,
      energyMeV: persisted.energyMeV,
    }),
    [persisted.impactFm, persisted.energyMeV],
  );

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedZs, setElapsedZs] = useState(0);
  const [eyepiecePaused, setEyepiecePaused] = useState(false);
  const [flashBeat, setFlashBeat] = useState(0);
  const [histogram] = useState<HistogramBin[]>(() =>
    generateRutherfordDistribution(1000, 10, 42),
  );

  useEffect(() => {
    if (!showScintillation || eyepiecePaused) return;
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setFlashBeat((b) => (b + 1) % 24);
    }, 680);
    return () => window.clearInterval(id);
  }, [showScintillation, eyepiecePaused]);

  const run = useMemo(() => {
    try {
      return createRutherfordRun(settings);
    } catch {
      return null;
    }
  }, [settings]);

  const trail = useMemo(() => {
    if (!run) return null;
    return rutherfordTrail(run, run.durationZs, 80);
  }, [run]);

  const selectedComponent = useMemo(() => {
    if (!selectedPartId) return null;
    return RUTHERFORD_COMPONENTS.find((c) => c.id === selectedPartId) ?? null;
  }, [selectedPartId]);

  /** Đối chiếu nhóm nút nhận diện Hình 21.2 (gộp vỏ nguồn / giá đỡ / cửa sổ vào bộ phận chính tương ứng) */
  const activeCorePartId = useMemo(() => {
    if (!selectedPartId) return null;
    if (selectedPartId === "source-housing") return "alpha-source";
    if (selectedPartId === "foil-holder") return "gold-foil";
    if (selectedPartId === "chamber-window") return "vacuum-chamber";
    return selectedPartId;
  }, [selectedPartId]);

  const observerSummary = useMemo(
    () => describeObserverPosition(observerAngleDeg),
    [observerAngleDeg],
  );

  /** Số liệu hiện tại, dùng chung cho bảng đo và nhiệm vụ điều tra */
  const currentInquiryRun = useMemo<InquiryRun | null>(
    () =>
      run
        ? { b: settings.impactFm, e: settings.energyMeV, theta: run.scatteringAngleDeg }
        : null,
    [run, settings],
  );

  const inquiryEvaluation = useMemo(
    () =>
      evaluateRutherfordInquiry({
        prediction: persisted.prediction,
        run1: persisted.run1,
        run2: persisted.run2,
        lastCapturedSlot: persisted.lastCapturedSlot,
        conclusion: persisted.conclusion,
      }),
    [
      persisted.prediction,
      persisted.run1,
      persisted.run2,
      persisted.lastCapturedSlot,
      persisted.conclusion,
    ],
  );

  // Bảo vệ tiến độ khi chuyển tab/pha hoặc F5 tải lại trang:
  // Không bắn onProgress(false) lúc mount thụ động, chỉ đồng bộ khi đã hoàn thành hoặc khi học sinh xoá dữ liệu làm mất trạng thái hoàn thành.
  const hadCompleteRef = useRef(inquiryEvaluation.isComplete);
  useEffect(() => {
    if (inquiryEvaluation.isComplete || hadCompleteRef.current) {
      onProgress?.(inquiryEvaluation.isComplete);
    }
    hadCompleteRef.current = inquiryEvaluation.isComplete;
  }, [inquiryEvaluation.isComplete, onProgress]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initW = Math.max(container.clientWidth, 1);
    const initH = Math.max(container.clientHeight, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.setClearColor(0x0a0f1a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0f1a, 42, 85);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.58);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(10, 15, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.45);
    fillLight.position.set(-12, -5, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa66, 0.3);
    rimLight.position.set(0, -10, 15);
    scene.add(rimLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 200);
    const preset = CAMERA_POSITIONS.orbit;
    camera.position.set(...preset.pos);
    camera.lookAt(...preset.target);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 55;
    controls.target.set(...preset.target);

    // Grid and ground
    const grid = new THREE.GridHelper(60, 30, 0x2a3a5a, 0x1a2a3a);
    grid.position.y = -11.2;
    scene.add(grid);

    // Build apparatus (distinct non-overlapping meshes)
    const components = buildRutherfordApparatus(RUTHERFORD_COMPONENTS);
    for (const [, built] of components) {
      scene.add(built.mesh);
    }

    const raycaster = new THREE.Raycaster();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      components,
      raycaster,
      trailGroup: null,
      scintillationGroup: null,
      selectionRing: null,
      frameId: 0,
    };

    let lastRender = 0;
    function animate(now = 0) {
      if (!sceneRef.current) return;
      sceneRef.current.frameId = requestAnimationFrame(animate);
      if (now - lastRender < 42) return;
      lastRender = now;
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    }
    animate();

    // Resize handler with zero-dimension guard
    function onResize() {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Click handler: prioritize inner functional components right through outer vacuum glass
    function onClick(event: MouseEvent) {
      if (!container || !sceneRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      sceneRef.current.raycaster.setFromCamera(mouse, sceneRef.current.camera);

      const visibleRoots: THREE.Object3D[] = [];
      for (const [, built] of sceneRef.current.components) {
        if (built.mesh.visible) {
          visibleRoots.push(built.mesh);
        }
      }

      const hits = sceneRef.current.raycaster.intersectObjects(visibleRoots, true);
      const hitPartIds: string[] = [];

      for (const hit of hits) {
        if (!hit.object.visible) continue;
        let obj: THREE.Object3D | null = hit.object;
        let hiddenAncestor = false;
        let matchedId: string | null = null;

        while (obj) {
          if (!obj.visible) {
            hiddenAncestor = true;
            break;
          }
          if (!matchedId) {
            for (const [id, built] of sceneRef.current.components) {
              if (built.mesh === obj) {
                matchedId = id;
                break;
              }
            }
          }
          obj = obj.parent;
        }

        if (!hiddenAncestor && matchedId && !hitPartIds.includes(matchedId)) {
          hitPartIds.push(matchedId);
        }
      }

      const chosenId = resolveRutherfordRaycastPart(hitPartIds);
      writeRutherfordV3State((prev) => ({
        ...prev,
        selectedPartId: chosenId,
      }));
    }
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.renderer.dispose();
        disposeGroup(sceneRef.current.scene);
      }
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // Update camera preset (and follow observerAngleDeg when in Microscope POV "instrument")
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (cameraMode === "instrument") {
      const rad = (observerAngleDeg * Math.PI) / 180;
      state.camera.position.set(11.2 * Math.cos(rad), 11.2 * Math.sin(rad), 1.6);
      const targetX = 7.2 * Math.cos(rad);
      const targetY = 7.2 * Math.sin(rad);
      state.camera.lookAt(targetX, targetY, 0);
      state.controls.target.set(targetX, targetY, 0);
      state.controls.update();
      return;
    }
    const preset = CAMERA_POSITIONS[cameraMode];
    state.camera.position.set(...preset.pos);
    state.camera.lookAt(...preset.target);
    state.controls.target.set(...preset.target);
    state.controls.update();
  }, [cameraMode, observerAngleDeg]);

  // Update exploded positions & rotating microscope angle
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const [id, built] of state.components) {
      if (id === "rotating-microscope") {
        const offset = cameraMode === "exploded" ? EXPLODED_OFFSETS[id] : undefined;
        setMicroscopeAngle(built, observerAngleDeg, offset);
        continue;
      }
      const base = built.originalPosition;
      if (cameraMode === "exploded") {
        const offset = EXPLODED_OFFSETS[id] ?? [0, 0, 0];
        built.mesh.position.set(
          base.x + offset[0],
          base.y + offset[1],
          base.z + offset[2],
        );
      } else {
        built.mesh.position.copy(base);
      }
    }
  }, [cameraMode, observerAngleDeg]);

  // Update cutaway visibility (hides vacuum-chamber, chamber-window, base-platform)
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const [id, built] of state.components) {
      const shouldHide =
        cameraMode === "cutaway" && CUTAWAY_HIDDEN_PARTS.includes(id);
      built.mesh.traverse((obj) => {
        obj.visible = !shouldHide;
      });
    }
  }, [cameraMode]);

  // Highlight selected 3D part with an indicator ring at its world position
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.selectionRing) {
      state.scene.remove(state.selectionRing);
      state.selectionRing.geometry.dispose();
      (state.selectionRing.material as THREE.Material).dispose();
      state.selectionRing = null;
    }

    if (!selectedPartId) return;
    const targetBuilt = state.components.get(selectedPartId);
    if (!targetBuilt || !targetBuilt.mesh.visible) return;

    const ringRadius =
      selectedPartId === "scintillation-screen" || selectedPartId === "angular-scale"
        ? 7.9
        : selectedPartId === "vacuum-chamber" || selectedPartId === "chamber-window"
        ? 9.5
        : selectedPartId === "gold-foil" || selectedPartId === "foil-holder"
        ? 2.45
        : 1.85;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, 0.09, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );
    ring.position.copy(targetBuilt.mesh.position);
    if (
      selectedPartId === "alpha-source" ||
      selectedPartId === "source-housing" ||
      selectedPartId === "collimator" ||
      selectedPartId === "gold-foil" ||
      selectedPartId === "foil-holder" ||
      selectedPartId === "vacuum-chamber" ||
      selectedPartId === "chamber-window"
    ) {
      ring.rotation.y = Math.PI / 2;
    }
    state.scene.add(ring);
    state.selectionRing = ring;
  }, [selectedPartId, cameraMode, observerAngleDeg]);

  // Layer 1: Experimental ZnS scintillation flashes (independent of Layer 2!)
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.scintillationGroup) {
      state.scene.remove(state.scintillationGroup);
      disposeGroup(state.scintillationGroup);
      state.scintillationGroup = null;
    }

    if (!showScintillation) return;

    const scale = 7.5 / 180;
    const hitVec = run
      ? new THREE.Vector3(run.hit.xFm * scale, run.hit.yFm * scale, 0)
      : null;
    const hasReachedScreen =
      !run ? false : elapsedZs === 0 || elapsedZs >= run.durationZs * 0.92;

    const group = buildScintillationLayer(hitVec, hasReachedScreen);
    state.scene.add(group);
    state.scintillationGroup = group;
  }, [showScintillation, run, elapsedZs]);

  // Layer 2: Explanatory alpha trajectory curve (completely hidden when !showBeam)
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.trailGroup) {
      state.scene.remove(state.trailGroup);
      disposeGroup(state.trailGroup);
      state.trailGroup = null;
    }

    if (!showBeam || !trail || !run) return;

    const visibleCount =
      elapsedZs > 0
        ? Math.max(2, Math.floor((elapsedZs / run.durationZs) * trail.length))
        : trail.length;

    const scale = 7.5 / 180;
    const points = trail.slice(0, visibleCount).map(
      (s) => new THREE.Vector3(s.xFm * scale, s.yFm * scale, 0),
    );

    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      linewidth: 2,
      transparent: true,
      opacity: 0.92,
    });
    group.add(new THREE.Line(geometry, material));

    // Alpha particle sphere at current front tip
    const tip = points[points.length - 1];
    if (tip) {
      const alphaDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      );
      alphaDot.position.copy(tip);
      group.add(alphaDot);
    }

    state.scene.add(group);
    state.trailGroup = group;
  }, [trail, run, elapsedZs, showBeam]);

  // Animation timer
  useEffect(() => {
    if (!isRunning || !run) return;
    let previous = performance.now();
    let frameId: number;
    const MODEL_TIME_PER_SECOND_ZS = 5;

    function tick(now: number) {
      const delta = now - previous;
      if (delta >= 1000 / 35) {
        previous = now;
        setElapsedZs((current) => {
          const next = current + Math.min(delta / 1000, 0.12) * MODEL_TIME_PER_SECOND_ZS;
          if (next >= run!.durationZs) {
            setIsRunning(false);
            return run!.durationZs;
          }
          return next;
        });
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, run]);

  function handleRunPause() {
    if (!run) return;
    if (elapsedZs >= run.durationZs) {
      setElapsedZs(0);
      setIsRunning(true);
    } else {
      setIsRunning((r) => !r);
    }
  }

  function handleReset() {
    setElapsedZs(0);
    setIsRunning(false);
    writeRutherfordV3State((prev) => ({
      ...prev,
      impactFm: INITIAL_RUTHERFORD_V3_STATE.impactFm,
      energyMeV: INITIAL_RUTHERFORD_V3_STATE.energyMeV,
      cameraMode: INITIAL_RUTHERFORD_V3_STATE.cameraMode,
      selectedPartId: null,
      showScintillation: true,
      showBeam: true,
      observerAngleDeg: 0,
    }));
  }

  const format = (n: number, digits = 1) => n.toFixed(digits);

  // Cross-section SVG helper coordinates (origin at (125, 115), screen radius = 74 px)
  const svgScreenR = 74;
  const obsRad = (observerAngleDeg * Math.PI) / 180;
  const obsScreenX = Number((125 + svgScreenR * Math.cos(obsRad)).toFixed(2));
  const obsScreenY = Number((115 - svgScreenR * Math.sin(obsRad)).toFixed(2));
  const obsEyeX = Number((125 + (svgScreenR + 24) * Math.cos(obsRad)).toFixed(2));
  const obsEyeY = Number((115 - (svgScreenR + 24) * Math.sin(obsRad)).toFixed(2));

  const hitRad = run ? (run.detectorAngleDeg * Math.PI) / 180 : 0;
  const hitSvgX = Number((125 + svgScreenR * Math.cos(hitRad)).toFixed(2));
  const hitSvgY = Number((115 - svgScreenR * Math.sin(hitRad)).toFixed(2));

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {/* 1. Thanh nút Nhận diện bộ phận cốt lõi Hình 21.2 (đồng bộ 2 chiều với 3D, tối ưu cảm ứng 390px) */}
      <section
        aria-label="Nhận diện bộ phận cốt lõi Hình 21.2 SGK"
        style={{
          padding: "14px",
          background: "var(--bg-surface-elevated, #f8fafc)",
          border: "1px solid var(--border-light, #cbd5e1)",
          borderRadius: "10px",
        }}
      >
        <div style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary, #0f172a)" }}>
          Nhận diện các bộ phận cốt lõi Hình 21.2 (SGK tr. 91) — Chạm nút hoặc nhấp trực tiếp trên mô hình 3D:
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {CORE_SGK_21_2_PARTS.map((item) => {
            const isSelected = activeCorePartId === item.partId;
            return (
              <button
                key={item.partId}
                type="button"
                aria-pressed={isSelected}
                data-core-part-btn={item.partId}
                onClick={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    selectedPartId:
                      prev.selectedPartId === item.partId ? null : item.partId,
                  }))
                }
                style={{
                  minHeight: "42px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #0f62fe" : "1px solid #94a3b8",
                  background: isSelected ? "#edf5ff" : "#ffffff",
                  color: isSelected ? "#002d9c" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  touchAction: "manipulation",
                  textAlign: "left",
                }}
              >
                <span>{item.buttonLabel}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: isSelected ? "#0f62fe" : "#475569",
                  }}
                >
                  {item.questionCue}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tóm tắt 4 vai trò cốt lõi để học sinh trả lời ngay câu hỏi nhận diện thiết bị */}
        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "#334155",
          }}
        >
          <strong>Tóm tắt chức năng (Hình 21.2 SGK tr. 91):</strong>{" "}
          <strong>Nguồn R</strong> phát chùm hạt α (+2e) →{" "}
          <strong>Lá vàng D</strong> là bia tán xạ rất mỏng (~4·10⁻⁷ m) →{" "}
          <strong>Màn huỳnh quang S (ZnS)</strong> gắn trước vật kính lóe lên một đốm sáng rồi tắt khi hạt α chạm vào →{" "}
          <strong>Kính hiển vi M</strong> xoay quanh trục D để đếm đốm sáng ở từng góc; toàn bộ đặt trong{" "}
          <strong>Hộp chân không G</strong> nối với <strong>Chân đế / ống hút chân không P</strong> ở đáy (Hình 21.2a). Trên bàn 3D đặt nguồn R bên trái bắn sang phải tới vị trí (1) 0° (đối xứng gương với Hình 21.2b SGK vẽ R bên phải bắn sang trái tới (1), giữ nguyên quan hệ góc lệch tới vị trí (2) &gt; 90°).
        </div>
      </section>

      {/* 2. Khung 3D Hình phối cảnh (21.2a) */}
      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-light, #cbd5e1)",
          background: "#0a0f1a",
        }}
      >
        <div
          ref={containerRef}
          style={{ width: "100%", height: "480px", display: "block" }}
          data-rutherford-canvas
        />

        {/* Camera mode selector overlay */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            maxWidth: "calc(100% - 20px)",
          }}
        >
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              onClick={() =>
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  cameraMode: preset.mode,
                }))
              }
              title={preset.description}
              style={{
                padding: "5px 9px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor:
                  cameraMode === preset.mode ? "#22d3ee" : "rgba(255,255,255,0.22)",
                background:
                  cameraMode === preset.mode
                    ? "rgba(34, 211, 238, 0.22)"
                    : "rgba(10, 15, 26, 0.72)",
                color: cameraMode === preset.mode ? "#22d3ee" : "#e0e8f0",
                cursor: "pointer",
                minHeight: "32px",
                touchAction: "manipulation",
              }}
            >
              {preset.nameVi}
            </button>
          ))}
        </div>

        {/* Selected component info */}
        {selectedComponent && (
          <div
            role="status"
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              right: "12px",
              maxWidth: "460px",
              padding: "12px 14px",
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(34,211,238,0.5)",
              borderRadius: "8px",
              color: "#e0e8f0",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "2px", color: "#22d3ee" }}>
              {selectedComponent.nameVi}
            </div>
            <div style={{ fontStyle: "italic", color: "#94a3b8", marginBottom: "6px", fontSize: "11.5px" }}>
              {selectedComponent.nameEn}
            </div>
            <div>{selectedComponent.role}</div>
            <button
              type="button"
              onClick={() =>
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  selectedPartId: null,
                }))
              }
              style={{
                marginTop: "8px",
                padding: "4px 10px",
                fontSize: "11.5px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "#cbd5e1",
                cursor: "pointer",
                minHeight: "30px",
              }}
            >
              Đóng
            </button>
          </div>
        )}

        {!selectedComponent && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              padding: "7px 11px",
              background: "rgba(10, 15, 26, 0.78)",
              borderRadius: "6px",
              color: "#cbd5e1",
              fontSize: "12px",
              pointerEvents: "none",
            }}
          >
            Nhấp vào linh kiện 3D (xuyên qua vỏ kính) hoặc chọn nút Hình 21.2 ở trên
          </div>
        )}
      </div>

      {/* 3. Nút điều khiển Chạy/Đặt lại + 2 công tắc lớp hiển thị độc lập */}
      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "14px",
          background: "var(--bg-surface-elevated, #f8fafc)",
          border: "1px solid var(--border-light, #cbd5e1)",
          borderRadius: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleRunPause}
            disabled={!run}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              background: "#2b3b93",
              color: "white",
              cursor: run ? "pointer" : "not-allowed",
              minHeight: "44px",
            }}
          >
            {isRunning
              ? "Tạm dừng"
              : elapsedZs > 0 && run && elapsedZs < run.durationZs
              ? "Tiếp tục"
              : "Chạy bắn hạt α"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              background: "#ffffff",
              color: "inherit",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Đặt lại góc nhìn &amp; tia
          </button>
        </div>

        {/* Hai công tắc lớp hiển thị độc lập */}
        <div
          role="group"
          aria-label="Hai công tắc lớp hiển thị độc lập"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "10px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: showScintillation ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
              background: showScintillation ? "#f0fdf4" : "#ffffff",
              cursor: "pointer",
              fontSize: "13.5px",
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              checked={showScintillation}
              onChange={(e) => {
                const checked = e.target.checked;
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  showScintillation: checked,
                }));
              }}
              style={{ marginTop: "3px" }}
            />
            <span>
              <strong style={{ display: "block", color: "#14532d" }}>
                Lớp 1: Đốm sáng trên màn ZnS (dấu hiệu ghi nhận thực nghiệm)
              </strong>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Đốm xanh lục lóe lên tại điểm chạm màn S kèm phân bố thực nghiệm (dày quanh 0°, cực hiếm &gt; 90°).
              </span>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: showBeam ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
              background: showBeam ? "#f0f9ff" : "#ffffff",
              cursor: "pointer",
              fontSize: "13.5px",
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              checked={showBeam}
              onChange={(e) => {
                const checked = e.target.checked;
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  showBeam: checked,
                }));
              }}
              style={{ marginTop: "3px" }}
            />
            <span>
              <strong style={{ display: "block", color: "#0c4a6e" }}>
                Lớp 2: Quỹ đạo hạt α (Mô hình giải thích)
              </strong>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Đường cong hyperbol Coulomb dùng suy luận điều xảy ra gần tâm hạt nhân (mắt không thấy trực tiếp qua kính M).
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* 4. Điều khiển Xoay kính quan sát M (0° Vị trí 1 → 160° Vị trí 2) + Đếm cùng thời gian Δt = 10 s */}
      <section
        aria-label="Xoay vị trí kính hiển vi M, đếm đốm sáng cùng thời gian và đối chiếu Hình 21.2a - 21.2b"
        style={{
          padding: "16px",
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #334155",
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
            <label htmlFor="rutherford-observer-slider" style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
              Xoay vị trí kính quan sát M quanh lá vàng D: {observerAngleDeg}° ({observerAngleDeg <= 15 ? "Vị trí (1)" : observerAngleDeg > 90 ? "Vị trí (2)" : "Góc trung gian"})
            </label>
            {run && (
              <button
                type="button"
                onClick={() => {
                  const targetDeg = Math.min(160, Math.max(0, Math.round(Math.abs(run.detectorAngleDeg))));
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    observerAngleDeg: targetDeg,
                  }));
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #38bdf8",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#bae6fd",
                  cursor: "pointer",
                  minHeight: "32px",
                }}
              >
                Đưa kính M tới vùng màn ứng với tia đang xét ({Math.min(160, Math.max(0, Math.round(Math.abs(run.detectorAngleDeg))))}°)
              </button>
            )}
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
            Đổi vị trí kính <strong>M</strong> chỉ đổi vùng màn <strong>S</strong> được quan sát, <strong>không điều khiển hay làm đổi quỹ đạo của hạt α</strong>. (Lưu ý góc nhìn: Hình 21.2b SGK vẽ nguồn R bên phải chiếu sang trái tới (1); bàn 3D đang nhìn từ phía đối diện nên R ở bên trái chiếu sang phải tới (1) — ở cả hai hình, <strong>(1) luôn đối diện nguồn phát</strong> và <strong>(2) luôn lệch ngược &gt; 90° về phía nguồn</strong>.)
          </p>

          <input
            id="rutherford-observer-slider"
            type="range"
            min={0}
            max={160}
            step={5}
            value={observerAngleDeg}
            onChange={(e) => {
              const deg = Number(e.target.value);
              writeRutherfordV3State((prev) => ({
                ...prev,
                observerAngleDeg: deg,
              }));
            }}
            style={{ width: "100%" }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {OBSERVER_QUICK_PRESETS.map((p) => {
              const active = observerAngleDeg === p.deg;
              return (
                <button
                  key={p.deg}
                  type="button"
                  onClick={() =>
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: p.deg,
                    }))
                  }
                  style={{
                    padding: "6px 10px",
                    minHeight: "36px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: active ? "1.5px solid #4ade80" : "1px solid #475569",
                    background: active ? "rgba(74, 222, 128, 0.2)" : "rgba(30, 41, 59, 0.8)",
                    color: active ? "#86efac" : "#cbd5e1",
                    cursor: "pointer",
                    touchAction: "manipulation",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hai khung đối chiếu: Hình mặt cắt ngang 21.2b ↔ Thị trường kính hiển vi M */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "14px",
            alignItems: "stretch",
          }}
        >
          {/* Sơ đồ mặt cắt ngang đối chiếu với phối cảnh 3D */}
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
              Mặt cắt ngang trên bàn 3D (đối chiếu Hình 21.2a – 21.2b SGK)
            </div>
            <svg
              viewBox="0 0 250 220"
              width="250"
              height="220"
              role="img"
              aria-label={`Sơ đồ mặt cắt bộ thí nghiệm trên bàn 3D với nguồn R, lá vàng D, màn S, hộp chân không G trên chân đế P và kính hiển vi M đang ở góc ${observerAngleDeg} độ`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Hộp chân không G */}
              <circle cx="125" cy="115" r="98" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="125" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                Hộp chân không G (đặt trên chân đế P)
              </text>

              {/* Màn phát quang ZnS (S) */}
              <circle cx="125" cy="115" r={svgScreenR} fill="none" stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.6" />
              <text x="125" y="198" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="600">
                Màn phát quang ZnS (S)
              </text>

              {/* Nguồn R & khe chuẩn trực bên trái */}
              <rect x="14" y="103" width="26" height="24" rx="3" fill="#475569" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="27" y="119" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="700">
                R
              </text>
              <line x1="56" y1="98" x2="56" y2="111" stroke="#94a3b8" strokeWidth="3" />
              <line x1="56" y1="119" x2="56" y2="132" stroke="#94a3b8" strokeWidth="3" />
              <text x="56" y="93" textAnchor="middle" fill="#cbd5e1" fontSize="8.8" fontWeight="600">
                khe hẹp
              </text>

              {/* Lá vàng mỏng D tại tâm */}
              <line x1="125" y1="98" x2="125" y2="132" stroke="#facc15" strokeWidth="3.2" />
              <text x="125" y="92" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="700">
                D
              </text>

              {/* Chùm tia minh họa Lớp 2 */}
              {showBeam && (
                <g>
                  <line x1="40" y1="115" x2="198" y2="115" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="3 2" />
                  {run && (
                    <polyline
                      points={`40,115 125,115 ${hitSvgX.toFixed(1)},${hitSvgY.toFixed(1)}`}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}

              {/* Đốm sáng ZnS Lớp 1 */}
              {showScintillation && (
                <g>
                  {/* Cụm dày tại vị trí (1) 0° */}
                  {[-8, -4, 0, 4, 8].map((deg) => {
                    const r = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={125 + svgScreenR * Math.cos(r)}
                        cy={115 - svgScreenR * Math.sin(r)}
                        r="2.6"
                        fill="#4ade80"
                      />
                    );
                  })}
                  {/* Một đốm hiếm tại vị trí (2) > 90° */}
                  <circle
                    cx={125 + svgScreenR * Math.cos((142 * Math.PI) / 180)}
                    cy={115 - svgScreenR * Math.sin((142 * Math.PI) / 180)}
                    r="2.4"
                    fill="#4ade80"
                  />
                  {/* Đốm hạt đang khảo sát */}
                  {run && (
                    <circle cx={hitSvgX} cy={hitSvgY} r="4.5" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
                  )}
                </g>
              )}

              {/* Nhãn Vị trí (1) và Vị trí (2) chuẩn SGK Hình 21.2b */}
              <text x="212" y="119" fill="#86efac" fontSize="10.5" fontWeight="700">
                (1) 0°
              </text>
              <text x="52" y="56" fill="#fda4af" fontSize="10.5" fontWeight="700">
                (2) &gt;90°
              </text>

              {/* Kính hiển vi M xoay theo observerAngleDeg */}
              <line
                x1="125"
                y1="115"
                x2={obsScreenX}
                y2={obsScreenY}
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <line
                x1={obsScreenX}
                y1={obsScreenY}
                x2={obsEyeX}
                y2={obsEyeY}
                stroke="#f8fafc"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx={obsEyeX} cy={obsEyeY} r="5.5" fill="#0f62fe" stroke="#ffffff" strokeWidth="1.2" />
              <text
                x={obsEyeX}
                y={obsEyeY - 9}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10.5"
                fontWeight="700"
              >
                M ({observerAngleDeg}°)
              </text>
            </svg>
          </div>

          {/* Thị trường kính hiển vi M (đốm xuất hiện rồi tắt) & Phép đếm cùng thời gian Δt = 10 s */}
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg
                viewBox="-56 -56 112 112"
                width="104"
                height="104"
                role="img"
                aria-label={`Thị trường qua thị kính M tại góc ${observerAngleDeg} độ: mỗi đốm sáng xuất hiện trên màn S rồi tắt`}
                style={{ flexShrink: 0 }}
              >
                <circle cx="0" cy="0" r="50" fill="#04130d" stroke="#64748b" strokeWidth="3" />
                <line x1="-48" y1="0" x2="48" y2="0" stroke="#14532d" strokeWidth="0.8" />
                <line x1="0" y1="-48" x2="0" y2="48" stroke="#14532d" strokeWidth="0.8" />
                {showScintillation &&
                  (() => {
                    // Cái thấy qua kính M là các đốm rời rạc lóe lên rồi tắt (không phải vệt tia hay chấm dính cố định)
                    const activeSpots: { cx: number; cy: number; r: number; opacity: number }[] = [];
                    if (observerSummary.zone === "position_1") {
                      for (let k = 0; k < 4; k++) {
                        const spotIdx = (flashBeat * 3 + k * 5) % EYEPIECE_FLASH_SPOTS.length;
                        const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[spotIdx];
                        activeSpots.push({ cx, cy, r, opacity: k === 0 ? 1 : 0.55 });
                      }
                    } else if (observerSummary.zone === "intermediate") {
                      if (flashBeat % 2 === 0) {
                        const spotIdx = (flashBeat * 2) % 8;
                        const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[spotIdx];
                        activeSpots.push({ cx, cy, r, opacity: 0.95 });
                      }
                    } else {
                      // Vị trí (2) (> 90°): rất thưa, chỉ lóe 1 đốm đơn lẻ ở một số nhịp rồi tắt hẳn
                      if (flashBeat % 6 === 0) {
                        const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[(flashBeat / 6) % 4];
                        activeSpots.push({ cx, cy, r: r + 0.6, opacity: 1 });
                      }
                    }
                    return activeSpots.map((sp, idx) => (
                      <g key={idx}>
                        <circle cx={sp.cx} cy={sp.cy} r={sp.r * 1.9} fill="#4ade80" fillOpacity={sp.opacity * 0.24} />
                        <circle cx={sp.cx} cy={sp.cy} r={sp.r} fill="#86efac" fillOpacity={sp.opacity} />
                      </g>
                    ));
                  })()}
                {!showScintillation && (
                  <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                    Đã tắt Lớp 1
                  </text>
                )}
              </svg>

              <div style={{ fontSize: "13px", lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#86efac", marginBottom: "2px" }}>
                  Thị trường kính M: {observerSummary.positionTitle}
                </div>
                <div style={{ color: "#fde047", fontWeight: 600, fontSize: "12px", marginBottom: "6px" }}>
                  {observerSummary.relativeFrequencyLabel}
                </div>
                <div style={{ fontSize: "11.5px", color: "#cbd5e1", marginBottom: "6px" }}>
                  Dấu hiệu qua kính: từng đốm sáng nhỏ xuất hiện rồi tắt (không có vệt tia bay).
                </div>
                <button
                  type="button"
                  onClick={() => setEyepiecePaused((p) => !p)}
                  style={{
                    padding: "4px 10px",
                    minHeight: "30px",
                    fontSize: "11.5px",
                    borderRadius: "5px",
                    border: "1px solid #475569",
                    background: "rgba(30, 41, 59, 0.9)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  {eyepiecePaused ? "Tiếp tục chớp đốm qua kính" : "Tạm dừng chớp đốm"}
                </button>
              </div>
            </div>

            {/* Phép đếm cùng khoảng thời gian Δt = 10 s, giữ nguyên điều kiện nguồn R */}
            <div
              data-rutherford-equal-time-counter
              style={{
                padding: "10px 12px",
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontSize: "12.5px",
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 700, color: "#bae6fd", marginBottom: "6px" }}>
                So sánh tần suất đốm sáng trong cùng thời gian đếm Δt = 10 s (giữ nguyên nguồn R, lượt #{countTrialSeed}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                <button
                  type="button"
                  data-count-pos1-btn
                  onClick={() => {
                    const s1 = sampleEqualTimeFlashCount(0, countTrialSeed);
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: 0,
                      countPos1: s1.count,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    border: "1px solid #22c55e",
                    background: "rgba(34, 197, 94, 0.18)",
                    color: "#bbf7d0",
                    cursor: "pointer",
                  }}
                >
                  Đếm 10 s ở Vị trí (1) (0°)
                </button>
                <button
                  type="button"
                  data-count-pos2-btn
                  onClick={() => {
                    const s2 = sampleEqualTimeFlashCount(140, countTrialSeed);
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: 140,
                      countPos2: s2.count,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    border: "1px solid #fb7185",
                    background: "rgba(251, 113, 133, 0.18)",
                    color: "#fecdd3",
                    cursor: "pointer",
                  }}
                >
                  Đếm 10 s ở Vị trí (2) (140°)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextSeed = countTrialSeed + 1;
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      countTrialSeed: nextSeed,
                      countPos1:
                        prev.countPos1 !== null
                          ? sampleEqualTimeFlashCount(0, nextSeed).count
                          : null,
                      countPos2:
                        prev.countPos2 !== null
                          ? sampleEqualTimeFlashCount(140, nextSeed).count
                          : null,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    borderRadius: "5px",
                    border: "1px solid #64748b",
                    background: "transparent",
                    color: "#cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  Lặp lượt đếm 10 s mới
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "8px",
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: "6px",
                }}
              >
                <div style={{ padding: "6px 8px", background: "#0b1324", border: "1px solid #1e293b", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "11px" }}>Vị trí (1) · Δt = 10 s</span>
                  <strong style={{ color: "#86efac", fontSize: "14px" }}>
                    {countPos1 !== null ? `${countPos1.toLocaleString("vi-VN")} đốm` : "Chưa đếm"}
                  </strong>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Kì vọng thống kê: ~10 000 đốm</span>
                </div>
                <div style={{ padding: "6px 8px", background: "#0b1324", border: "1px solid #1e293b", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "11px" }}>Vị trí (2) · Δt = 10 s</span>
                  <strong style={{ color: "#fda4af", fontSize: "14px" }}>
                    {countPos2 !== null ? `${countPos2.toLocaleString("vi-VN")} đốm` : "Chưa đếm"}
                  </strong>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Kì vọng thống kê: ~1 đốm</span>
                </div>
              </div>
              <div style={{ fontSize: "11.5px", color: "#cbd5e1" }}>
                Một lượt 10 s ở vị trí (2) có thể ghi 0, 1, 2… đốm do tính ngẫu nhiên; khi xét xu hướng thống kê nhiều lượt cùng thời gian và nguồn R, tần suất đốm sáng ở (2) nhỏ hơn ở (1) cỡ <strong>10⁴ lần (~10⁻⁴)</strong> (SGK tr. 91–92).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Thanh trượt tham số b, E + Hộp lưu ý khoa học bắt buộc */}
      <div style={{ display: "grid", gap: "12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <label style={{ display: "grid", gap: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              Tham số va chạm b: {format(settings.impactFm)} fm
            </span>
            <input
              type="range"
              min={RUTHERFORD_LIMITS.impactFm.min}
              max={RUTHERFORD_LIMITS.impactFm.max}
              step={1}
              value={settings.impactFm}
              onChange={(e) => {
                const nextImpact = Number(e.target.value);
                setElapsedZs(0);
                setIsRunning(false);
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  impactFm: nextImpact,
                }));
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              Động năng hạt α tới E: {format(settings.energyMeV)} MeV
            </span>
            <input
              type="range"
              min={RUTHERFORD_LIMITS.energyMeV.min}
              max={RUTHERFORD_LIMITS.energyMeV.max}
              step={0.5}
              value={settings.energyMeV}
              onChange={(e) => {
                const nextEnergy = Number(e.target.value);
                setElapsedZs(0);
                setIsRunning(false);
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  energyMeV: nextEnergy,
                }));
              }}
            />
          </label>
        </div>

        {/* Hộp lưu ý khoa học tránh hiểu nhầm 1 tia đơn lẻ với tần suất cả chùm hạt */}
        <div
          role="note"
          data-rutherford-single-beam-note
          style={{
            padding: "12px 14px",
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            borderLeft: "4px solid #d97706",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "#78350f",
          }}
        >
          <strong>Lưu ý khoa học quan trọng:</strong> Một quỹ đạo đơn lẻ do học sinh chủ động chọn tham số{" "}
          <code>b</code> ở trên <strong>chỉ dùng để khảo sát lực đẩy tĩnh điện</strong> gần tâm hạt nhân vàng,{" "}
          <strong>KHÔNG đại diện cho tần suất của cả chùm hạt α</strong>. Trong chùm hạt thực tế đi qua nguyên tử (bán kính ~<code>10⁵ fm</code>), đại đa số hạt có <code>b</code> rất lớn nên đi thẳng tới vị trí <code>(1)</code>; chỉ khoảng <code>1 / 10 000</code> hạt bay đủ gần hạt nhân (<code>b</code> cực nhỏ) mới bật ngược về vị trí <code>(2)</code>.
        </div>
      </div>

      {/* 6. Bảng số liệu đo */}
      {run && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            padding: "16px",
            background: "var(--bg-surface-elevated, #f8fafc)",
            borderRadius: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Góc tán xạ
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.scatteringAngleDeg)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Góc vị trí trên màn
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.detectorAngleDeg)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Khoảng cách gần nhất
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.closestApproachFm)} fm
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Thời gian mô hình
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(elapsedZs)} zs
            </div>
          </div>
          <p style={{ gridColumn: "1 / -1", margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)", lineHeight: 1.6 }}>
            <strong>Phân biệt hai góc:</strong> Góc tán xạ so sánh phương vận tốc tới và bay ra ở rất xa hạt nhân (chỉ phụ thuộc tích E·b); góc vị trí trên màn tính từ tâm lá vàng tới điểm hạt chạm màn hữu hạn bán kính 180 fm.
          </p>
        </div>
      )}

      {/* 7. Histogram phân bố chùm hạt */}
      <div>
        <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          Phân bố góc tán xạ của cả chùm hạt α (mô hình 1/sin⁴(θ/2))
        </h4>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "120px", padding: "8px", background: "var(--bg-surface-elevated, #f8fafc)", borderRadius: "8px" }}>
          {histogram.map((bin, i) => {
            const maxCount = Math.max(...histogram.map((b) => b.count), 1);
            const heightPct = (bin.count / maxCount) * 100;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${heightPct}%`,
                  minHeight: bin.count > 0 ? "2px" : "0",
                  background: "#22d3ee",
                  borderRadius: "2px 2px 0 0",
                  position: "relative",
                }}
                title={`${bin.angleDeg}°: ${bin.count} sự kiện`}
              >
                {i % 3 === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-18px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "10px",
                      color: "var(--text-muted, #64748b)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bin.angleDeg}°
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", marginTop: "24px" }}>
          Mô hình phân bố cả chùm hạt cho thấy: đa số hạt đi thẳng tới vị trí (1), tần suất lệch góc lớn ở vị trí (2) (&gt; 90°) nhỏ hơn cỡ 10⁴ lần — phù hợp với thí nghiệm Geiger–Marsden (SGK tr. 91–92).
        </p>
      </div>

      {/* 8. Nhiệm vụ điều tra cho học sinh */}
      <RutherfordInquiryTask current={currentInquiryRun} />
    </div>
  );
}

export default RutherfordApparatusV3;
