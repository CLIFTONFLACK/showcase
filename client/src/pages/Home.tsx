/**
 * IBD Malnutrition Calculator — SLA Health Brand
 * Site: SLAHealth.com
 * Design tokens:
 *   Primary action: #FF5A00 (SLA Orange)
 *   Headings: #0A1929 (SLA Navy) — Outfit font, 800 weight, uppercase
 *   Body: Inter font
 *   Background: #F8FAFC
 *   Card: #FFFFFF, border #E2E8F0, shadow: 0 10px 30px rgba(0,0,0,0.05)
 *   Radius: 12px standard, 16px large card
 *   Results box: orange-light bg (#FFF7ED), 6px orange left border
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateScore,
  calculateBMI,
  getBMICategory,
  lbsToKg,
  stLbsToKg,
  ftInToCm,
  type CalculatorInputs,
  type CalculatorResult,
  type IBDType,
  type Gender,
  type WeightLossCategory,
  type AbdominalPain,
  type Wellbeing,
} from "@/lib/calculator";

// ─── SLA Brand Constants ───────────────────────────────────────────────────────
const SLA = {
  orange: "#FF5A00",
  orangeHover: "#E04F00",
  orangeLight: "#FFF7ED",
  navy: "#0A1929",
  navyMuted: "#1E293B",
  bgLight: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#1F2937",
  textMuted: "#64748B",
  shadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
  radius: "12px",
  radiusLg: "16px",
};

// ─── Step Definitions ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 11;

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: SLA.textMuted }}
        >
          Step {step} of {total}
        </span>
        <span className="text-xs font-semibold" style={{ color: SLA.orange }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: SLA.border }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: SLA.orange }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface OptionCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ label, sublabel, selected, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className="option-card w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all"
      style={{
        borderColor: selected ? SLA.orange : SLA.border,
        background: selected ? SLA.orangeLight : SLA.white,
        color: selected ? SLA.navy : SLA.textMain,
      }}
    >
      <span
        className="block text-sm leading-snug"
        style={{
          fontWeight: selected ? 700 : 500,
          fontFamily: selected ? "'Outfit', sans-serif" : "'Inter', sans-serif",
          color: selected ? SLA.navy : SLA.textMain,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className="block text-xs mt-0.5"
          style={{ color: SLA.textMuted }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

function YesNoCard({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <OptionCard label="Yes" selected={value === true} onClick={() => onChange(true)} />
      <OptionCard label="No" selected={value === false} onClick={() => onChange(false)} />
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
          style={{
            borderColor: SLA.border,
            color: SLA.textMuted,
            background: "transparent",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = SLA.orange;
            (e.currentTarget as HTMLButtonElement).style.color = SLA.orange;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = SLA.border;
            (e.currentTarget as HTMLButtonElement).style.color = SLA.textMuted;
          }}
        >
          ← Back
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{
            background: nextDisabled ? SLA.border : SLA.orange,
            color: nextDisabled ? SLA.textMuted : SLA.white,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            cursor: nextDisabled ? "not-allowed" : "pointer",
            boxShadow: nextDisabled ? "none" : "0 4px 12px rgba(255, 90, 0, 0.2)",
          }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

// ─── Unit Toggle Button ───────────────────────────────────────────────────────

function UnitToggle<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
          style={{
            borderColor: value === opt ? SLA.orange : SLA.border,
            background: value === opt ? SLA.orangeLight : SLA.bgLight,
            color: value === opt ? SLA.navy : SLA.textMuted,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────

function SlaInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={{
        width: "100%",
        padding: "14px 16px",
        backgroundColor: focused ? SLA.white : SLA.bgLight,
        border: `1px solid ${focused ? SLA.orange : SLA.border}`,
        borderRadius: SLA.radius,
        fontFamily: "'Inter', sans-serif",
        fontSize: "15px",
        color: SLA.textMain,
        outline: "none",
        boxShadow: focused ? `0 0 0 4px rgba(255, 90, 0, 0.1)` : "none",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        ...props.style,
      }}
    />
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h2
        className="text-xl font-extrabold mb-1 leading-tight"
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          color: SLA.navy,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-sm mb-4 leading-relaxed"
          style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}
        >
          {subtitle}
        </p>
      )}
    </>
  );
}

// ─── Semicircular Gauge ───────────────────────────────────────────────────────

function RiskGauge({ score, maxScore = 8 }: { score: number; maxScore?: number }) {
  const clampedScore = Math.min(score, maxScore);
  const pct = clampedScore / maxScore;

  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct);

  // Risk colour: low = green, medium = amber, high = SLA orange/red
  const color =
    score === 0
      ? "#16a34a"
      : score <= 2
      ? "#d97706"
      : SLA.orange;

  const label =
    score === 0 ? "Low Risk" : score <= 2 ? "Medium Risk" : "High Risk";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48 h-28">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={SLA.border}
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Arc */}
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="32"
          fontWeight="800"
          fontFamily="'Outfit', sans-serif"
          fill={SLA.navy}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill={SLA.textMuted}
          fontFamily="'Inter', sans-serif"
        >
          out of {maxScore}+
        </text>
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mt-1 px-4 py-1.5 rounded-full text-sm font-bold"
        style={{
          background: color + "22",
          color,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}

// ─── Score Breakdown Bar ──────────────────────────────────────────────────────

function BreakdownBar({
  label,
  score,
  maxScore,
  delay,
}: {
  label: string;
  score: number;
  maxScore: number;
  delay: number;
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium" style={{ color: SLA.textMain, fontFamily: "'Inter', sans-serif" }}>
          {label}
        </span>
        <span className="text-xs font-bold" style={{ color: SLA.orange }}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: SLA.border }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: SLA.orange }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
}

