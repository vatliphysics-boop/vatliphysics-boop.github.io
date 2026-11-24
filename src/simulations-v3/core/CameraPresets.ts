/**
 * Camera preset configurations for apparatus viewing
 * Defines standard viewpoints for multi-angle observation
 */

import type { CameraMode } from "./types";

// Re-export for downstream consumers
export type { CameraMode };

/** Camera configuration for a preset */
export interface CameraPreset {
  readonly mode: CameraMode;
  readonly nameVi: string;
  readonly nameEn: string;
  readonly description: string;
}

/** All available camera presets */
export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    mode: "orbit",
    nameVi: "Xoay quanh",
    nameEn: "Orbit",
    description: "Xoay 360° quanh thiết bị, zoom và nghiêng tự do",
  },
  {
    mode: "front",
    nameVi: "Phía trước",
    nameEn: "Front view",
    description: "Nhìn từ phía nguồn alpha, hướng về phía bia",
  },
  {
    mode: "back",
    nameVi: "Phía sau",
    nameEn: "Back view",
    description: "Nhìn từ phía sau màn ghi nhận",
  },
  {
    mode: "left",
    nameVi: "Bên trái",
    nameEn: "Left side",
    description: "Nhìn từ bên trái thiết bị",
  },
  {
    mode: "right",
    nameVi: "Bên phải",
    nameEn: "Right side",
    description: "Nhìn từ bên phải thiết bị",
  },
  {
    mode: "top",
    nameVi: "Từ trên",
    nameEn: "Top view",
    description: "Nhìn từ trên xuống, quan sát bố trí tổng thể",
  },
  {
    mode: "cutaway",
    nameVi: "Cắt lớp",
    nameEn: "Cutaway",
    description: "Cắt bỏ một phần vỏ để quan sát bên trong",
  },
  {
    mode: "exploded",
    nameVi: "Tách rời",
    nameEn: "Exploded view",
    description: "Tách các bộ phận để quan sát cấu tạo",
  },
  {
    mode: "instrument",
    nameVi: "Góc nhìn kính hiển vi",
    nameEn: "Microscope POV",
    description: "Nhìn qua kính hiển vi, quan sát màn phát quang",
  },
  {
    mode: "measurement",
    nameVi: "Góc đo",
    nameEn: "Measurement view",
    description: "Góc nhìn tối ưu để đọc thang đo và số liệu",
  },
] as const;

/** Get preset by mode */
export function getCameraPreset(mode: CameraMode): CameraPreset | undefined {
  return CAMERA_PRESETS.find((p) => p.mode === mode);
}

/** Get preset name in Vietnamese */
export function getCameraName(mode: CameraMode): string {
  return getCameraPreset(mode)?.nameVi ?? mode;
}
