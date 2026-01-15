import { Vector3 } from 'three';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const computeAssistedAim = (
  forward: Vector3,
  targetDir: Vector3,
  strength: number,
  coneDeg: number,
  out?: Vector3,
): Vector3 => {
  const result = out ?? new Vector3();
  const clampedStrength = clamp(strength, 0, 1);
  if (clampedStrength <= 0) {
    return result.copy(forward);
  }

  const coneCos = Math.cos((coneDeg * Math.PI) / 180);
  const dot = forward.dot(targetDir);
  if (dot < coneCos) {
    return result.copy(forward);
  }

  result.copy(forward).lerp(targetDir, clampedStrength).normalize();
  return result;
};
