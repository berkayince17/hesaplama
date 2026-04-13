export const LEGACY_CORNER_PSI = {
  box_corner: 0.55,
  standard: 0.35,
  thermal: 0.15,
} as const;

export const MATERIAL_CONSTANTS = {
  steelDensityKgPerM3: 7850,
  puConductivityWPerMk: 0.025,
  legacyMetalPathConductivityWPerMk: 32,
  steelConductivityWPerMk: 45,
  steelElasticityMpa: 200_000,
  steelYieldStrengthMpa: 235,
} as const;

export type CornerType = keyof typeof LEGACY_CORNER_PSI;
export type ProfileType = "box" | "c-shape";
export type SupportCondition = "fixed" | "pinned";

export interface EngineeringInputs {
  boxLengthCm: number;
  boxHeightCm: number;
  panelThicknessMm: number;
  deltaT: number;
  profilePitchMm: number;
  cornerType: CornerType;
  profileType: ProfileType;
  profileWidthMm: number;
  profileDepthMm: number;
  profileThicknessMm: number;
  windPressurePa: number;
  supportCondition: SupportCondition;
}

export type LegacyCalculationInputs = EngineeringInputs;

export interface LegacyCalculationResult {
  effectiveDeltaT: number;
  panelAreaM2: number;
  profileCount: number;
  profilePositionsMm: number[];
  profileWebCount: number;
  pureFoamResistance: number;
  metalPathResistance: number;
  wallHeatLossW: number;
  cornerHeatLossW: number;
  totalHeatLossW: number;
  cornerSharePercent: number;
  steelSectionAreaM2: number;
  totalWeightKg: number;
  thermalBridgeThresholdMm: number;
  hasThermalBridgeRisk: boolean;
  hasDirectMetalContact: boolean;
}

export interface StructuralMetrics {
  spanMm: number;
  lineLoadNPerMm: number;
  distributedLoadNPerM: number;
  inertiaMm4: number;
  sectionModulusMm3: number;
  maxMomentNmm: number;
  maxDeflectionMm: number;
  maxStressMpa: number;
  stressUtilizationPercent: number;
  isCriticalStress: boolean;
}

export interface LayoutMetrics {
  profilePositionsMm: number[];
  profileCount: number;
  closingGapMm: number | null;
  hasRemainderGap: boolean;
}

export interface EngineeringSystemResult {
  legacy: LegacyCalculationResult;
  structural: StructuralMetrics;
  layout: LayoutMetrics;
  advice: string[];
  warnings: string[];
}

export const defaultEngineeringInputs: EngineeringInputs = {
  boxLengthCm: 1360,
  boxHeightCm: 260,
  panelThicknessMm: 50,
  deltaT: 40,
  profilePitchMm: 650,
  cornerType: "box_corner",
  profileType: "box",
  profileWidthMm: 40,
  profileDepthMm: 40,
  profileThicknessMm: 2,
  windPressurePa: 800,
  supportCondition: "fixed",
};

export const defaultLegacyInputs = defaultEngineeringInputs;

export function getProfilePositions(
  boxLengthMm: number,
  pitchMm: number,
  profileWidthMm: number,
): number[] {
  const positions = [0];
  let current = pitchMm;

  while (current < boxLengthMm - profileWidthMm) {
    positions.push(current);
    current += pitchMm;
  }

  // Intentionally preserved from the legacy HTML, even when the last value
  // can duplicate or become negative for very short panels.
  if (boxLengthMm > 0) {
    positions.push(boxLengthMm - profileWidthMm);
  }

  return positions;
}

export function calculateEngineeringSystem(inputs: EngineeringInputs): EngineeringSystemResult {
  const legacy = calculateLegacyPanelSystem(inputs);
  const structural = calculateStructuralMetrics(inputs);
  const layout = calculateLayoutMetrics(inputs);
  const warnings = buildWarnings(legacy, structural, layout);
  const advice = buildAdvice(legacy, structural, layout);

  return {
    legacy,
    structural,
    layout,
    advice,
    warnings,
  };
}