// ─── Nutrient Deficiency Card ─────────────────────────────────────────────────

function NutrientCard({ nutrient }: { nutrient: { name: string; relevance: string; symptoms: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-3.5 rounded-xl border transition-all"
      style={{
        borderColor: expanded ? SLA.orange : SLA.border,
        background: expanded ? SLA.orangeLight : SLA.white,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: SLA.navy, fontFamily: "'Outfit', sans-serif" }}
        >
          {nutrient.name}
        </span>
        <span className="text-xs" style={{ color: SLA.orange, fontWeight: 700 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs mt-2 leading-relaxed" style={{ color: SLA.textMuted }}>
              {nutrient.relevance}
            </p>
            <p className="text-xs mt-1.5" style={{ color: SLA.textMuted }}>
              <span className="font-medium" style={{ color: SLA.textMain }}>Symptoms: </span>
              {nutrient.symptoms}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Results Page ─────────────────────────────────────────────────────────────

function ResultsPage({
  result,
  onRestart,
}: {
  result: CalculatorResult;
  onRestart: () => void;
}) {
  const riskColors = {
    low: { bg: "#f0fdf4", text: "#166534", border: "#16a34a" },
    medium: { bg: "#fffbeb", text: "#92400e", border: "#d97706" },
    high: { bg: SLA.orangeLight, text: "#9a3412", border: SLA.orange },
  };
  const colors = riskColors[result.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Risk Banner — SLA results box style: left border + light bg */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{
          background: colors.bg,
          borderLeft: `6px solid ${colors.border}`,
          border: `1px solid ${colors.border}`,
          borderLeftWidth: "6px",
          textAlign: "center",
          animation: "slideUp 0.4s ease-out",
        }}
      >
        <div className="flex flex-col items-center">
          <RiskGauge score={result.breakdown.totalScore} />
          <h2
            className="text-2xl font-extrabold mt-3 text-center uppercase tracking-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              color: colors.border,
              letterSpacing: "-0.02em",
            }}
          >
            {result.riskLabel}
          </h2>
          <p
            className="text-sm text-center mt-2 leading-relaxed max-w-sm"
            style={{ color: colors.text, fontFamily: "'Inter', sans-serif" }}
          >
            {result.riskDescription}
          </p>
        </div>
      </div>

      {/* BMI Summary */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: SLA.white,
          border: `1px solid ${SLA.border}`,
          boxShadow: SLA.shadow,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-1"
              style={{ color: SLA.orange, fontFamily: "'Outfit', sans-serif" }}
            >
              Your BMI
            </p>
            <p
              className="text-3xl font-extrabold"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: SLA.navy }}
            >
              {result.bmi}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-1"
              style={{ color: SLA.textMuted, fontFamily: "'Outfit', sans-serif" }}
            >
              Category
            </p>
            <p
              className="text-sm font-bold"
              style={{ color: SLA.navy, fontFamily: "'Outfit', sans-serif" }}
            >
              {result.bmiCategory}
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: SLA.white, border: `1px solid ${SLA.border}`, boxShadow: SLA.shadow }}
      >
        <h3
          className="text-sm font-extrabold mb-3 uppercase tracking-wide"
          style={{ fontFamily: "'Outfit', sans-serif", color: SLA.navy }}
        >
          Score Breakdown
        </h3>
        <BreakdownBar label="BMI Score" score={result.breakdown.bmiScore} maxScore={2} delay={0.2} />
        <BreakdownBar label="Weight Loss Score" score={result.breakdown.weightLossScore} maxScore={2} delay={0.35} />
        <BreakdownBar label="Acute Disease Score" score={result.breakdown.acuteDiseaseScore} maxScore={2} delay={0.5} />
        <BreakdownBar label="IBD Symptom Score" score={result.breakdown.ibdSymptomScore} maxScore={4} delay={0.65} />
        <div
          className="mt-3 pt-3 flex justify-between items-center"
          style={{ borderTop: `1px solid ${SLA.border}` }}
        >
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "'Outfit', sans-serif", color: SLA.navy }}
          >
            Total Score
          </span>
          <span
            className="text-2xl font-extrabold"
            style={{ fontFamily: "'Outfit', sans-serif", color: SLA.orange }}
          >
            {result.breakdown.totalScore}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: SLA.white, border: `1px solid ${SLA.border}`, boxShadow: SLA.shadow }}
      >
        <h3
          className="text-sm font-extrabold mb-3 uppercase tracking-wide"
          style={{ fontFamily: "'Outfit', sans-serif", color: SLA.navy }}
        >
          Personalised Recommendations
        </h3>
        <ul className="space-y-2.5">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: SLA.textMain }}>
              <span
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: SLA.orangeLight, color: SLA.orange, fontFamily: "'Outfit', sans-serif" }}
              >
                {i + 1}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif" }}>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps — SLA results box treatment */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: SLA.orangeLight,
          borderLeft: `6px solid ${SLA.orange}`,
          border: `1px solid ${SLA.orange}`,
          borderLeftWidth: "6px",
        }}
      >
        <h3
          className="text-sm font-extrabold mb-3 uppercase tracking-wide"
          style={{ fontFamily: "'Outfit', sans-serif", color: SLA.orange }}
        >
          Suggested Next Steps
        </h3>
        <ul className="space-y-2">
          {result.nextSteps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: SLA.navyMuted }}>
              <span className="font-bold" style={{ color: SLA.orange }}>→</span>
              <span style={{ fontFamily: "'Inter', sans-serif" }}>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Nutrient Deficiencies */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: SLA.white, border: `1px solid ${SLA.border}`, boxShadow: SLA.shadow }}
      >
        <h3
          className="text-sm font-extrabold mb-1 uppercase tracking-wide"
          style={{ fontFamily: "'Outfit', sans-serif", color: SLA.navy }}
        >
          Common Nutrient Deficiencies in IBD
        </h3>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}>
          Regardless of your risk score, people with IBD are at higher risk of the following deficiencies. Ask your doctor about testing. Tap each nutrient to learn more.
        </p>
        <div className="space-y-2">
          {result.nutrientDeficiencies.map((n) => (
            <NutrientCard key={n.name} nutrient={n} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: SLA.bgLight, border: `1px solid ${SLA.border}` }}
      >
        <p className="text-xs leading-relaxed" style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}>
          <span className="font-semibold" style={{ color: SLA.textMain }}>Disclaimer: </span>
          {result.disclaimer}
        </p>
      </div>

      {/* References */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: SLA.white, border: `1px solid ${SLA.border}`, boxShadow: SLA.shadow }}
      >
        <h3
          className="text-xs font-extrabold mb-2 uppercase tracking-widest"
          style={{ color: SLA.textMuted, fontFamily: "'Outfit', sans-serif" }}
        >
          Clinical References
        </h3>
        <ul className="space-y-1.5 text-xs" style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}>
          <li>
            <span className="font-semibold" style={{ color: SLA.textMain }}>MUST:</span> Malnutrition Universal Screening Tool. BAPEN, 2003.
          </li>
          <li>
            <span className="font-semibold" style={{ color: SLA.textMain }}>IBD-NST:</span> Wall CL, Wilson B, Lomer MCE. Development and validation of an IBD nutrition self-screening tool (IBD-NST) for digital use. <em>Front Nutr.</em> 2023;10:1065592.
          </li>
          <li>
            <span className="font-semibold" style={{ color: SLA.textMain }}>GLIM:</span> Cederholm T, et al. GLIM criteria for the diagnosis of malnutrition. <em>Clin Nutr.</em> 2019;38(1):1–9.
          </li>
          <li>
            <span className="font-semibold" style={{ color: SLA.textMain }}>Micronutrients:</span> Weisshof R, Chermesh I. Micronutrient deficiencies in inflammatory bowel disease. <em>Curr Opin Clin Nutr Metab Care.</em> 2015;18(6):576–581.
          </li>
        </ul>
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
        style={{
          background: "transparent",
          border: `2px solid ${SLA.orange}`,
          color: SLA.orange,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = SLA.orangeLight;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        ↺ Start Again
      </button>
    </motion.div>
  );
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

const stepVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // Form state
  const [ibdType, setIbdType] = useState<IBDType | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState<string>("");

  // Height
  const [heightUnit, setHeightUnit] = useState<"cm" | "ftin">("cm");
  const [heightCm, setHeightCm] = useState<string>("");
  const [heightFt, setHeightFt] = useState<string>("");
  const [heightIn, setHeightIn] = useState<string>("");

  // Weight
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs" | "stlbs">("kg");
  const [weightKg, setWeightKg] = useState<string>("");
  const [weightLbs, setWeightLbs] = useState<string>("");
  const [weightSt, setWeightSt] = useState<string>("");
  const [weightStLbs, setWeightStLbs] = useState<string>("");

  // Clinical
  const [weightLoss, setWeightLoss] = useState<WeightLossCategory | null>(null);
  const [reducedFoodIntake, setReducedFoodIntake] = useState<boolean | null>(null);
  const [foodAvoidance, setFoodAvoidance] = useState<boolean | null>(null);
  const [liquidStools, setLiquidStools] = useState<string>("");
  const [abdominalPain, setAbdominalPain] = useState<AbdominalPain | null>(null);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);
  const [noNutritionalIntake, setNoNutritionalIntake] = useState<boolean | null>(null);

  const getHeightCm = useCallback((): number => {
    if (heightUnit === "cm") return parseFloat(heightCm) || 0;
    return ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const getWeightKg = useCallback((): number => {
    if (weightUnit === "kg") return parseFloat(weightKg) || 0;
    if (weightUnit === "lbs") return lbsToKg(parseFloat(weightLbs) || 0);
    return stLbsToKg(parseFloat(weightSt) || 0, parseFloat(weightStLbs) || 0);
  }, [weightUnit, weightKg, weightLbs, weightSt, weightStLbs]);

  const handleCalculate = () => {
    const inputs: CalculatorInputs = {
      age: parseInt(age) || 0,
      gender: gender || "other",
      ibdType: ibdType || "unspecified",
      heightCm: getHeightCm(),
      weightKg: getWeightKg(),
      weightLoss: weightLoss || "unknown",
      reducedFoodIntake: reducedFoodIntake ?? false,
      foodAvoidance: foodAvoidance ?? false,
      liquidStoolsPerDay: parseInt(liquidStools) || 0,
      abdominalPain: abdominalPain || "none",
      wellbeing: wellbeing || "very_well",
      noNutritionalIntake5Days: noNutritionalIntake ?? false,
    };
    setResult(calculateScore(inputs));
  };

  const handleRestart = () => {
    setStep(1);
    setResult(null);
    setIbdType(null);
    setGender(null);
    setAge("");
    setHeightCm("");
    setHeightFt("");
    setHeightIn("");
    setWeightKg("");
    setWeightLbs("");
    setWeightSt("");
    setWeightStLbs("");
    setWeightLoss(null);
    setReducedFoodIntake(null);
    setFoodAvoidance(null);
    setLiquidStools("");
    setAbdominalPain(null);
    setWellbeing(null);
    setNoNutritionalIntake(null);
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const bmiPreview = step >= 5 ? calculateBMI(getWeightKg(), getHeightCm()) : null;

  // Shared input class
  const inputClass = "w-full";

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: SLA.bgLight, fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[640px] mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          {/* SLA badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-widest"
            style={{
              background: SLA.orangeLight,
              color: SLA.orange,
              fontFamily: "'Outfit', sans-serif",
              border: `1px solid rgba(255,90,0,0.2)`,
            }}
          >
            <span>🩺</span> SLA Health · IBD Nutrition Screening
          </div>
          <h1
            className="text-3xl font-extrabold mb-2 uppercase leading-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              color: SLA.navy,
              letterSpacing: "-0.02em",
            }}
          >
            IBD Malnutrition Calculator
          </h1>
          <p
            className="text-sm max-w-md mx-auto leading-relaxed"
            style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}
          >
            A clinically-grounded self-screening tool for people living with Crohn's disease or ulcerative colitis. Based on MUST, IBD-NST, and GLIM criteria.
          </p>
        </div>


        {/* ── Main Card ── */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: SLA.white,
            border: `1px solid ${SLA.border}`,
            borderRadius: SLA.radiusLg,
            boxShadow: SLA.shadow,
          }}
        >
          {result ? (
            <ResultsPage result={result} onRestart={handleRestart} />
          ) : (
            <>
              <ProgressBar step={step} total={TOTAL_STEPS} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >

                  {/* ── Step 1: IBD Type ── */}
                  {step === 1 && (
                    <div>
                      <StepHeading
                        title="What type of IBD do you have?"
                        subtitle="Different types of IBD can affect nutritional risk in different ways."
                      />
                      <div className="space-y-2.5">
                        <OptionCard
                          label="Crohn's Disease"
                          sublabel="Can affect any part of the digestive tract"
                          selected={ibdType === "crohns"}
                          onClick={() => { setIbdType("crohns"); next(); }}
                        />
                        <OptionCard
                          label="Ulcerative Colitis"
                          sublabel="Affects the large intestine (colon)"
                          selected={ibdType === "uc"}
                          onClick={() => { setIbdType("uc"); next(); }}
                        />
                        <OptionCard
                          label="Not sure / Other"
                          sublabel="Including IBD-unclassified (IBDU)"
                          selected={ibdType === "unspecified"}
                          onClick={() => { setIbdType("unspecified"); next(); }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Age & Gender ── */}
                  {step === 2 && (
                    <div>
                      <StepHeading
                        title="Tell us a little about yourself"
                        subtitle="Age and gender help contextualise your nutritional needs."
                      />
                      <div className="mb-4">
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: SLA.navy, fontFamily: "'Outfit', sans-serif" }}
                        >
                          Age (years)
                        </label>
                        <SlaInput
                          type="number"
                          min="16"
                          max="110"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="e.g. 34"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: SLA.navy, fontFamily: "'Outfit', sans-serif" }}
                        >
                          Gender
                        </label>
                        <div className="space-y-2">
                          <OptionCard label="Male" selected={gender === "male"} onClick={() => setGender("male")} />
                          <OptionCard label="Female" selected={gender === "female"} onClick={() => setGender("female")} />
                          <OptionCard label="Other / Prefer not to say" selected={gender === "other"} onClick={() => setGender("other")} />
                        </div>
                      </div>
                      <NavButtons onBack={back} onNext={next} nextDisabled={!age || !gender} />
                    </div>
                  )}

                  {/* ── Step 3: Height ── */}
                  {step === 3 && (
                    <div>
                      <StepHeading
                        title="What is your height?"
                        subtitle="Used to calculate your Body Mass Index (BMI)."
                      />
                      <UnitToggle
                        options={["cm", "ftin"] as const}
                        value={heightUnit}
                        onChange={setHeightUnit}
                        labels={{ cm: "Centimetres (cm)", ftin: "Feet & Inches" }}
                      />
                      {heightUnit === "cm" ? (
                        <SlaInput
                          type="number"
                          min="100"
                          max="250"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          placeholder="e.g. 170"
                        />
                      ) : (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs mb-1" style={{ color: SLA.textMuted }}>Feet</label>
                            <SlaInput
                              type="number"
                              min="3"
                              max="8"
                              value={heightFt}
                              onChange={(e) => setHeightFt(e.target.value)}
                              placeholder="5"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs mb-1" style={{ color: SLA.textMuted }}>Inches</label>
                            <SlaInput
                              type="number"
                              min="0"
                              max="11"
                              value={heightIn}
                              onChange={(e) => setHeightIn(e.target.value)}
                              placeholder="7"
                            />
                          </div>
                        </div>
                      )}
                      <NavButtons
                        onBack={back}
                        onNext={next}
                        nextDisabled={heightUnit === "cm" ? !heightCm : !heightFt}
                      />
                    </div>
                  )}

                  {/* ── Step 4: Weight ── */}
                  {step === 4 && (
                    <div>
                      <StepHeading
                        title="What is your current weight?"
                        subtitle="Use your most recent weight measurement."
                      />
                      <UnitToggle
                        options={["kg", "lbs", "stlbs"] as const}
                        value={weightUnit}
                        onChange={setWeightUnit}
                        labels={{ kg: "kg", lbs: "lbs", stlbs: "st & lbs" }}
                      />
                      {weightUnit === "kg" && (
                        <SlaInput
                          type="number"
                          min="20"
                          max="300"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          placeholder="e.g. 70"
                        />
                      )}
                      {weightUnit === "lbs" && (
                        <SlaInput
                          type="number"
                          min="44"
                          max="660"
                          value={weightLbs}
                          onChange={(e) => setWeightLbs(e.target.value)}
                          placeholder="e.g. 154"
                        />
                      )}
                      {weightUnit === "stlbs" && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs mb-1" style={{ color: SLA.textMuted }}>Stones</label>
                            <SlaInput
                              type="number"
                              min="3"
                              max="47"
                              value={weightSt}
                              onChange={(e) => setWeightSt(e.target.value)}
                              placeholder="11"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs mb-1" style={{ color: SLA.textMuted }}>Pounds</label>
                            <SlaInput
                              type="number"
                              min="0"
                              max="13"
                              value={weightStLbs}
                              onChange={(e) => setWeightStLbs(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                      {bmiPreview !== null && bmiPreview > 0 && (
                        <p className="text-xs mt-2" style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}>
                          Estimated BMI:{" "}
                          <span className="font-bold" style={{ color: SLA.orange }}>
                            {bmiPreview}
                          </span>{" "}
                          ({getBMICategory(bmiPreview)})
                        </p>
                      )}
                      <NavButtons
                        onBack={back}
                        onNext={next}
                        nextDisabled={
                          weightUnit === "kg" ? !weightKg :
                          weightUnit === "lbs" ? !weightLbs :
                          !weightSt
                        }
                      />
                    </div>
                  )}

                  {/* ── Step 5: Weight Loss ── */}
                  {step === 5 && (
                    <div>
                      <StepHeading
                        title="Have you lost weight unintentionally in the past 3–6 months?"
                        subtitle="Unplanned weight loss is one of the most important indicators of malnutrition risk."
                      />
                      <div className="space-y-2.5">
                        <OptionCard
                          label="Less than 5% of my body weight"
                          sublabel="e.g. less than 3.5 kg if you weigh 70 kg"
                          selected={weightLoss === "less5"}
                          onClick={() => { setWeightLoss("less5"); next(); }}
                        />
                        <OptionCard
                          label="5–10% of my body weight"
                          sublabel="e.g. 3.5–7 kg if you weigh 70 kg"
                          selected={weightLoss === "5to10"}
                          onClick={() => { setWeightLoss("5to10"); next(); }}
                        />
                        <OptionCard
                          label="More than 10% of my body weight"
                          sublabel="e.g. more than 7 kg if you weigh 70 kg"
                          selected={weightLoss === "more10"}
                          onClick={() => { setWeightLoss("more10"); next(); }}
                        />
                        <OptionCard
                          label="I haven't lost weight / I'm not sure"
                          selected={weightLoss === "unknown"}
                          onClick={() => { setWeightLoss("unknown"); next(); }}
                        />
                      </div>
                      <NavButtons onBack={back} showBack={true} />
                    </div>
                  )}

                  {/* ── Step 6: Food Intake ── */}
                  {step === 6 && (
                    <div>
                      <StepHeading
                        title="Has your food intake been poor in the past 5 days?"
                        subtitle="This includes eating significantly less than usual, or having very limited variety in your diet."
                      />
                      <YesNoCard value={reducedFoodIntake} onChange={(v) => { setReducedFoodIntake(v); next(); }} />
                      <NavButtons onBack={back} showBack={true} />
                    </div>
                  )}

                  {/* ── Step 7: Food Avoidance ── */}
                  {step === 7 && (
                    <div>
                      <StepHeading
                        title="Do you currently avoid any specific foods or food groups?"
                        subtitle="For example, dairy, gluten, high-fibre foods, or entire food groups due to IBD symptoms or fear of symptoms."
                      />
                      <YesNoCard value={foodAvoidance} onChange={(v) => { setFoodAvoidance(v); next(); }} />
                      <NavButtons onBack={back} showBack={true} />
                    </div>
                  )}

                  {/* ── Step 8: Liquid Stools ── */}
                  {step === 8 && (
                    <div>
                      <StepHeading
                        title="On average, how many liquid or very loose stools do you pass per day?"
                        subtitle="Think about your typical day over the past week. Enter 0 if you have no loose stools."
                      />
                      <SlaInput
                        type="number"
                        min="0"
                        max="30"
                        value={liquidStools}
                        onChange={(e) => setLiquidStools(e.target.value)}
                        placeholder="e.g. 3"
                      />
                      <p className="text-xs mt-1.5" style={{ color: SLA.textMuted }}>
                        Enter a number between 0 and 30
                      </p>
                      <NavButtons
                        onBack={back}
                        onNext={next}
                        nextDisabled={liquidStools === ""}
                      />
                    </div>
                  )}

                  {/* ── Step 9: Abdominal Pain ── */}
                  {step === 9 && (
                    <div>
                      <StepHeading
                        title="How would you describe your abdominal pain over the past week?"
                        subtitle="Pain can reduce appetite and food intake, increasing malnutrition risk."
                      />
                      <div className="space-y-2.5">
                        <OptionCard label="None" sublabel="No abdominal pain" selected={abdominalPain === "none"} onClick={() => { setAbdominalPain("none"); next(); }} />
                        <OptionCard label="Mild" sublabel="Noticeable but not limiting daily activities" selected={abdominalPain === "mild"} onClick={() => { setAbdominalPain("mild"); next(); }} />
                        <OptionCard label="Moderate" sublabel="Affects some daily activities" selected={abdominalPain === "moderate"} onClick={() => { setAbdominalPain("moderate"); next(); }} />
                        <OptionCard label="Severe" sublabel="Significantly limits daily activities" selected={abdominalPain === "severe"} onClick={() => { setAbdominalPain("severe"); next(); }} />
                      </div>
                      <NavButtons onBack={back} showBack={true} />
                    </div>
                  )}

                  {/* ── Step 10: General Wellbeing ── */}
                  {step === 10 && (
                    <div>
                      <StepHeading
                        title="How would you rate your general wellbeing over the past week?"
                        subtitle="Overall wellbeing reflects the combined impact of IBD on your daily life and nutritional status."
                      />
                      <div className="space-y-2.5">
                        <OptionCard label="Very well" selected={wellbeing === "very_well"} onClick={() => { setWellbeing("very_well"); next(); }} />
                        <OptionCard label="Slightly below par" selected={wellbeing === "slightly_below"} onClick={() => { setWellbeing("slightly_below"); next(); }} />
                        <OptionCard label="Poor" selected={wellbeing === "poor"} onClick={() => { setWellbeing("poor"); next(); }} />
                        <OptionCard label="Very poor" selected={wellbeing === "very_poor"} onClick={() => { setWellbeing("very_poor"); next(); }} />
                        <OptionCard label="Terrible" selected={wellbeing === "terrible"} onClick={() => { setWellbeing("terrible"); next(); }} />
                      </div>
                      <NavButtons onBack={back} showBack={true} />
                    </div>
                  )}

                  {/* ── Step 11: Acute Illness ── */}
                  {step === 11 && (
                    <div>
                      <StepHeading
                        title="Are you currently acutely unwell and have had little or no nutritional intake for more than 5 days?"
                        subtitle="This applies if you are in hospital, experiencing a severe flare, or have been unable to eat properly for 5 or more days due to illness."
                      />
                      <YesNoCard
                        value={noNutritionalIntake}
                        onChange={(v) => setNoNutritionalIntake(v)}
                      />
                      <NavButtons
                        onBack={back}
                        onNext={() => { handleCalculate(); }}
                        nextLabel="Calculate My Risk →"
                        nextDisabled={noNutritionalIntake === null}
                      />
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-5 leading-relaxed"
          style={{ color: SLA.textMuted, fontFamily: "'Inter', sans-serif" }}
        >
          This tool is for informational purposes only. Always consult your IBD team or a registered dietitian for personalised advice.
        </p>
      </div>
    </div>
  );
}
