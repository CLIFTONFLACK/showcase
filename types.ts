
export enum ClinicalFocus {
  GENERAL_HEALTH = 'General Wellness',
  CARDIOVASCULAR = 'Cardiovascular Support',
  INFLAMMATION = 'Chronic Inflammation',
  COGNITIVE = 'Cognitive & Neurological',
  PREGNANCY = 'Pregnancy/Lactation',
  GASTROINTESTINAL = 'Gastrointestinal Support'
}

export enum Formulation {
  TG = 'Triglyceride',
  EE = 'Ethyl Esther',
  FFA = 'Free Fatty Acid'
}

export interface PatientData {
  weightKg: number;
  patientAge: number;
  clinicalFocus: ClinicalFocus;
  formulation: Formulation;
  currentIndex: number; // Current baseline (%)
  targetIndex: number;  // Desired outcome (%)
}

export interface CalculationResult {
  totalOmega3: number;
  epa: number;
  dha: number;
  rationale: string;
}
