import type { InputMode } from '../components/input_state';
import type { LookTuning } from '../tuning';

export type LookMappingResult = {
  x: number;
  y: number;
};

export const mapLook = (
  rawX: number,
  rawY: number,
  mode: InputMode,
  tuning: LookTuning,
  out?: LookMappingResult,
): LookMappingResult => {
  const result = out ?? { x: 0, y: 0 };
  const baseX = -rawX;
  const baseY = rawY;
  const invertX = mode === 'touch' ? tuning.invertLookXTouch : tuning.invertLookXGyro;
  const invertY = mode === 'touch' ? tuning.invertLookYTouch : tuning.invertLookYGyro;
  const sensitivity = mode === 'gyro' ? tuning.lookSensitivityGyro : tuning.lookSensitivityTouch;

  result.x = (invertX ? -baseX : baseX) * sensitivity;
  result.y = (invertY ? -baseY : baseY) * sensitivity;

  return result;
};
