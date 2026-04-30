
import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Settings, 
  Clipboard, 
  Info, 
  ChevronRight, 
  ArrowRight,
  Droplets,
  FlaskConical,
  Target
} from 'lucide-react';
import { ClinicalFocus, PatientData, CalculationResult, Formulation } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientData>({
    weightKg: 75,
    patientAge: 45,
    clinicalFocus: ClinicalFocus.GENERAL_HEALTH,
    formulation: Formulation.TG,
    currentIndex: 4.5,
    targetIndex: 8.0
  });

  const results = useMemo((): CalculationResult => {
    // OmegaQuant Research suggests that for every 1000mg of EPA+DHA, 
    // the Omega-3 Index increases by roughly 1-1.5% points (standardized to a 75kg adult).
    
    let baseMg = 1000;
    let epaRatio = 0.6;
    let dhaRatio = 0.4;
    let rationaleParts: string[] = [];

    // 1. Initial Profile Setup
    switch (patient.clinicalFocus) {
      case ClinicalFocus.CARDIOVASCULAR:
        epaRatio = 0.7;
        rationaleParts.push("Cardiovascular: High-EPA focus for lipid regulation.");
        break;
      case ClinicalFocus.INFLAMMATION:
        epaRatio = 0.75;
        rationaleParts.push("Inflammation: EPA-dominant suppression of AA-pathways.");
        break;
      case ClinicalFocus.COGNITIVE:
        epaRatio = 0.4;
        dhaRatio = 0.6;
        rationaleParts.push("Cognitive: DHA-dominant membrane enrichment.");
        break;
      case ClinicalFocus.PREGNANCY:
        epaRatio = 0.3;
        dhaRatio = 0.7;
        rationaleParts.push("Pregnancy: Maximum DHA for fetal development.");
        break;
      case ClinicalFocus.GASTROINTESTINAL:
        epaRatio = 0.65;
        dhaRatio = 0.35;
        rationaleParts.push("GI Support: Balanced mucosal integrity support.");
        break;
      default:
        rationaleParts.push("General Health: Balanced wellness protocol.");
    }

    // 2. Index Titration Logic (The "Bridge" Calculation)
    // Formula based on Harris et al: (Target - Current) * (Dose Constant)
    const indexDeficit = patient.targetIndex - patient.currentIndex;
    if (indexDeficit > 0) {
      // It typically takes ~500mg daily per 1% deficit to reach target over 13-20 weeks
      const titrationBoost = indexDeficit * 500;
      baseMg += titrationBoost;
      rationaleParts.push(`Titrated +${Math.round(titrationBoost)}mg to bridge ${patient.currentIndex}% to ${patient.targetIndex}% target.`);
    } else {
      rationaleParts.push("Maintenance dose recommended (Index target achieved).");
    }

    // 3. Weight Adjustment (Dose-Response is highly weight dependent)
    const weightFactor = patient.weightKg / 75;
    let weightedMg = baseMg * weightFactor;

    // 4. Formulation Bioavailability Adjustment
    if (patient.formulation === Formulation.EE) {
      weightedMg *= 1.25; // Compensating for lower fasted-state absorption
      rationaleParts.push("Bioavailability: EE adjustment included.");
    } else if (patient.formulation === Formulation.FFA) {
      weightedMg *= 0.85; // Superior absorption
      rationaleParts.push("Bioavailability: FFA efficiency adjustment.");
    }

    // Constraints (Safety ceiling and clinical floor)
    const finalTotal = Math.min(Math.max(1000, weightedMg), 6000);
    
    return {
      totalOmega3: Math.round(finalTotal / 100) * 100,
      epa: Math.round((finalTotal * epaRatio) / 10) * 10,
      dha: Math.round((finalTotal * dhaRatio) / 10) * 10,
      rationale: rationaleParts.join(" ")
    };
  }, [patient]);

  const chartData = [
    { name: 'EPA', value: results.epa, color: '#fd4f00ff' },
    { name: 'DHA', value: results.dha, color: '#64748b' },
  ];

  return (
    <div className="min-h-screen bg-sla-soft font-sans pb-12 text-sla-navy">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-sla-accent">
              <h2 className="flex items-center gap-2 font-bold text-xl mb-6 tracking-tight">
                <Settings className="text-sla-brand" size={20} />
                Patient Parameters
              </h2>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey">Age</label>
                      <span className="font-extrabold">{patient.patientAge}y</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" step="1"
                      value={patient.patientAge}
                      onChange={(e) => setPatient({...patient, patientAge: Number(e.target.value)})}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-sla-brand"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey">Weight</label>
                      <span className="font-extrabold">{patient.weightKg}kg</span>
                    </div>
                    <input 
                      type="range" min="30" max="150" step="1"
                      value={patient.weightKg}
                      onChange={(e) => setPatient({...patient, weightKg: Number(e.target.value)})}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-sla-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey block mb-3">Formulation Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(Formulation).map((f) => (
                      <button
                        key={f}
                        onClick={() => setPatient({...patient, formulation: f})}
                        className={`px-4 py-3 rounded-xl border text-[10px] font-extrabold uppercase tracking-widest text-left transition-all flex items-center justify-between ${
                          patient.formulation === f 
                          ? 'border-sla-brand bg-sla-brand/5 text-sla-brand ring-1 ring-sla-brand' 
                          : 'border-gray-100 hover:border-sla-brand/30 text-sla-grey'
                        }`}
                      >
                        {f}
                        {patient.formulation === f && <div className="w-2 h-2 rounded-full bg-sla-brand" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey block mb-3">Clinical Focus</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(ClinicalFocus).map((focus) => (
                      <button
                        key={focus}
                        onClick={() => setPatient({...patient, clinicalFocus: focus})}
                        className={`text-left px-4 py-3 rounded-xl border transition-all text-sm flex justify-between items-center ${
                          patient.clinicalFocus === focus 
                          ? 'border-sla-brand bg-sla-brand/5 text-sla-brand font-bold ring-1 ring-sla-brand shadow-sm' 
                          : 'border-gray-100 hover:border-sla-brand/30 text-sla-grey font-medium'
                        }`}
                      >
                        {focus}
                        {patient.clinicalFocus === focus && <ChevronRight size={16} className="text-sla-brand" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey block mb-2">Current Index (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={patient.currentIndex}
                      onChange={(e) => setPatient({...patient, currentIndex: Number(e.target.value)})}
                      className="w-full bg-sla-soft border-none rounded-lg p-3 text-sla-navy focus:ring-1 focus:ring-sla-brand text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sla-grey block mb-2">Target Index (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={patient.targetIndex}
                      onChange={(e) => setPatient({...patient, targetIndex: Number(e.target.value)})}
                      className="w-full bg-sla-soft border-none rounded-lg p-3 text-sla-navy focus:ring-1 focus:ring-sla-brand text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sla-navy/5 p-6 rounded-2xl border border-dashed border-sla-navy/20">
              <div className="flex gap-3">
                <Info size={18} className="text-sla-navy shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-sla-navy/70 leading-relaxed">
                  Titration logic calculates the dosage gap required to bridge from current baseline to the target optimal zone (standard 8%).
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-sla-navy p-8 rounded-2xl shadow-xl border border-sla-brand/20 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                <Droplets size={120} className="text-sla-brand" />
              </div>

              <h2 className="font-extrabold text-3xl mb-8 relative z-10 tracking-tight">Patient Strategy</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Daily Total</p>
                  <p className="text-4xl font-extrabold tracking-tighter text-white">{results.totalOmega3}<span className="text-sm ml-1 opacity-50 font-semibold tracking-normal">mg</span></p>
                </div>
                <div className="bg-sla-brand p-5 rounded-xl text-white shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1">EPA Target</p>
                  <p className="text-4xl font-extrabold tracking-tighter text-white">{results.epa}<span className="text-sm ml-1 text-white/50 font-semibold tracking-normal">mg</span></p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">DHA Target</p>
                  <p className="text-4xl font-extrabold tracking-tighter text-white">{results.dha}<span className="text-sm ml-1 opacity-50 font-semibold tracking-normal">mg</span></p>
                </div>
              </div>

              <div className="mb-8 bg-white/5 p-6 rounded-xl border border-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
                  <Activity size={14} className="text-sla-brand" /> Profile Distribution
                </h3>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={60} tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 800, fontFamily: 'Montserrat' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#ffffff05' }} 
                        contentStyle={{ backgroundColor: '#1a2b3c', borderRadius: '12px', border: '1px solid #ffffff10', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', fontFamily: 'Montserrat', fontSize: '12px', fontWeight: '600', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={36}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-2">
                   <Target size={14} className="text-sla-brand" />
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">OmegaQuant Therapeutic Rationale</h3>
                </div>
                <p className="text-white font-semibold text-sm leading-relaxed italic border-l-2 border-sla-brand pl-4 py-1">
                  "{results.rationale}"
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-sla-brand text-white px-6 py-4 rounded-xl font-extrabold text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-brand/20 transition-all"
                >
                  <Clipboard size={18} /> Print Protocol
                </button>
                <button className="flex-1 border-2 border-white/20 text-white px-6 py-4 rounded-xl font-extrabold text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-white hover:text-sla-navy transition-all">
                  Copy Results <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-sla-grey text-[9px] font-bold uppercase tracking-[0.25em]">
        &copy; {new Date().getFullYear()} SLA Health Clinical Systems &bull; Powered by OmegaQuant® Methodology
      </footer>
    </div>
  );
};

export default App;
