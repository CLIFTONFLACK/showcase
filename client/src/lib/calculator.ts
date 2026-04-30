/**
 * IBD Malnutrition Calculator — Core Logic
 * Design: "Clinical Warmth"
 *
 * Scoring adapted from:
 * - MUST (Malnutrition Universal Screening Tool) — BAPEN
 * - IBD-NST (IBD Nutrition Self-Screening Tool) — Wall et al., 2023
 * - GLIM criteria — Cederholm et al., 2019
 */

export type IBDType = "crohns" | "uc" | "unspecified";
export type Gender = "male" | "female" | "other";
export type WeightUnit = "kg" | "lbs";
export type HeightUnit = "cm" | "ftin";
export type WeightLossCategory = "less5" | "5to10" | "more10" | "unknown";
export type AbdominalPain = "none" | "mild" | "moderate" | "severe";
export type Wellbeing = "very_well" | "slightly_below" | "poor" | "very_poor" | "terrible";

export interface CalculatorInputs {
  // Section 1: Demographics
  age: number;
  gender: Gender;
  ibdType: IBDType;

  // Section 2: Anthropometrics
  heightCm: number;
  weightKg: number;

  // Section 3: Weight History
  weightLoss: WeightLossCategory;

  // Section 4: Dietary Intake
  reducedFoodIntake: boolean; // reduced intake in past week
  foodAvoidance: boolean; // avoids specific foods/food groups

  // Section 5: Symptoms
  liquidStoolsPerDay: number;
  abdominalPain: AbdominalPain;
  wellbeing: Wellbeing;

  // Section 6: Clinical factors
  noNutritionalIntake5Days: boolean; // acutely ill with no intake >5 days
}

export interface ScoreBreakdown {
  bmiScore: number;
  weightLossScore: number;
  acuteDiseaseScore: number;
  ibdSymptomScore: number;
  totalScore: number;
}

export type RiskLevel = "low" | "medium" | "high";

export interface CalculatorResult {
  bmi: number;
  bmiCategory: string;
  breakdown: ScoreBreakdown;
  riskLevel: RiskLevel;
  riskLabel: string;
  riskDescription: string;
  recommendations: string[];
  nutrientDeficiencies: NutrientInfo[];
  nextSteps: string[];
  disclaimer: string;
}

export interface NutrientInfo {
  name: string;
  relevance: string;
  commonIn: string; // "CD" | "UC" | "Both"
  symptoms: string;
}

// ─── BMI Calculation ────────────────────────────────────────────────────────

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal weight";
  if (bmi < 30.0) return "Overweight";
  return "Obese";
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreBMI(bmi: number): number {
  if (bmi < 18.5) return 2;
  if (bmi <= 20.0) return 1;
  return 0;
}

function scoreWeightLoss(wl: WeightLossCategory): number {
  if (wl === "more10") return 2;
  if (wl === "5to10") return 1;
  if (wl === "unknown") return 1; // conservative: treat unknown as moderate risk
  return 0;
}

function scoreAcuteDisease(noIntake: boolean): number {
  return noIntake ? 2 : 0;
}

function scoreIBDSymptoms(inputs: CalculatorInputs): number {
  let score = 0;
  if (inputs.reducedFoodIntake) score += 1;
  if (inputs.abdominalPain === "moderate" || inputs.abdominalPain === "severe") score += 1;
  if (inputs.wellbeing === "poor" || inputs.wellbeing === "very_poor" || inputs.wellbeing === "terrible") score += 1;
  if (inputs.liquidStoolsPerDay >= 6) score += 1;
  return score;
}