export function calculateLegacyPanelSystem(
  inputs: LegacyCalculationInputs,
): LegacyCalculationResult {
  const effectiveDeltaT = Math.abs(inputs.deltaT);
  const panelAreaM2 = toSquareMeters(inputs.boxLengthCm, inputs.boxHeightCm);
  const profilePositionsMm = getProfilePositions(
    inputs.boxLengthCm * 10,
    inputs.profilePitchMm,
    inputs.profileWidthMm,
  );
  const profileCount = profilePositionsMm.length;
  const profileWebCount = inputs.profileType === "box" ? 2 : 1;

  const pureFoamResistance =
    (inputs.panelThicknessMm / 1000) /
    (MATERIAL_CONSTANTS.puConductivityWPerMk *
      (panelAreaM2 * ((inputs.profilePitchMm - inputs.profileWidthMm) / inputs.profilePitchMm)));

  const conductiveAreaFactor =
    (panelAreaM2 * profileWebCount * inputs.profileThicknessMm) / inputs.profilePitchMm;

  const metalPathResistance =
    ((Math.max(0, inputs.panelThicknessMm - inputs.profileDepthMm) / 1000) /
      (MATERIAL_CONSTANTS.puConductivityWPerMk * conductiveAreaFactor)) +
    (inputs.profileDepthMm / 1000) /
      (MATERIAL_CONSTANTS.legacyMetalPathConductivityWPerMk * conductiveAreaFactor);

  const wallHeatLossW =
    effectiveDeltaT / sumOfParallelConductances(pureFoamResistance, metalPathResistance);
  const cornerHeatLossW =
    LEGACY_CORNER_PSI[inputs.cornerType] * ((inputs.boxHeightCm / 100) * 4) * effectiveDeltaT;
  const totalHeatLossW = wallHeatLossW + cornerHeatLossW;

  const steelSectionAreaM2 =
    calculateSteelSectionAreaMm2(
      inputs.profileType,
      inputs.profileWidthMm,
      inputs.profileDepthMm,
      inputs.profileThicknessMm,
    ) / 1_000_000;

  const totalWeightKg =
    steelSectionAreaM2 *
      (inputs.boxHeightCm / 100) *
      profileCount *
      MATERIAL_CONSTANTS.steelDensityKgPerM3 +
    steelSectionAreaM2 *
      (inputs.boxLengthCm / 100) *
      2 *
      MATERIAL_CONSTANTS.steelDensityKgPerM3;

  const thermalBridgeThresholdMm = inputs.panelThicknessMm * 0.7;
  const hasThermalBridgeRisk = inputs.profileDepthMm >= thermalBridgeThresholdMm;
  const hasDirectMetalContact = inputs.profileDepthMm >= inputs.panelThicknessMm;

  return {
    effectiveDeltaT,
    panelAreaM2,
    profileCount,
    profilePositionsMm,
    profileWebCount,
    pureFoamResistance,
    metalPathResistance,
    wallHeatLossW,
    cornerHeatLossW,
    totalHeatLossW,
    cornerSharePercent: totalHeatLossW === 0 ? 0 : (cornerHeatLossW / totalHeatLossW) * 100,
    steelSectionAreaM2,
    totalWeightKg,
    thermalBridgeThresholdMm,
    hasThermalBridgeRisk,
    hasDirectMetalContact,
  };
}

export function getEngineeringAdvice(result: EngineeringSystemResult): string {
  return result.warnings[0] ?? result.advice[0] ?? "Sistem stabil gorunuyor.";
}

function calculateStructuralMetrics(inputs: EngineeringInputs): StructuralMetrics {
  const spanMm = inputs.boxHeightCm * 10;
  const distributedLoadNPerM = inputs.windPressurePa * (inputs.profilePitchMm / 1000);
  const lineLoadNPerMm = distributedLoadNPerM / 1000;
  const inertiaMm4 = calculateSectionInertiaMm4(
    inputs.profileType,
    inputs.profileWidthMm,
    inputs.profileDepthMm,
    inputs.profileThicknessMm,
  );
  const sectionModulusMm3 = inertiaMm4 / Math.max(inputs.profileDepthMm / 2, 1);
  const deflectionFactor = inputs.supportCondition === "fixed" ? 1 : 5;
  const momentDivisor = inputs.supportCondition === "fixed" ? 12 : 8;
  const maxMomentNmm = (lineLoadNPerMm * spanMm ** 2) / momentDivisor;
  const maxDeflectionMm =
    (deflectionFactor * lineLoadNPerMm * spanMm ** 4) /
    (384 * MATERIAL_CONSTANTS.steelElasticityMpa * inertiaMm4);
  const maxStressMpa = maxMomentNmm / sectionModulusMm3;

  return {
    spanMm,
    lineLoadNPerMm,
    distributedLoadNPerM,
    inertiaMm4,
    sectionModulusMm3,
    maxMomentNmm,
    maxDeflectionMm,
    maxStressMpa,
    stressUtilizationPercent: (maxStressMpa / MATERIAL_CONSTANTS.steelYieldStrengthMpa) * 100,
    isCriticalStress: maxStressMpa > MATERIAL_CONSTANTS.steelYieldStrengthMpa,
  };
}

