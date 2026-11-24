"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { ChoiceCheck, Lab, Metrics, NuclearSymbol, Nucleus, Range } from './shared';

export { RutherfordActivity } from "./RutherfordActivity";

/* ──────────────────────────────────────────────────────────────────────────────
   BẢNG ĐẦY ĐỦ 118 NGUYÊN TỐ HÓA HỌC (KÍ HIỆU & TÊN IUPAC CHUẨN SGK VẬT LÍ 12 KNTT)
   ────────────────────────────────────────────────────────────────────────────── */

export interface ElementSpec {
  readonly z: number;
  readonly sym: string;
  readonly name: string;
}

export const ELEMENTS_118: readonly ElementSpec[] = [
  { z: 0, sym: 'n', name: 'Neutron' },
  { z: 1, sym: 'H', name: 'Hydrogen' },
  { z: 2, sym: 'He', name: 'Helium' },
  { z: 3, sym: 'Li', name: 'Lithium' },
  { z: 4, sym: 'Be', name: 'Beryllium' },
  { z: 5, sym: 'B', name: 'Boron' },
  { z: 6, sym: 'C', name: 'Carbon' },
  { z: 7, sym: 'N', name: 'Nitrogen' },
  { z: 8, sym: 'O', name: 'Oxygen' },
  { z: 9, sym: 'F', name: 'Fluorine' },
  { z: 10, sym: 'Ne', name: 'Neon' },
  { z: 11, sym: 'Na', name: 'Sodium' },
  { z: 12, sym: 'Mg', name: 'Magnesium' },
  { z: 13, sym: 'Al', name: 'Aluminium' },
  { z: 14, sym: 'Si', name: 'Silicon' },
  { z: 15, sym: 'P', name: 'Phosphorus' },
  { z: 16, sym: 'S', name: 'Sulfur' },
  { z: 17, sym: 'Cl', name: 'Chlorine' },
  { z: 18, sym: 'Ar', name: 'Argon' },
  { z: 19, sym: 'K', name: 'Potassium' },
  { z: 20, sym: 'Ca', name: 'Calcium' },
  { z: 21, sym: 'Sc', name: 'Scandium' },
  { z: 22, sym: 'Ti', name: 'Titanium' },
  { z: 23, sym: 'V', name: 'Vanadium' },
  { z: 24, sym: 'Cr', name: 'Chromium' },
  { z: 25, sym: 'Mn', name: 'Manganese' },
  { z: 26, sym: 'Fe', name: 'Iron' },
  { z: 27, sym: 'Co', name: 'Cobalt' },
  { z: 28, sym: 'Ni', name: 'Nickel' },
  { z: 29, sym: 'Cu', name: 'Copper' },
  { z: 30, sym: 'Zn', name: 'Zinc' },
  { z: 31, sym: 'Ga', name: 'Gallium' },
  { z: 32, sym: 'Ge', name: 'Germanium' },
  { z: 33, sym: 'As', name: 'Arsenic' },
  { z: 34, sym: 'Se', name: 'Selenium' },
  { z: 35, sym: 'Br', name: 'Bromine' },
  { z: 36, sym: 'Kr', name: 'Krypton' },
  { z: 37, sym: 'Rb', name: 'Rubidium' },
  { z: 38, sym: 'Sr', name: 'Strontium' },
  { z: 39, sym: 'Y', name: 'Yttrium' },
  { z: 40, sym: 'Zr', name: 'Zirconium' },
  { z: 41, sym: 'Nb', name: 'Niobium' },
  { z: 42, sym: 'Mo', name: 'Molybdenum' },
  { z: 43, sym: 'Tc', name: 'Technetium' },
  { z: 44, sym: 'Ru', name: 'Ruthenium' },
  { z: 45, sym: 'Rh', name: 'Rhodium' },
  { z: 46, sym: 'Pd', name: 'Palladium' },
  { z: 47, sym: 'Ag', name: 'Silver' },
  { z: 48, sym: 'Cd', name: 'Cadmium' },
  { z: 49, sym: 'In', name: 'Indium' },
  { z: 50, sym: 'Sn', name: 'Tin' },
  { z: 51, sym: 'Sb', name: 'Antimony' },
  { z: 52, sym: 'Te', name: 'Tellurium' },
  { z: 53, sym: 'I', name: 'Iodine' },
  { z: 54, sym: 'Xe', name: 'Xenon' },
  { z: 55, sym: 'Cs', name: 'Caesium' },
  { z: 56, sym: 'Ba', name: 'Barium' },
  { z: 57, sym: 'La', name: 'Lanthanum' },
  { z: 58, sym: 'Ce', name: 'Cerium' },
  { z: 59, sym: 'Pr', name: 'Praseodymium' },
  { z: 60, sym: 'Nd', name: 'Neodymium' },
  { z: 61, sym: 'Pm', name: 'Promethium' },
  { z: 62, sym: 'Sm', name: 'Samarium' },
  { z: 63, sym: 'Eu', name: 'Europium' },
  { z: 64, sym: 'Gd', name: 'Gadolinium' },
  { z: 65, sym: 'Tb', name: 'Terbium' },
  { z: 66, sym: 'Dy', name: 'Dysprosium' },
  { z: 67, sym: 'Ho', name: 'Holmium' },
  { z: 68, sym: 'Er', name: 'Erbium' },
  { z: 69, sym: 'Tm', name: 'Thulium' },
  { z: 70, sym: 'Yb', name: 'Ytterbium' },
  { z: 71, sym: 'Lu', name: 'Lutetium' },
  { z: 72, sym: 'Hf', name: 'Hafnium' },
  { z: 73, sym: 'Ta', name: 'Tantalum' },
  { z: 74, sym: 'W', name: 'Tungsten' },
  { z: 75, sym: 'Re', name: 'Rhenium' },
  { z: 76, sym: 'Os', name: 'Osmium' },
  { z: 77, sym: 'Ir', name: 'Iridium' },
  { z: 78, sym: 'Pt', name: 'Platinum' },
  { z: 79, sym: 'Au', name: 'Gold' },
  { z: 80, sym: 'Hg', name: 'Mercury' },
  { z: 81, sym: 'Tl', name: 'Thallium' },
  { z: 82, sym: 'Pb', name: 'Lead' },
  { z: 83, sym: 'Bi', name: 'Bismuth' },
  { z: 84, sym: 'Po', name: 'Polonium' },
  { z: 85, sym: 'At', name: 'Astatine' },
  { z: 86, sym: 'Rn', name: 'Radon' },
  { z: 87, sym: 'Fr', name: 'Francium' },
  { z: 88, sym: 'Ra', name: 'Radium' },
  { z: 89, sym: 'Ac', name: 'Actinium' },
  { z: 90, sym: 'Th', name: 'Thorium' },
  { z: 91, sym: 'Pa', name: 'Protactinium' },
  { z: 92, sym: 'U', name: 'Uranium' },
  { z: 93, sym: 'Np', name: 'Neptunium' },
  { z: 94, sym: 'Pu', name: 'Plutonium' },
  { z: 95, sym: 'Am', name: 'Americium' },
  { z: 96, sym: 'Cm', name: 'Curium' },
  { z: 97, sym: 'Bk', name: 'Berkelium' },
  { z: 98, sym: 'Cf', name: 'Californium' },
  { z: 99, sym: 'Es', name: 'Einsteinium' },
  { z: 100, sym: 'Fm', name: 'Fermium' },
  { z: 101, sym: 'Md', name: 'Mendelevium' },
  { z: 102, sym: 'No', name: 'Nobelium' },
  { z: 103, sym: 'Lr', name: 'Lawrencium' },
  { z: 104, sym: 'Rf', name: 'Rutherfordium' },
  { z: 105, sym: 'Db', name: 'Dubnium' },
  { z: 106, sym: 'Sg', name: 'Seaborgium' },
  { z: 107, sym: 'Bh', name: 'Bohrium' },
  { z: 108, sym: 'Hs', name: 'Hassium' },
  { z: 109, sym: 'Mt', name: 'Meitnerium' },
  { z: 110, sym: 'Ds', name: 'Darmstadtium' },
  { z: 111, sym: 'Rg', name: 'Roentgenium' },
  { z: 112, sym: 'Cn', name: 'Copernicium' },
  { z: 113, sym: 'Nh', name: 'Nihonium' },
  { z: 114, sym: 'Fl', name: 'Flerovium' },
  { z: 115, sym: 'Mc', name: 'Moscovium' },
  { z: 116, sym: 'Lv', name: 'Livermorium' },
  { z: 117, sym: 'Ts', name: 'Tennessine' },
  { z: 118, sym: 'Og', name: 'Oganesson' },
] as const;

