"use client";

import {
  type ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useId,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Gauge,
  Layers3,
  ShieldAlert,
  Snowflake,
  Wrench,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import { HeatFlowCanvas } from "@/components/heat-flow-canvas";
import { cn } from "@/lib/utils";
import {
  LEGACY_CORNER_PSI,
  MATERIAL_CONSTANTS,
  calculateEngineeringSystem,
  defaultEngineeringInputs,
  type CornerType,
  type EngineeringInputs,
  type ProfileType,
  type SupportCondition,
} from "@/lib/physics-engine";

const STORAGE_KEY = "thermodynamic-core-dashboard-v1";

const cornerOptions: Array<{ value: CornerType; label: string }> = [
  { value: "box_corner", label: "Kutu profil kose" },
  { value: "standard", label: "L profil standart" },
  { value: "thermal", label: "Isi kiricili profil" },
];

const profileOptions: Array<{ value: ProfileType; label: string }> = [
  { value: "box", label: "Kutu profil" },
  { value: "c-shape", label: "C/U profil" },
];

const supportOptions: Array<{ value: SupportCondition; label: string }> = [
  { value: "fixed", label: "Ankastre" },
  { value: "pinned", label: "Mafsalli" },
];

type NumericFieldKey = {
  [Key in keyof EngineeringInputs]: EngineeringInputs[Key] extends number ? Key : never;
}[keyof EngineeringInputs];

export function EngineeringDashboard() {
  const [inputs, setInputs] = useState<EngineeringInputs>(defaultEngineeringInputs);
  const [storageReady, setStorageReady] = useState(false);
  const deferredInputs = useDeferredValue(inputs);
  const result = calculateEngineeringSystem(deferredInputs);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as Partial<EngineeringInputs>;
      startTransition(() => {
        setInputs(sanitizeInputs(parsed));
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs, storageReady]);

  const updateNumericField = (field: NumericFieldKey, value: number) => {
    startTransition(() => {
      setInputs((current) => ({
        ...current,
        [field]: Number.isFinite(value) ? value : current[field],
      }));
    });
  };

  const updateSelectField = <
    Key extends keyof Pick<EngineeringInputs, "cornerType" | "profileType" | "supportCondition">,
  >(
    field: Key,
    value: EngineeringInputs[Key],
  ) => {
    startTransition(() => {
      setInputs((current) => ({
        ...current,
        [field]: value,
      }));
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/65 shadow-glow backdrop-blur">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 p-5 xl:min-h-screen xl:border-b-0 xl:border-r">
            <div className="sticky top-5 space-y-5">
              <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Thermodynamic Core
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
                  Kasa optimizasyon paneli
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Legacy v22 termal denklemleri korunur, statik analiz ve teknik gorunusler modern
                  dashboard uzerinden canli hesaplanir.
                </p>
              </div>

              <SidebarGroup icon={Layers3} title="Kasa ve panel">
                <RangeField
                  label="Uzunluk"
                  suffix="cm"
                  min={300}
                  max={2000}
                  step={10}
                  value={inputs.boxLengthCm}
                  onChange={(value) => updateNumericField("boxLengthCm", value)}
                />
                <RangeField
                  label="Yukseklik"
                  suffix="cm"
                  min={120}
                  max={400}
                  step={5}
                  value={inputs.boxHeightCm}
                  onChange={(value) => updateNumericField("boxHeightCm", value)}
                />
                <RangeField
                  label="Panel kalinligi"
                  suffix="mm"
                  min={30}
                  max={150}
                  step={5}
                  value={inputs.panelThicknessMm}
                  onChange={(value) => updateNumericField("panelThicknessMm", value)}
                />
                <RangeField
                  label="Delta T"
                  suffix="C"
                  min={0}
                  max={80}
                  step={1}
                  value={inputs.deltaT}
                  onChange={(value) => updateNumericField("deltaT", value)}
                />
              </SidebarGroup>

              <SidebarGroup icon={Wrench} title="Karkas ayarlari">
                <SelectField
                  label="Profil tipi"
                  value={inputs.profileType}
                  options={profileOptions}
                  onChange={(value) => updateSelectField("profileType", value as ProfileType)}
                />
                <RangeField
                  label="Hatve"
                  suffix="mm"
                  min={200}
                  max={900}
                  step={10}
                  value={inputs.profilePitchMm}
                  onChange={(value) => updateNumericField("profilePitchMm", value)}
                />
                <RangeField
                  label="Profil genisligi"
                  suffix="mm"
                  min={20}
                  max={120}
                  step={2}
                  value={inputs.profileWidthMm}
                  onChange={(value) => updateNumericField("profileWidthMm", value)}
                />
                <RangeField
                  label="Profil derinligi"
                  suffix="mm"
                  min={20}
                  max={120}
                  step={2}
                  value={inputs.profileDepthMm}
                  onChange={(value) => updateNumericField("profileDepthMm", value)}
                />
                <RangeField
                  label="Et kalinligi"
                  suffix="mm"
                  min={1}
                  max={6}
                  step={0.5}
                  value={inputs.profileThicknessMm}
                  onChange={(value) => updateNumericField("profileThicknessMm", value)}
                />
              </SidebarGroup>

              <SidebarGroup icon={ShieldAlert} title="Sinir durumlari">
                <SelectField
                  label="Kose birlesimi"
                  value={inputs.cornerType}
                  options={cornerOptions}
                  onChange={(value) => updateSelectField("cornerType", value as CornerType)}
                />
                <SelectField
                  label="Mesnet tipi"
                  value={inputs.supportCondition}
                  options={supportOptions}
                  onChange={(value) =>
                    updateSelectField("supportCondition", value as SupportCondition)
                  }
                />
                <RangeField
                  label="Ruzgar yuku"
                  suffix="Pa"
                  min={100}
                  max={2500}
                  step={25}
                  value={inputs.windPressurePa}
                  onChange={(value) => updateNumericField("windPressurePa", value)}
                />
              </SidebarGroup>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setInputs({ ...defaultEngineeringInputs })}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-400/30 hover:bg-white/10"
                >
                  Varsayilan degerlere don
                </button>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-xs leading-6 text-slate-400">
                  Ayarlar otomatik olarak tarayicida saklanir. Legacy sabitleri:
                  <div className="mt-2 grid gap-1 text-slate-300">
                    <span>PSI box corner: {LEGACY_CORNER_PSI.box_corner}</span>
                    <span>PU: {MATERIAL_CONSTANTS.puConductivityWPerMk} W/mK</span>
                    <span>Celik yogunlugu: {MATERIAL_CONSTANTS.steelDensityKgPerM3} kg/m3</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6 p-5">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Live summary
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  <MetricCard
                    accent="cyan"
                    label="Toplam isi kaybi"
                    value={result.legacy.totalHeatLossW}
                    suffix="W"
                    hint={`Kose payi %${result.legacy.cornerSharePercent.toFixed(1)}`}
                    icon={Snowflake}
                  />
                  <MetricCard
                    accent="amber"
                    label="Toplam agirlik"
                    value={result.legacy.totalWeightKg}
                    suffix="kg"
                    hint={`${result.layout.profileCount} profil`}
                    icon={Layers3}
                  />
                  <MetricCard
                    accent={result.legacy.hasThermalBridgeRisk ? "rose" : "emerald"}
                    label="Isi koprusu esigi"
                    value={result.legacy.thermalBridgeThresholdMm}
                    suffix="mm"
                    hint={
                      result.legacy.hasDirectMetalContact
                        ? "Direkt temas"
                        : result.legacy.hasThermalBridgeRisk
                          ? "Riskli bolge"
                          : "Guvenli bolge"
                    }
                    icon={AlertTriangle}
                    pulse={result.legacy.hasThermalBridgeRisk}
                  />
                  <MetricCard
                    accent={result.structural.isCriticalStress ? "rose" : "emerald"}
                    label="Maks gerilme"
                    value={result.structural.maxStressMpa}
                    suffix="MPa"
                    hint={`Kullanim %${result.structural.stressUtilizationPercent.toFixed(1)}`}
                    icon={Gauge}
                    pulse={result.structural.isCriticalStress}
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Muhendislik karari
                </p>
                <div className="mt-4 space-y-3">
                  {result.warnings.length > 0 ? (
                    result.warnings.map((warning) => (
                      <WarningRow key={warning} tone="rose" text={warning} />
                    ))
                  ) : (
                    <WarningRow tone="emerald" text="Kritik bir hata kosulu tespit edilmedi." />
                  )}
                  {result.advice.map((item) => (
                    <WarningRow key={item} tone="cyan" text={item} />
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
                      Isi akis simulasyonu
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Delta T ve kopru riskine gore canvasta dinamik akisi gosterir.
                    </p>
                  </div>
                  <ArrowRightLeft className="h-5 w-5 text-orange-300" />
                </div>
                <HeatFlowCanvas
                  boxLengthCm={inputs.boxLengthCm}
                  panelThicknessMm={inputs.panelThicknessMm}
                  profilePositionsMm={result.layout.profilePositionsMm}
                  totalHeatLossW={result.legacy.totalHeatLossW}
                  hasThermalBridgeRisk={result.legacy.hasThermalBridgeRisk}
                  hasDirectMetalContact={result.legacy.hasDirectMetalContact}
                />
              </div>

              <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                  Statik analiz
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <StatChip label="Atalet momenti" value={`${formatCompact(result.structural.inertiaMm4)} mm4`} />
                  <StatChip label="Kesit modulu" value={`${formatCompact(result.structural.sectionModulusMm3)} mm3`} />
                  <StatChip label="Sehim" value={`${result.structural.maxDeflectionMm.toFixed(2)} mm`} />
                  <StatChip label="Ruzgar cizgisel yuku" value={`${result.structural.distributedLoadNPerM.toFixed(1)} N/m`} />
                </div>
                <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Mesnet</span>
                    <span>{inputs.supportCondition === "fixed" ? "Ankastre" : "Mafsalli"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span>Akma siniri</span>
                    <span>{MATERIAL_CONSTANTS.steelYieldStrengthMpa} MPa</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        result.structural.isCriticalStress ? "bg-rose-400" : "bg-emerald-400",
                      )}
                      style={{
                        width: `${Math.min(result.structural.stressUtilizationPercent, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <PanelCard title="Kose detayi" subtitle="Legacy v22 SVG referansinin React uyarlamasi">
                <CornerSvg
                  panelThicknessMm={inputs.panelThicknessMm}
                  profileDepthMm={inputs.profileDepthMm}
                  cornerType={inputs.cornerType}
                />
              </PanelCard>

              <PanelCard title="Karkas semasi" subtitle="Yan gorunus ve profil dagilimi">
                <ElevationSvg
                  boxLengthCm={inputs.boxLengthCm}
                  boxHeightCm={inputs.boxHeightCm}
                  profilePitchMm={inputs.profilePitchMm}
                  profileWidthMm={inputs.profileWidthMm}
                  profilePositionsMm={result.layout.profilePositionsMm}
                  profileType={inputs.profileType}
                />
              </PanelCard>
            </div>

            <PanelCard
              title="Tam boy ust kesit"
              subtitle="Kapatma payi, profil gomulmesi ve termal kopru izleme"
            >
              <FullPlanSvg
                boxLengthCm={inputs.boxLengthCm}
                panelThicknessMm={inputs.panelThicknessMm}
                profilePitchMm={inputs.profilePitchMm}
                profileWidthMm={inputs.profileWidthMm}
                profileDepthMm={inputs.profileDepthMm}
                profileThicknessMm={inputs.profileThicknessMm}
                profileType={inputs.profileType}
                profilePositionsMm={result.layout.profilePositionsMm}
              />
            </PanelCard>
          </section>
        </div>
      </section>
    </main>
  );
}

function sanitizeInputs(partial: Partial<EngineeringInputs>): EngineeringInputs {
  return {
    ...defaultEngineeringInputs,
    ...partial,
    boxLengthCm: clampNumber(partial.boxLengthCm, 300, 2000, defaultEngineeringInputs.boxLengthCm),
    boxHeightCm: clampNumber(partial.boxHeightCm, 120, 400, defaultEngineeringInputs.boxHeightCm),
    panelThicknessMm: clampNumber(
      partial.panelThicknessMm,
      30,
      150,
      defaultEngineeringInputs.panelThicknessMm,
    ),
    deltaT: clampNumber(partial.deltaT, 0, 80, defaultEngineeringInputs.deltaT),
    profilePitchMm: clampNumber(
      partial.profilePitchMm,
      200,
      900,
      defaultEngineeringInputs.profilePitchMm,
    ),
    profileWidthMm: clampNumber(
      partial.profileWidthMm,
      20,
      120,
      defaultEngineeringInputs.profileWidthMm,
    ),
    profileDepthMm: clampNumber(
      partial.profileDepthMm,
      20,
      120,
      defaultEngineeringInputs.profileDepthMm,
    ),
    profileThicknessMm: clampNumber(
      partial.profileThicknessMm,
      1,
      6,
      defaultEngineeringInputs.profileThicknessMm,
    ),
    windPressurePa: clampNumber(
      partial.windPressurePa,
      100,
      2500,
      defaultEngineeringInputs.windPressurePa,
    ),
    cornerType: isCornerType(partial.cornerType)
      ? partial.cornerType
      : defaultEngineeringInputs.cornerType,
    profileType: isProfileType(partial.profileType)
      ? partial.profileType
      : defaultEngineeringInputs.profileType,
    supportCondition: isSupportCondition(partial.supportCondition)
      ? partial.supportCondition
      : defaultEngineeringInputs.supportCondition,
  };
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function isCornerType(value: unknown): value is CornerType {
  return value === "box_corner" || value === "standard" || value === "thermal";
}

function isProfileType(value: unknown): value is ProfileType {
  return value === "box" || value === "c-shape";
}

function isSupportCondition(value: unknown): value is SupportCondition {
  return value === "fixed" || value === "pinned";
}

function SidebarGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers3;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
          <Icon className="h-4 w-4 text-cyan-300" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
}) {
  const fieldId = useId();

  return (
    <label htmlFor={fieldId} className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {value}
          {suffix}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_84px] gap-3">
        <input
          id={fieldId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-full cursor-pointer appearance-none rounded-full bg-white/5 px-1"
        />
        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {suffix}
          </span>
        </div>
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const fieldId = useId();

  return (
    <label htmlFor={fieldId} className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  accent,
  pulse = false,
}: {
  label: string;
  value: number;
  suffix: string;
  hint: string;
  icon: typeof Layers3;
  accent: "cyan" | "amber" | "rose" | "emerald";
  pulse?: boolean;
}) {
  const accentClass = {
    cyan: "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
    amber: "text-amber-300 border-amber-400/20 bg-amber-400/10",
    rose: "text-rose-300 border-rose-400/20 bg-rose-400/10",
    emerald: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
  }[accent];

  return (
    <motion.div
      layout
      className={cn(
        "rounded-[28px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        accentClass,
        pulse && "engine-glow",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <p className="mt-2 text-sm text-slate-200/80">{hint}</p>
    </motion.div>
  );
}

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    damping: 22,
    stiffness: 140,
  });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplay(latest);
  });

  return (
    <span>
      {display.toLocaleString("tr-TR", {
        maximumFractionDigits: 1,
      })}
      <span className="ml-1 text-base font-medium text-slate-200/80">{suffix}</span>
    </span>
  );
}

function WarningRow({ tone, text }: { tone: "rose" | "cyan" | "emerald"; text: string }) {
  const accentClass = {
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-100",
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", accentClass)}>{text}</div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-900/70 p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function CornerSvg({
  panelThicknessMm,
  profileDepthMm,
  cornerType,
}: {
  panelThicknessMm: number;
  profileDepthMm: number;
  cornerType: CornerType;
}) {
  const svgWidth = 220;
  const svgHeight = 190;
  const scale = 2;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-[260px] w-full rounded-[24px] bg-slate-950/60">
      <rect x="60" y="42" width="104" height={panelThicknessMm * scale} fill="#fef3c7" stroke="#f59e0b" />
      <rect x="60" y="42" width={panelThicknessMm * scale} height="104" fill="#fef3c7" stroke="#f59e0b" />
      {cornerType === "box_corner" ? (
        <>
          <rect
            x="60"
            y="42"
            width={profileDepthMm * scale}
            height={profileDepthMm * scale}
            fill="#94a3b8"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <rect
            x="64"
            y="46"
            width={Math.max(profileDepthMm * scale - 8, 1)}
            height={Math.max(profileDepthMm * scale - 8, 1)}
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="0.8"
          />
          <line x1="58" y1="40" x2="36" y2="18" stroke="#f43f5e" strokeWidth="2" />
          <circle cx="36" cy="18" r="4" fill="#f43f5e" />
        </>
      ) : (
        <path
          d="M 60 42 L 148 42 L 148 48 L 66 48 L 66 146 L 60 146 Z"
          fill={cornerType === "thermal" ? "#22c55e" : "#475569"}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
      )}
      <text x="60" y="22" fill="#e2e8f0" fontSize="12" fontWeight="700">
        Kose kesiti
      </text>
    </svg>
  );
}

function ElevationSvg({
  boxLengthCm,
  boxHeightCm,
  profilePitchMm,
  profileWidthMm,
  profilePositionsMm,
  profileType,
}: {
  boxLengthCm: number;
  boxHeightCm: number;
  profilePitchMm: number;
  profileWidthMm: number;
  profilePositionsMm: number[];
  profileType: ProfileType;
}) {
  const svgWidth = 420;
  const svgHeight = 210;
  const scale = boxLengthCm > 800 ? 0.25 : 0.4;
  const displayLength = boxLengthCm * scale;
  const displayHeight = boxHeightCm * scale;
  const frameThickness = 10;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-[260px] w-full rounded-[24px] bg-slate-950/60">
      <rect x="20" y="30" width={displayLength} height={displayHeight} fill="#fef3c7" stroke="#f59e0b" opacity="0.72" />
      <rect x="20" y={30 - frameThickness} width={displayLength} height={frameThickness} fill="#475569" stroke="#0f172a" />
      <rect x="20" y={30 + displayHeight} width={displayLength} height={frameThickness} fill="#475569" stroke="#0f172a" />
      {profilePositionsMm.map((position) => {
        const x = 20 + (position / 10) * scale;
        const width = Math.max((profileWidthMm / 10) * scale, 2);

        return profileType === "box" ? (
          <rect
            key={position}
            x={x}
            y="30"
            width={width}
            height={displayHeight}
            fill="#94a3b8"
            stroke="#334155"
            opacity="0.82"
          />
        ) : (
          <line
            key={position}
            x1={x}
            y1="30"
            x2={x}
            y2={30 + displayHeight}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        );
      })}
      <line x1="20" y1="184" x2={20 + (profilePitchMm / 10) * scale} y2="184" stroke="#f43f5e" strokeDasharray="4 4" />
      <text x="20" y="18" fill="#e2e8f0" fontSize="12" fontWeight="700">
        L: {boxLengthCm} cm / H: {boxHeightCm} cm
      </text>
      <text x="20" y="199" fill="#fda4af" fontSize="11" fontWeight="700">
        Hatve: {profilePitchMm} mm
      </text>
    </svg>
  );
}

function FullPlanSvg({
  boxLengthCm,
  panelThicknessMm,
  profilePitchMm,
  profileWidthMm,
  profileDepthMm,
  profileThicknessMm,
  profileType,
  profilePositionsMm,
}: {
  boxLengthCm: number;
  panelThicknessMm: number;
  profilePitchMm: number;
  profileWidthMm: number;
  profileDepthMm: number;
  profileThicknessMm: number;
  profileType: ProfileType;
  profilePositionsMm: number[];
}) {
  const viewWidth = 1200;
  const viewHeight = 220;
  const paddingX = 50;
  const paddingY = 70;
  const boxLengthMm = boxLengthCm * 10;
  const drawLength = viewWidth - paddingX * 2;
  const scaleX = drawLength / Math.max(boxLengthMm, 1);
  const drawThickness = 60;
  const scaleY = drawThickness / Math.max(panelThicknessMm, 1);

  const closingGapLabel = getClosingGapLabel(profilePositionsMm, profilePitchMm);

  return (
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="h-[280px] w-full rounded-[24px] bg-slate-950/60">
      <rect
        x={paddingX}
        y={paddingY}
        width={drawLength}
        height={drawThickness}
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      {profilePositionsMm.map((position, index) => {
        const depthPx = profileDepthMm * scaleY;
        const widthPx = Math.max(depthPx * (profileWidthMm / Math.max(profileDepthMm, 1)) * 0.35, 4);
        const startX =
          index === 0
            ? paddingX
            : index === profilePositionsMm.length - 1
              ? paddingX + drawLength - widthPx
              : paddingX + position * scaleX;

        return (
          <g key={`${position}-${index}`}>
            {profileType === "box" ? (
              <>
                <rect
                  x={startX}
                  y={paddingY}
                  width={widthPx}
                  height={depthPx}
                  fill="#94a3b8"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <rect
                  x={startX + 1.5}
                  y={paddingY + 1.5}
                  width={Math.max(widthPx - 3, 1)}
                  height={Math.max(depthPx - 3, 1)}
                  fill="#e2e8f0"
                  stroke="#0f172a"
                  strokeWidth="0.7"
                  opacity="0.9"
                />
              </>
            ) : (
              <path
                d={`M ${startX + widthPx} ${paddingY} L ${startX} ${paddingY} L ${startX} ${paddingY + depthPx} L ${startX + widthPx} ${paddingY + depthPx}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={Math.max((profileThicknessMm / Math.max(profileDepthMm, 1)) * depthPx * 0.5, 1.5)}
              />
            )}
            {profileDepthMm >= panelThicknessMm ? (
              <line
                x1={startX - 2}
                y1={paddingY + drawThickness}
                x2={startX + widthPx + 2}
                y2={paddingY + drawThickness}
                stroke="#f43f5e"
                strokeWidth="3"
              />
            ) : null}
          </g>
        );
      })}
      <line x1={paddingX} y1={160} x2={paddingX + drawLength} y2={160} stroke="#64748b" strokeWidth="2" />
      <line x1={paddingX} y1={150} x2={paddingX} y2={170} stroke="#64748b" strokeWidth="2" />
      <line x1={paddingX + drawLength} y1={150} x2={paddingX + drawLength} y2={170} stroke="#64748b" strokeWidth="2" />
      <text x={paddingX + drawLength / 2} y="182" fill="#e2e8f0" fontSize="14" fontWeight="800" textAnchor="middle">
        Toplam kasa uzunlugu = {boxLengthCm} cm
      </text>
      <text x={paddingX} y="36" fill="#f59e0b" fontSize="12" fontWeight="800">
        PU kopuk yonu
      </text>
      <text x={paddingX} y="146" fill="#60a5fa" fontSize="12" fontWeight="800">
        Dis sac
      </text>
      <line x1={paddingX} y1="52" x2={paddingX + profilePitchMm * scaleX} y2="52" stroke="#f43f5e" strokeDasharray="4 4" />
      <text x={paddingX + (profilePitchMm * scaleX) / 2} y="46" fill="#fda4af" fontSize="11" fontWeight="700" textAnchor="middle">
        Hatve: {profilePitchMm} mm
      </text>
      {closingGapLabel ? (
        <text x={viewWidth - 180} y="46" fill="#fbbf24" fontSize="11" fontWeight="700">
          Son kalan: {closingGapLabel} mm
        </text>
      ) : null}
    </svg>
  );
}

function getClosingGapLabel(profilePositionsMm: number[], pitchMm: number) {
  if (profilePositionsMm.length < 2) {
    return null;
  }

  const gap = Math.round(
    profilePositionsMm[profilePositionsMm.length - 1] -
      profilePositionsMm[profilePositionsMm.length - 2],
  );

  return Math.abs(gap - pitchMm) > 1 ? gap : null;
}

function formatCompact(value: number) {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 0,
  });
}