function calculateLayoutMetrics(inputs: EngineeringInputs): LayoutMetrics {
  const profilePositionsMm = getProfilePositions(
    inputs.boxLengthCm * 10,
    inputs.profilePitchMm,
    inputs.profileWidthMm,
  );

  if (profilePositionsMm.length < 2) {
    return {
      profilePositionsMm,
      profileCount: profilePositionsMm.length,
      closingGapMm: null,
      hasRemainderGap: false,
    };
  }

  const lastIndex = profilePositionsMm.length - 1;
  const closingGapMm = Math.round(
    profilePositionsMm[lastIndex] - profilePositionsMm[lastIndex - 1],
  );

  return {
    profilePositionsMm,
    profileCount: profilePositionsMm.length,
    closingGapMm,
    hasRemainderGap: Math.abs(closingGapMm - inputs.profilePitchMm) > 1,
  };
}

function buildWarnings(
  legacy: LegacyCalculationResult,
  structural: StructuralMetrics,
  layout: LayoutMetrics,
): string[] {
  const warnings: string[] = [];

  if (legacy.hasDirectMetalContact) {
    warnings.push(
      "Direkt metal temas var. Legacy referanstaki maksimum isi koprusu kosulu olustu.",
    );
  } else if (legacy.hasThermalBridgeRisk) {
    warnings.push(
      `Profil derinligi panel kalinliginin %70 esigini gecti (${legacy.thermalBridgeThresholdMm.toFixed(1)} mm).`,
    );
  }

  if (structural.isCriticalStress) {
    warnings.push(
      `Birlesik gerilme kritik seviyede: ${structural.maxStressMpa.toFixed(1)} MPa > ${MATERIAL_CONSTANTS.steelYieldStrengthMpa} MPa.`,
    );
  }

  if (layout.hasRemainderGap && layout.closingGapMm !== null) {
    warnings.push(`Asimetrik kapanis araligi var: son kalan ${layout.closingGapMm} mm.`);
  }

  return warnings;
}

function buildAdvice(
  legacy: LegacyCalculationResult,
  structural: StructuralMetrics,
  layout: LayoutMetrics,
): string[] {
  const advice: string[] = [];

  if (!legacy.hasThermalBridgeRisk) {
    advice.push("Termal kopru riski kontrol altinda. Profiller kopuk katmaninin icinde kaliyor.");
  }

  if (!structural.isCriticalStress) {
    advice.push(
      `Statik kapasite guvenli bolgede. Gerilme kullanim orani %${structural.stressUtilizationPercent.toFixed(1)}.`,
    );
  }

  if (!layout.hasRemainderGap) {
    advice.push("Hatve dagilimi simetrik. Son kapanis legacy blueprint ile uyumlu.");
  }

  if (advice.length === 0) {
    advice.push("Termal ve statik iyilestirme icin profil derinligi ile hatve birlikte optimize edilmeli.");
  }

  return advice;
}

function toSquareMeters(boxLengthCm: number, boxHeightCm: number): number {
  return (boxLengthCm / 100) * (boxHeightCm / 100);
}

function sumOfParallelConductances(left: number, right: number): number {
  return 1 / left + 1 / right;
}

function calculateSteelSectionAreaMm2(
  profileType: ProfileType,
  profileWidthMm: number,
  profileDepthMm: number,
  profileThicknessMm: number,
): number {
  if (profileType === "box") {
    return (
      profileWidthMm * profileDepthMm -
      Math.max(profileWidthMm - 2 * profileThicknessMm, 0) *
        Math.max(profileDepthMm - 2 * profileThicknessMm, 0)
    );
  }

  return (
    profileWidthMm * profileThicknessMm * 2 +
    Math.max(profileDepthMm - 2 * profileThicknessMm, 0) * profileThicknessMm
  );
}

function calculateSectionInertiaMm4(
  profileType: ProfileType,
  profileWidthMm: number,
  profileDepthMm: number,
  profileThicknessMm: number,
): number {
  if (profileType === "box") {
    const innerWidth = Math.max(profileWidthMm - 2 * profileThicknessMm, 0);
    const innerDepth = Math.max(profileDepthMm - 2 * profileThicknessMm, 0);

    return (
      (profileWidthMm * profileDepthMm ** 3) / 12 -
      (innerWidth * innerDepth ** 3) / 12
    );
  }

  const flangeWidth = profileWidthMm;
  const flangeThickness = profileThicknessMm;
  const webThickness = profileThicknessMm;
  const webHeight = Math.max(profileDepthMm - 2 * profileThicknessMm, 0);
  const flangeOffset = Math.max(profileDepthMm / 2 - flangeThickness / 2, 0);
  const webInertia = (webThickness * webHeight ** 3) / 12;
  const flangeInertia =
    (flangeWidth * flangeThickness ** 3) / 12 +
    flangeWidth * flangeThickness * flangeOffset ** 2;

  return webInertia + 2 * flangeInertia;
}