function getElementInfo(z: number): ElementSpec {
  return ELEMENTS_118[z] ?? { z, sym: '?', name: 'Chưa xác định' };
}

/** Ba đồng vị Hydrogen chuẩn SGK Vật lí 12 KNTT tr. 95 */
const HYDROGEN_ISOTOPES_SGK = [
  { key: 'H1', label: 'Hydrogen thường ¹₁H', sub: 'Protium · N = 0', z: 1, n: 0 },
  { key: 'H2', label: 'Hydrogen nặng / Deuterium ²₁H', sub: 'N = 1', z: 1, n: 1 },
  { key: 'H3', label: 'Hydrogen siêu nặng / Tritium ³₁H', sub: 'N = 2', z: 1, n: 2 },
] as const;

const EMPTY_RAW = () => '';

/* ──────────────────────────────────────────────────────────────────────────────
   B. BỘ DỰNG HẠT NHÂN (SGK tr. 93–94 | Kí hiệu hạt nhân, proton/neutron, Si-28)
   Lưu trữ bền vững: "b21-structure-size-state-v1"
   ────────────────────────────────────────────────────────────────────────────── */

export const B21_BUILDER_STORAGE_KEY = 'b21-structure-size-state-v1';

interface BuilderPersistedState {
  readonly z: number;
  readonly n: number;
  readonly feedback: string;
  readonly hasSelectedSi28: boolean;
  readonly hasModified: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_BUILDER_STATE: BuilderPersistedState = {
  z: 6,
  n: 6,
  feedback: '',
  hasSelectedSi28: false,
  hasModified: false,
  hasAnswered: false,
};

function subscribeBuilderStorage(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('b21-builder-state-changed', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('b21-builder-state-changed', listener);
  };
}

function getBuilderRawSnapshot(): string {
  try {
    return window.localStorage.getItem(B21_BUILDER_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function parseBuilderState(raw: string): BuilderPersistedState {
  if (!raw) return INITIAL_BUILDER_STATE;
  try {
    const p = JSON.parse(raw) as Partial<BuilderPersistedState>;
    const z =
      typeof p.z === 'number' && Number.isFinite(p.z)
        ? Math.max(1, Math.min(118, Math.round(p.z)))
        : INITIAL_BUILDER_STATE.z;
    const n =
      typeof p.n === 'number' && Number.isFinite(p.n)
        ? Math.max(0, Math.min(180, Math.round(p.n)))
        : INITIAL_BUILDER_STATE.n;
    return {
      z,
      n,
      feedback: typeof p.feedback === 'string' ? p.feedback.slice(0, 600) : '',
      hasSelectedSi28: Boolean(p.hasSelectedSi28),
      hasModified: Boolean(p.hasModified),
      hasAnswered: Boolean(p.hasAnswered),
    };
  } catch {
    return INITIAL_BUILDER_STATE;
  }
}

function writeBuilderState(updater: (prev: BuilderPersistedState) => BuilderPersistedState) {
  if (typeof window === 'undefined') return;
  const current = parseBuilderState(getBuilderRawSnapshot());
  const next = updater(current);
  try {
    window.localStorage.setItem(B21_BUILDER_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('b21-builder-state-changed'));
  } catch {
    // Ignore storage quota errors
  }
}

type BuilderPreset = { label: string; z: number; n: number };
const PRESETS: BuilderPreset[] = [
  { label: 'Si-28 (SGK tr. 93)', z: 14, n: 14 },
  { label: 'He-4', z: 2, n: 2 },
  { label: 'C-12', z: 6, n: 6 },
  { label: 'Au-197', z: 79, n: 118 },
  { label: 'U-238', z: 92, n: 146 },
];

function describeBuilderChange(oldZ: number, oldN: number, newZ: number, newN: number): string {
  const oldEl = getElementInfo(oldZ);
  const newEl = getElementInfo(newZ);
  const oldA = oldZ + oldN;
  const newA = newZ + newN;

  if (oldZ === newZ && oldN !== newN) {
    return `Giữ nguyên số proton Z = ${newZ} nên tên nguyên tố (${newEl.name}) và kí hiệu hóa học (${newEl.sym}) giữ nguyên; số neutron N = A − Z đổi từ ${oldN} sang ${newN}, chỉ số khối A cập nhật đúng từ ${oldA} sang ${newA}.`;
  }
  if (oldZ !== newZ && oldN === newN) {
    return `Thay đổi số proton Z từ ${oldZ} sang ${newZ} (giữ N = ${newN}): nguyên tố đổi từ ${oldEl.name} (${oldEl.sym}) sang ${newEl.name} (${newEl.sym}), chỉ số khối A cập nhật thành ${newA}.`;
  }
  return `Cấu hình hạt nhân hiện tại: ${newEl.name} (${newEl.sym}), Z = ${newZ} proton, N = A − Z = ${newA} − ${newZ} = ${newN} neutron, số khối A = ${newA}.`;
}

export function NuclearBuilderActivity({ onProgress }: { onProgress?: (done: boolean) => void }) {
  const storedRaw = useSyncExternalStore(
    subscribeBuilderStorage,
    getBuilderRawSnapshot,
    EMPTY_RAW,
  );
  const state = useMemo(() => parseBuilderState(storedRaw), [storedRaw]);
  const { z, n, feedback, hasSelectedSi28, hasModified, hasAnswered } = state;

  const isDone = hasSelectedSi28 && hasModified && hasAnswered;
  const hadDoneRef = useRef(isDone);
  useEffect(() => {
    if (isDone || hadDoneRef.current) {
      onProgress?.(isDone);
    }
    hadDoneRef.current = isDone;
  }, [isDone, onProgress]);

  function applyPreset(preset: BuilderPreset) {
    writeBuilderState((prev) => ({
      ...prev,
      z: preset.z,
      n: preset.n,
      feedback: describeBuilderChange(prev.z, prev.n, preset.z, preset.n),
      hasSelectedSi28: prev.hasSelectedSi28 || (preset.z === 14 && preset.n === 14),
      hasModified:
        prev.hasModified ||
        (prev.hasSelectedSi28 && (preset.z !== prev.z || preset.n !== prev.n)),
    }));
  }

  function handleZChange(rawVal: number) {
    const nextZ = Math.max(1, Math.min(118, Math.round(rawVal)));
    writeBuilderState((prev) => {
      if (nextZ === prev.z) return prev;
      return {
        ...prev,
        z: nextZ,
        feedback: describeBuilderChange(prev.z, prev.n, nextZ, prev.n),
        hasSelectedSi28: prev.hasSelectedSi28 || (nextZ === 14 && prev.n === 14),
        hasModified: prev.hasModified || prev.hasSelectedSi28 || nextZ !== INITIAL_BUILDER_STATE.z,
      };
    });
  }

  function handleNChange(rawVal: number) {
    const nextN = Math.max(0, Math.min(180, Math.round(rawVal)));
    writeBuilderState((prev) => {
      if (nextN === prev.n) return prev;
      return {
        ...prev,
        n: nextN,
        feedback: describeBuilderChange(prev.z, prev.n, prev.z, nextN),
        hasSelectedSi28: prev.hasSelectedSi28 || (prev.z === 14 && nextN === 14),
        hasModified: prev.hasModified || prev.hasSelectedSi28 || nextN !== INITIAL_BUILDER_STATE.n,
      };
    });
  }

  function handleAnswered(correct: boolean) {
    writeBuilderState((prev) => ({
      ...prev,
      hasAnswered: correct,
    }));
  }

  const a = z + n;
  const el = getElementInfo(z);

  return (
    <Lab
      intro="Thay đổi số proton (Z) và neutron (N) để tạo cấu hình hạt nhân, đọc kí hiệu chuẩn và kiểm chứng hệ thức N = A − Z."
      note="Đây là bộ dựng thành phần: cặp Z, N tuỳ chọn trong bộ dựng chưa chắc tồn tại hoặc bền trong tự nhiên. Hình biểu diễn các nucleon, không phải quỹ đạo thực."
    >
      <div className="physics-guide">
        <p><strong>🧱 Chu trình khám phá:</strong></p>
        <ol>
          <li><strong>Dự đoán:</strong> Silicon-28 (<code>²⁸₁₄Si</code>) có bao nhiêu proton và bao nhiêu neutron?</li>
          <li><strong>Thử:</strong> Nhấn nút <strong>Si-28 (SGK tr. 93)</strong> hoặc 3 đồng vị Hydrogen rồi đọc <code>Z, A, N = A − Z</code>.</li>
          <li><strong>Quan sát:</strong> Giữ nguyên <code>Z</code> mà đổi <code>N</code> — tên nguyên tố, kí hiệu hóa học và số khối <code>A</code> thay đổi ra sao?</li>
          <li><strong>Giải thích:</strong> Trả lời câu hỏi bên dưới.</li>
        </ol>
      </div>

      <div className="physics-controls">
        <div>
          <Range label="Số proton Z" value={z} min={1} max={92} onChange={handleZChange} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button type="button" className="physics-button" onClick={() => handleZChange(z - 1)} disabled={z <= 1}>
              −1 proton
            </button>
            <button type="button" className="physics-button" onClick={() => handleZChange(z + 1)} disabled={z >= 118}>
              +1 proton
            </button>
          </div>
        </div>
        <div>
          <Range label="Số neutron N" value={n} min={0} max={146} onChange={handleNChange} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button type="button" className="physics-button" onClick={() => handleNChange(n - 1)} disabled={n <= 0}>
              −1 neutron
            </button>
            <button type="button" className="physics-button" onClick={() => handleNChange(n + 1)} disabled={n >= 180}>
              +1 neutron
            </button>
          </div>
        </div>
      </div>

      {/* Nhóm nút hạt nhân chuẩn SGK tr. 93 */}
      <div className="physics-actions" style={{ flexWrap: 'wrap' }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`physics-button${z === preset.z && n === preset.n ? ' primary' : ''}`}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Nhóm nút chọn nhanh 3 đồng vị Hydrogen chuẩn SGK tr. 95 */}
      <div
        style={{
          marginTop: '10px',
          marginBottom: '14px',
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid var(--border-light, #cbd5e1)',
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Chọn nhanh 3 đồng vị Hydrogen chuẩn SGK tr. 95 (cùng Z = 1, khác số neutron N):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {HYDROGEN_ISOTOPES_SGK.map((iso) => {
            const active = z === iso.z && n === iso.n;
            return (
              <button
                key={iso.key}
                type="button"
                className={`physics-button${active ? ' primary' : ''}`}
                onClick={() => applyPreset({ label: iso.label, z: iso.z, n: iso.n })}
              >
                {iso.label} ({iso.sub})
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="physics-feedback" role="status" style={{ marginBottom: '14px' }}>
          <strong>Nhận xét trực tiếp:</strong> {feedback}
        </div>
      )}

      <div className="physics-split">
        <Nucleus z={z} n={n} />
        <div className="physics-formula">
          <div style={{ marginBottom: '10px' }}>
            <NuclearSymbol a={a} z={z} symbol={el.sym} size="lg" />
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '15px' }}>
            Nguyên tố: <strong>{el.name}</strong> · Kí hiệu hóa học: <strong>{el.sym}</strong> (Z = {z})
          </p>
          <p style={{ margin: '0 0 6px' }}>
            Số khối: <strong>A = Z + N = {z} + {n} = {a}</strong>
          </p>
          <p style={{ margin: '0 0 6px' }}>
            Số neutron: <strong>N = A − Z = {a} − {z} = {n}</strong>
          </p>
          <p style={{ margin: '0 0 6px' }}>Điện tích hạt nhân: <strong>+{z}e</strong></p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
            Proton mang điện +e · Neutron không mang điện · Giữ nguyên Z mà thay N thì tên nguyên tố ({el.name}) và kí hiệu ({el.sym}) giữ nguyên, chỉ số khối A thay đổi.
          </p>
        </div>
      </div>

      <Metrics items={[
        { label: 'Nguyên tố', value: `${el.name} (${el.sym})` },
        { label: 'Proton Z', value: z },
        { label: 'Neutron N = A − Z', value: n },
        { label: 'Số khối A', value: a },
      ]} />

      <div className="physics-checklist">
        <p><strong>Tiêu chí hoàn thành:</strong></p>
        <ul>
          <li className={hasSelectedSi28 ? 'is-done' : ''}>Chọn Si-28 (Z = 14, N = 14, A = 28) {hasSelectedSi28 ? '✓' : ''}</li>
          <li className={hasModified ? 'is-done' : ''}>Thử đổi Z hoặc N (hoặc chọn các đồng vị Hydrogen) để quan sát sự thay đổi {hasModified ? '✓' : ''}</li>
          <li className={hasAnswered ? 'is-done' : ''}>Trả lời câu hỏi giải thích {hasAnswered ? '✓' : ''}</li>
        </ul>
      </div>

      <div>
        <ChoiceCheck
          onResult={handleAnswered}
          initialSelected={hasAnswered ? 0 : null}
          initialChecked={hasAnswered}
          question="Nếu giữ nguyên số proton Z và thêm một neutron vào hạt nhân, đại lượng nào thay đổi?"
          options={[
            'Chỉ số khối A tăng 1 (do N = A − Z tăng 1), tên nguyên tố và kí hiệu hóa học giữ nguyên.',
            'Điện tích hạt nhân tăng thêm +1e.',
            'Nguyên tố hóa học đổi sang nguyên tố kế tiếp.',
          ]}
          correctIndex={0}
          explanation="Nguyên tố hóa học và kí hiệu nguyên tố chỉ phụ thuộc số proton Z. Khi giữ Z không đổi và tăng số neutron N thêm 1, tên nguyên tố và kí hiệu hóa học giữ nguyên, điện tích hạt nhân vẫn là +Ze, chỉ có số khối A = Z + N tăng thêm 1."
        />
      </div>
    </Lab>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   C. ĐỒNG VỊ VÀ KÍCH THƯỚC HẠT NHÂN (SGK tr. 94–95 | 3 đồng vị Hydrogen, R ≈ 1,2·A¹/³ fm)
   Lưu trữ bền vững: "b21-symbol-isotopes-state-v1"
   ────────────────────────────────────────────────────────────────────────────── */

export const B21_ISOTOPE_STORAGE_KEY = 'b21-symbol-isotopes-state-v1';

interface IsotopePersistedState {
  readonly z1: number;
  readonly n1: number;
  readonly z2: number;
  readonly n2: number;
  readonly feedback: string;
  readonly hasExploredZ: boolean;
  readonly hasExploredN: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_ISOTOPE_STATE: IsotopePersistedState = {
  z1: 1,
  n1: 0,
  z2: 1,
  n2: 1,
  feedback: '',
  hasExploredZ: false,
  hasExploredN: false,
  hasAnswered: false,
};

function subscribeIsotopeStorage(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('b21-isotope-state-changed', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('b21-isotope-state-changed', listener);
  };
}

function getIsotopeRawSnapshot(): string {
  try {
    return window.localStorage.getItem(B21_ISOTOPE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function parseIsotopeState(raw: string): IsotopePersistedState {
  if (!raw) return INITIAL_ISOTOPE_STATE;
  try {
    const p = JSON.parse(raw) as Partial<IsotopePersistedState>;
    const clampZ = (v: unknown, def: number) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(118, Math.round(v))) : def;
    const clampN = (v: unknown, def: number) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(180, Math.round(v))) : def;

    return {
      z1: clampZ(p.z1, INITIAL_ISOTOPE_STATE.z1),
      n1: clampN(p.n1, INITIAL_ISOTOPE_STATE.n1),
      z2: clampZ(p.z2, INITIAL_ISOTOPE_STATE.z2),
      n2: clampN(p.n2, INITIAL_ISOTOPE_STATE.n2),
      feedback: typeof p.feedback === 'string' ? p.feedback.slice(0, 700) : '',
      hasExploredZ: Boolean(p.hasExploredZ),
      hasExploredN: Boolean(p.hasExploredN),
      hasAnswered: Boolean(p.hasAnswered),
    };
  } catch {
    return INITIAL_ISOTOPE_STATE;
  }
}

function writeIsotopeState(updater: (prev: IsotopePersistedState) => IsotopePersistedState) {
  if (typeof window === 'undefined') return;
  const current = parseIsotopeState(getIsotopeRawSnapshot());
  const next = updater(current);
  try {
    window.localStorage.setItem(B21_ISOTOPE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('b21-isotope-state-changed'));
  } catch {
    // Ignore storage quota errors
  }
}

function NucleusCluster({ cx, cy, z, n, baseScale }: { cx: number; cy: number; z: number; n: number; baseScale: number }) {
  const a = z + n;
  const radius = baseScale * Math.cbrt(a);
  const dotR = Math.max(1, (radius / Math.sqrt(Math.max(1, a))) * 0.85);

  const isProton = Array.from({ length: a }, (_, i) => i < z);
  for (let i = 0; i < a; i++) {
    const j = (i * 7) % a;
    const temp = isProton[i];
    isProton[i] = isProton[j];
    isProton[j] = temp;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border-light)" strokeDasharray="4 4" />
      {Array.from({ length: a }, (_, i) => {
        const r = Math.sqrt((i + 0.5) / a) * Math.max(0, radius - dotR);
        const angle = i * 2.39996322972865332;
        const proton = isProton[i];
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r={dotR}
            fill={proton ? '#b84040' : '#2357a5'}
            stroke="white"
            strokeWidth="0.5"
          />
        );
      })}
    </g>
  );
}

export function IsotopeActivity({ onProgress }: { onProgress?: (done: boolean) => void }) {
  const storedRaw = useSyncExternalStore(
    subscribeIsotopeStorage,
    getIsotopeRawSnapshot,
    EMPTY_RAW,
  );
  const state = useMemo(() => parseIsotopeState(storedRaw), [storedRaw]);
  const { z1, n1, z2, n2, feedback, hasExploredZ, hasExploredN, hasAnswered } = state;

  const isDone = hasExploredZ && hasExploredN && hasAnswered;
  const hadDoneRef = useRef(isDone);
  useEffect(() => {
    if (isDone || hadDoneRef.current) {
      onProgress?.(isDone);
    }
    hadDoneRef.current = isDone;
  }, [isDone, onProgress]);

  function updateNucleus(id: 1 | 2, dz: number, dn: number) {
    writeIsotopeState((prev) => {
      const oldZ = id === 1 ? prev.z1 : prev.z2;
      const oldN = id === 1 ? prev.n1 : prev.n2;

      const newZ = Math.max(1, Math.min(118, oldZ + dz));
      const newN = Math.max(0, Math.min(180, oldN + dn));

      if (newZ === oldZ && newN === oldN) return prev;

      const oldA = oldZ + oldN;
      const newA = newZ + newN;
      const oldR = 1.2 * Math.cbrt(oldA);
      const newR = 1.2 * Math.cbrt(newA);

      const oldEl = getElementInfo(oldZ);
      const newEl = getElementInfo(newZ);

      let msg = `Hạt nhân ${id}: `;
      if (dz !== 0) {
        msg += `Z ${dz > 0 ? 'tăng' : 'giảm'} từ ${oldZ} thành ${newZ} (điện tích +${newZ}e), tên nguyên tố đổi từ ${oldEl.name} (${oldEl.sym}) sang ${newEl.name} (${newEl.sym}); N giữ nguyên ${oldN}; chỉ số khối A cập nhật từ ${oldA} thành ${newA}; `;
      } else {
        msg += `Giữ nguyên Z = ${newZ} nên tên nguyên tố (${newEl.name}) và kí hiệu hóa học (${newEl.sym}) giữ nguyên; số neutron N = A − Z ${dn > 0 ? 'tăng' : 'giảm'} từ ${oldN} thành ${newN}, chỉ số khối A cập nhật đúng từ ${oldA} thành ${newA}; `;
      }
      msg += `bán kính R ≈ 1,2·A¹/³ ${newR > oldR ? 'tăng' : 'giảm'} từ ${oldR.toFixed(2)} fm sang ${newR.toFixed(2)} fm.`;

      return {
        ...prev,
        z1: id === 1 ? newZ : prev.z1,
        n1: id === 1 ? newN : prev.n1,
        z2: id === 2 ? newZ : prev.z2,
        n2: id === 2 ? newN : prev.n2,
        feedback: msg,
        hasExploredZ: prev.hasExploredZ || dz !== 0,
        hasExploredN: prev.hasExploredN || dn !== 0,
      };
    });
  }

  function selectHydrogenIsotope(iso: (typeof HYDROGEN_ISOTOPES_SGK)[number]) {
    writeIsotopeState((prev) => {
      const oldZ = prev.z1;
      const oldN = prev.n1;
      const newA = iso.z + iso.n;
      const changedNOnly = oldZ === 1 && oldN !== iso.n;
      const changedZ = oldZ !== 1;
      const msg =
        oldZ === 1
          ? `Đã chọn ${iso.label}: giữ nguyên Z = 1 nên tên nguyên tố (Hydrogen) và kí hiệu hóa học (H) giữ nguyên; số neutron N = A − Z = ${newA} − 1 = ${iso.n}, chỉ số khối A cập nhật đúng thành A = ${newA}.`
          : `Đã nạp ${iso.label} vào Hạt nhân 1 (Hydrogen, Z = 1, N = A − Z = ${iso.n}, số khối A = ${newA}) để đối chiếu với Hạt nhân 2.`;

      return {
        ...prev,
        z1: iso.z,
        n1: iso.n,
        // Nếu Hạt nhân 2 chưa phải Hydrogen thì đặt Hạt nhân 2 thành ¹₁H để học sinh thấy ngay 2 đồng vị Hydrogen cạnh nhau
        z2: prev.z2 === 1 ? prev.z2 : 1,
        n2: prev.z2 === 1 ? prev.n2 : (iso.n === 0 ? 1 : 0),
        feedback: msg,
        hasExploredZ: prev.hasExploredZ || changedZ,
        hasExploredN: prev.hasExploredN || changedNOnly || iso.n > 0,
      };
    });
  }

  function applyComparisonPair(
    pairLabel: string,
    nextZ1: number,
    nextN1: number,
    nextZ2: number,
    nextN2: number,
  ) {
    writeIsotopeState((prev) => {
      const el1 = getElementInfo(nextZ1);
      const el2 = getElementInfo(nextZ2);
      const sameElement = nextZ1 === nextZ2;
      const msg = sameElement
        ? `Đang đối chiếu ${pairLabel}: cùng Z = ${nextZ1} nên cùng là nguyên tố ${el1.name} (${el1.sym}), khác số neutron N (${nextN1} và ${nextN2}) nên số khối A khác nhau (${nextZ1 + nextN1} và ${nextZ2 + nextN2}).`
        : `Đang đối chiếu ${pairLabel}: ${el1.name}-${nextZ1 + nextN1} (Z = ${nextZ1}) và ${el2.name}-${nextZ2 + nextN2} (Z = ${nextZ2}) để so sánh quy luật bán kính R ≈ 1,2·A¹/³ fm.`;
      return {
        ...prev,
        z1: nextZ1,
        n1: nextN1,
        z2: nextZ2,
        n2: nextN2,
        feedback: msg,
        hasExploredZ: prev.hasExploredZ || !sameElement || prev.z1 !== nextZ1 || prev.z2 !== nextZ2,
        hasExploredN: prev.hasExploredN || (sameElement && nextN1 !== nextN2),
      };
    });
  }

  function handleAnswered(correct: boolean) {
    writeIsotopeState((prev) => ({
      ...prev,
      hasAnswered: correct,
    }));
  }

  const a1 = z1 + n1;
  const a2 = z2 + n2;
  const el1 = getElementInfo(z1);
  const el2 = getElementInfo(z2);
  const radius1 = 1.2 * Math.cbrt(a1);
  const radius2 = 1.2 * Math.cbrt(a2);

  return (
    <Lab intro="Đối chiếu các đồng vị (cùng Z, khác N, N = A − Z) trên 3 đồng vị Hydrogen chuẩn SGK tr. 95 và so sánh bán kính hạt nhân theo R ≈ 1,2·A¹/³ fm.">
      <div className="physics-guide">
        <p><strong>🔎 Chu trình khám phá:</strong></p>
        <ol>
          <li><strong>Dự đoán:</strong> Giữa <code>¹₁H</code>, <code>²₁H</code>, <code>³₁H</code>, đại lượng nào giữ nguyên và đại lượng nào thay đổi?</li>
          <li><strong>Thử:</strong> Bấm chọn nhanh <strong>3 đồng vị Hydrogen</strong> hoặc dùng nút <code>± proton</code>, <code>± neutron</code> bên dưới.</li>
          <li><strong>Quan sát:</strong> Đọc tên nguyên tố, <code>N = A − Z</code> và đối chiếu hai bán kính hạt nhân.</li>
          <li><strong>Giải thích:</strong> Trả lời câu hỏi về quy luật bán kính ở cuối bàn thực hành.</li>
        </ol>
      </div>

      {/* Thanh chọn nhanh 3 đồng vị Hydrogen chuẩn SGK tr. 95 + các cặp chuẩn */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          background: '#f8fafc',
          border: '1px solid var(--border-light, #cbd5e1)',
          borderRadius: '8px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Chọn nhanh 3 đồng vị Hydrogen chuẩn SGK tr. 95 (nạp vào Hạt nhân 1):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {HYDROGEN_ISOTOPES_SGK.map((iso) => {
              const active = z1 === iso.z && n1 === iso.n;
              return (
                <button
                  key={iso.key}
                  type="button"
                  className={`physics-button${active ? ' primary' : ''}`}
                  onClick={() => selectHydrogenIsotope(iso)}
                >
                  {iso.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Cặp đối chiếu mẫu SGK:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" className="physics-button" onClick={() => applyComparisonPair('¹²₆C & ¹⁴₆C', 6, 6, 6, 8)}>
              Đồng vị Carbon (¹²₆C &amp; ¹⁴₆C)
            </button>
            <button type="button" className="physics-button" onClick={() => applyComparisonPair('²³⁵₉₂U & ²³⁸₉₂U', 92, 143, 92, 146)}>
              Đồng vị Uranium (²³⁵₉₂U &amp; ²³⁸₉₂U)
            </button>
            <button type="button" className="physics-button" onClick={() => applyComparisonPair('²⁷₁₃Al & ⁵⁶₂₆Fe', 13, 14, 26, 30)}>
              So sánh kích thước (²⁷₁₃Al &amp; ⁵⁶₂₆Fe)
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {/* Panel 1 — dùng NuclearSymbol size="lg" rõ nét trên điện thoại 390px */}
        <div
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            padding: '12px',
            background: '#ffffff',
            border: '1px solid var(--border-light, #cbd5e1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <NuclearSymbol a={a1} z={z1} symbol={el1.sym} size="lg" />
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
              <strong>Hạt nhân 1: {el1.name} ({el1.sym})</strong>
              <br />
              Số proton: <strong>Z = {z1}</strong> · Số khối: <strong>A = {a1}</strong>
              <br />
              Số neutron: <strong>N = A − Z = {a1} − {z1} = {n1}</strong> · Điện tích: +{z1}e
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" className="physics-button" onClick={() => updateNucleus(1, 1, 0)}>+ proton</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(1, -1, 0)} disabled={z1 <= 1}>− proton</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(1, 0, 1)}>+ neutron</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(1, 0, -1)} disabled={n1 <= 0}>− neutron</button>
          </div>
        </div>

        {/* Panel 2 — dùng NuclearSymbol size="lg" rõ nét trên điện thoại 390px */}
        <div
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            padding: '12px',
            background: '#ffffff',
            border: '1px solid var(--border-light, #cbd5e1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <NuclearSymbol a={a2} z={z2} symbol={el2.sym} size="lg" />
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
              <strong>Hạt nhân 2: {el2.name} ({el2.sym})</strong>
              <br />
              Số proton: <strong>Z = {z2}</strong> · Số khối: <strong>A = {a2}</strong>
              <br />
              Số neutron: <strong>N = A − Z = {a2} − {z2} = {n2}</strong> · Điện tích: +{z2}e
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" className="physics-button" onClick={() => updateNucleus(2, 1, 0)}>+ proton</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(2, -1, 0)} disabled={z2 <= 1}>− proton</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(2, 0, 1)}>+ neutron</button>
            <button type="button" className="physics-button" onClick={() => updateNucleus(2, 0, -1)} disabled={n2 <= 0}>− neutron</button>
          </div>
        </div>
      </div>

      {z1 === z2 && n1 !== n2 && (
        <div
          role="status"
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            background: '#edf5ff',
            border: '1px solid #a6c8ff',
            borderRadius: '8px',
            fontSize: '13.5px',
            color: '#002d9c',
          }}
        >
          <strong>Hai đồng vị của cùng nguyên tố {el1.name} ({el1.sym}):</strong> Cùng số proton <code>Z = {z1}</code> nên tên nguyên tố và kí hiệu hóa học giữ nguyên, nhưng khác số neutron (<code>N₁ = {n1}</code> so với <code>N₂ = {n2}</code>) nên khác số khối (<code>A₁ = {a1}</code> so với <code>A₂ = {a2}</code>).
        </div>
      )}

      {feedback && (
        <div className="physics-feedback" role="status" style={{ marginBottom: '16px' }}>
          <strong>Phản hồi:</strong> {feedback}
        </div>
      )}

      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
        So sánh Bán kính hạt nhân: R ≈ r₀ · A<sup>1/3</sup>
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        r₀ ≈ 1,2 fm; 1 fm = 10⁻¹⁵ m. Công thức phù hợp hơn khi A &gt; 12. Hình minh họa thành phần, được phóng đại và vẽ theo cùng tỉ lệ, không khẳng định cấu hình tạo ra là đồng vị bền.
      </p>

      <svg className="physics-svg" viewBox="0 0 530 250" role="img" aria-label={`So sánh bán kính: ${el1.sym}-${a1} (R≈${radius1.toFixed(2)} fm) và ${el2.sym}-${a2} (R≈${radius2.toFixed(2)} fm).`}>
        <title>So sánh bán kính và cấu tạo hạt nhân (cùng tỉ lệ phóng đại)</title>

        <NucleusCluster cx={140} cy={110} z={z1} n={n1} baseScale={13} />
        <NucleusCluster cx={390} cy={110} z={z2} n={n2} baseScale={13} />

        <text x="140" y="215" textAnchor="middle" fontSize="13">
          {el1.sym}-{a1}: A₁ = {a1} → R ≈ {radius1.toFixed(2)} fm
        </text>
        <text x="390" y="215" textAnchor="middle" fontSize="13">
          {el2.sym}-{a2}: A₂ = {a2} → R ≈ {radius2.toFixed(2)} fm
        </text>

        <g transform="translate(200, 235)">
          <circle cx="10" cy="-4" r="4" fill="#b84040" />
          <text x="20" y="0" fontSize="12" fill="var(--text-secondary)">Proton (+)</text>
          <circle cx="80" cy="-4" r="4" fill="#2357a5" />
          <text x="90" y="0" fontSize="12" fill="var(--text-secondary)">Neutron (n)</text>
        </g>
      </svg>

      <div className="physics-checklist">
        <p><strong>Tiêu chí hoàn thành:</strong></p>
        <ul>
          <li className={hasExploredZ ? 'is-done' : ''}>Thử thay đổi proton (Z) để xem tên nguyên tố đổi {hasExploredZ ? '✓' : ''}</li>
          <li className={hasExploredN ? 'is-done' : ''}>Thử thay đổi neutron (N) (hoặc chọn các đồng vị Hydrogen) để thấy A và R đổi mà tên nguyên tố giữ nguyên {hasExploredN ? '✓' : ''}</li>
          <li className={hasAnswered ? 'is-done' : ''}>Trả lời câu hỏi về quy luật bán kính {hasAnswered ? '✓' : ''}</li>
        </ul>
      </div>

      <div>
        <ChoiceCheck
          onResult={handleAnswered}
          initialSelected={hasAnswered ? 2 : null}
          initialChecked={hasAnswered}
          question="Khi số khối tăng 8 lần, bán kính gần đúng tăng mấy lần?"
          options={['8 lần', '4 lần', '2 lần']}
          correctIndex={2}
          explanation="R tỉ lệ với căn bậc ba của A, nên R mới / R cũ = ∛8 = 2. Thể tích gần tỉ lệ với A (vì V ~ R³ ~ A), còn bán kính không tăng tuyến tính."
        />
      </div>
    </Lab>
  );
}