export function calculateScore(inputs: CalculatorInputs): CalculatorResult {
  const bmi = calculateBMI(inputs.weightKg, inputs.heightCm);
  const bmiCategory = getBMICategory(bmi);

  const bmiScore = scoreBMI(bmi);
  const weightLossScore = scoreWeightLoss(inputs.weightLoss);
  const acuteDiseaseScore = scoreAcuteDisease(inputs.noNutritionalIntake5Days);
  const ibdSymptomScore = scoreIBDSymptoms(inputs);
  const totalScore = bmiScore + weightLossScore + acuteDiseaseScore + ibdSymptomScore;

  const breakdown: ScoreBreakdown = {
    bmiScore,
    weightLossScore,
    acuteDiseaseScore,
    ibdSymptomScore,
    totalScore,
  };

  let riskLevel: RiskLevel;
  let riskLabel: string;
  let riskDescription: string;
  let recommendations: string[];
  let nextSteps: string[];

  if (totalScore === 0) {
    riskLevel = "low";
    riskLabel = "Low Risk";
    riskDescription =
      "Your responses suggest you are currently at low risk of malnutrition. This is reassuring, but nutritional status can change with disease activity, so regular monitoring is important.";
    recommendations = [
      "Continue to eat a varied, balanced diet rich in protein, whole grains, fruits, and vegetables where tolerated.",
      "Monitor your weight regularly (at least monthly) and note any unintentional changes.",
      "Stay well hydrated, particularly during periods of increased bowel frequency.",
      "Discuss routine blood tests for common micronutrient deficiencies with your gastroenterologist or IBD nurse.",
      "Re-screen using this tool if your symptoms change or you experience a disease flare.",
    ];
    nextSteps = [
      "Mention your nutritional status at your next IBD clinic appointment.",
      "Ask your care team about routine monitoring of iron, vitamin D, and vitamin B12 levels.",
    ];
  } else if (totalScore <= 2) {
    riskLevel = "medium";
    riskLabel = "Medium Risk";
    riskDescription =
      "Your responses suggest you may be at moderate risk of malnutrition. This is common in people living with IBD, particularly during active disease or periods of dietary restriction. Early action can prevent this from worsening.";
    recommendations = [
      "Aim to increase your calorie and protein intake. High-protein foods include eggs, fish, poultry, legumes, dairy (if tolerated), and nut butters.",
      "If eating full meals is difficult, try smaller, more frequent meals and snacks throughout the day.",
      "Consider fortified foods or oral nutritional supplements (e.g., high-calorie drinks) if your appetite is poor — discuss options with a dietitian.",
      "Keep a brief food diary for 3–5 days to identify gaps in your intake and share it with your healthcare team.",
      "Avoid unnecessarily restricting food groups unless advised by a healthcare professional, as this increases deficiency risk.",
      "Ask your IBD team for a referral to a registered dietitian specialising in IBD.",
    ];
    nextSteps = [
      "Contact your IBD team to discuss your nutritional concerns and request a dietitian referral.",
      "Ask for blood tests to check for iron, vitamin B12, vitamin D, zinc, and folate deficiencies.",
      "Re-screen in 4–6 weeks or sooner if your symptoms worsen.",
    ];
  } else {
    riskLevel = "high";
    riskLabel = "High Risk";
    riskDescription =
      "Your responses suggest you are at high risk of malnutrition. Malnutrition in IBD can worsen disease outcomes, impair healing, reduce the effectiveness of medications, and significantly affect your quality of life. Prompt action is strongly recommended.";
    recommendations = [
      "Contact your IBD team or GP as soon as possible — do not wait until your next scheduled appointment.",
      "Request an urgent referral to a registered dietitian with IBD expertise.",
      "If you are struggling to eat at all, discuss whether oral nutritional supplements or other forms of nutritional support (such as enteral nutrition) may be appropriate.",
      "Avoid fasting or severely restricting your diet without medical supervision.",
      "Ensure your IBD treatment plan is reviewed, as active inflammation significantly increases nutritional requirements.",
      "If you are experiencing severe symptoms (e.g., inability to eat, significant weight loss, extreme fatigue), seek urgent medical attention.",
    ];
    nextSteps = [
      "Contact your IBD nurse, gastroenterologist, or GP urgently to discuss your nutritional status.",
      "Request blood tests for a full nutritional panel including iron studies, B12, folate, vitamin D, zinc, magnesium, and albumin.",
      "Ask about referral to a specialist IBD dietitian for a comprehensive nutritional assessment.",
      "Re-screen after any nutritional intervention to track progress.",
    ];
  }

  const nutrientDeficiencies = getRelevantNutrients(inputs.ibdType);

  return {
    bmi,
    bmiCategory,
    breakdown,
    riskLevel,
    riskLabel,
    riskDescription,
    recommendations,
    nutrientDeficiencies,
    nextSteps,
    disclaimer:
      "This tool is for informational purposes only and does not constitute medical advice. It is based on validated screening tools (MUST, IBD-NST) adapted for self-use. Always consult a qualified healthcare professional for diagnosis and treatment decisions.",
  };
}

// ─── Nutrient Deficiency Data ─────────────────────────────────────────────────

function getRelevantNutrients(ibdType: IBDType): NutrientInfo[] {
  const nutrients: NutrientInfo[] = [
    {
      name: "Iron",
      relevance:
        "The most common deficiency in IBD. Caused by chronic intestinal bleeding, reduced absorption (especially in Crohn's affecting the duodenum), and inflammation.",
      commonIn: "Both",
      symptoms: "Fatigue, weakness, shortness of breath, pale skin, poor concentration.",
    },
    {
      name: "Vitamin D",
      relevance:
        "Frequently low in IBD due to reduced sun exposure, malabsorption, and inflammation. Important for bone health, immune function, and may influence disease activity.",
      commonIn: "Both",
      symptoms: "Bone pain, muscle weakness, fatigue, increased infection risk.",
    },
    {
      name: "Vitamin B12",
      relevance:
        ibdType === "crohns"
          ? "Particularly important in Crohn's disease affecting the terminal ileum, where B12 is absorbed. Surgical removal of the ileum makes supplementation essential."
          : "Can be low in IBD due to reduced intake and inflammation. Less common than in Crohn's disease but worth monitoring.",
      commonIn: ibdType === "crohns" ? "Crohn's Disease" : "Both",
      symptoms: "Fatigue, numbness or tingling in hands/feet, memory problems, anaemia.",
    },
    {
      name: "Zinc",
      relevance:
        "Lost through diarrhoea and reduced absorption. Important for wound healing, immune function, and taste perception. Low zinc can worsen appetite.",
      commonIn: "Both",
      symptoms: "Poor wound healing, loss of taste/smell, hair loss, increased infections.",
    },
    {
      name: "Folate (Vitamin B9)",
      relevance:
        "Reduced by sulfasalazine and methotrexate (common IBD medications) and by poor dietary intake. Essential for cell division and DNA synthesis.",
      commonIn: "Both",
      symptoms: "Fatigue, mouth sores, anaemia, neural tube defects in pregnancy.",
    },
    {
      name: "Calcium",
      relevance:
        "Often low due to dairy avoidance, malabsorption, and long-term corticosteroid use. Critical for bone health — IBD patients have a higher risk of osteoporosis.",
      commonIn: "Both",
      symptoms: "Muscle cramps, bone pain, increased fracture risk.",
    },
    {
      name: "Magnesium",
      relevance:
        "Lost through chronic diarrhoea. Important for muscle and nerve function, energy production, and bone health.",
      commonIn: "Both",
      symptoms: "Muscle cramps, fatigue, anxiety, irregular heartbeat.",
    },
  ];

  return nutrients;
}

// ─── Unit Conversion Helpers ──────────────────────────────────────────────────

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

export function stLbsToKg(stones: number, lbs: number): number {
  return Math.round((stones * 6.35029 + lbs * 0.453592) * 10) / 10;
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
}
