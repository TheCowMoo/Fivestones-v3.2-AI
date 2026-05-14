// ─────────────────────────────────────────────────────────────────────────────
// SafeGuard — Liability Exposure Scan Engine
// Liability-first scoring: start at 100, subtract for missing controls.
// DO NOT revert to readiness scoring.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnswerValue = "yes" | "no" | string;

// ─── Multi-option question support ───────────────────────────────────────────
// Some questions use 4-tier scoring instead of binary yes/no.
// Each option carries a deductionFraction (0 = full score, 1 = full deduction).
export interface QuestionOption {
  value: string;
  label: string;
  /** Fraction of q.weight to deduct. 0 = full credit, 1 = full deduction. */
  deductionFraction: number;
  /** Short label for gap card status when this option is selected */
  gapStatus: "Not in Place" | "Incomplete" | "Partial" | "In Place";
}

export type CategoryKey =
  | "planning_documentation"
  | "training_awareness"
  | "reporting_communication"
  | "response_readiness"
  | "critical_risk_factors";

export type ClassificationLabel =
  | "Severe Exposure"
  | "High Exposure"
  | "Moderate Exposure"
  | "Defensible Position";

export type RiskColor = "red" | "orange" | "yellow" | "green";

export interface Question {
  id: string;
  text: string;
  category: CategoryKey;
  /** Points subtracted from 100 when this control is MISSING (answer = "no") */
  weight: number;
  /** Short liability-framing explanation shown in gap cards */
  liabilityImpact: string;
  /**
   * Severity tier used to enforce ranking priority in the top gaps list.
   * CRITICAL items always rank above HIGH items, which rank above untagged items,
   * regardless of effective deduction weight.
   * - CRITICAL: absence creates maximum liability exposure (e.g., no RAS)
   * - HIGH: absence creates significant but secondary liability exposure (e.g., no anonymous reporting)
   */
  severity?: "CRITICAL" | "HIGH";
  /** If present, renders as multi-option radio group instead of Yes/No */
  options?: QuestionOption[];
  /** Report gap output when control is weak or missing (for multi-option questions) */
  reportGapOutput?: {
    exposureExplanation: string;
    realWorldConsequence: string;
    requiredFix: string;
  };
  /**
   * Regulatory citations shown in the gap card under "Regulatory Basis".
   * Each string is one citation line (no filler language).
   * Only cite standards or legal duties that DIRECTLY apply.
   * DO NOT cite OSHA 1910.165 or 1910.38 as active-threat-specific mandates.
   */
  regulatoryBasis?: string[];
  /**
   * Preparedness / Best-Practice citations shown under "Preparedness Basis".
   * Use for preparedness guidance, consensus standards, or internal frameworks
   * (e.g., CISA, NFPA 3000, internal doctrine).
   * This is SEPARATE from regulatory basis — never mix the two.
   */
  preparednessBasis?: string[];
}

export interface TopGap {
  id: string;
  gap: string;
  status: "Not in Place" | "Incomplete" | "Partial";
  impact: string;
  /** Severity tier carried through from the source question for UI display */
  severity?: "CRITICAL" | "HIGH";
  /** Regulatory citations shown under "Regulatory Basis" in the gap card */
  regulatoryBasis?: string[];
  /** Preparedness / Best-Practice citations shown under "Preparedness Basis" in the gap card */
  preparednessBasis?: string[];
  /** Optional tag for mapping AI-generated gap content to the right scan section */
  sectionTag?:
    | "planning_documentation"
    | "training_awareness"
    | "reporting_communication"
    | "response_readiness"
    | "critical_risk_factors";
}

export interface CategoryScores {
  planningDocumentation: number;
  trainingAwareness: number;
  reportingCommunication: number;
  responseReadiness: number;
}

export interface RiskMap {
  color: RiskColor;
  label: ClassificationLabel;
  descriptor: string;
}

/** Exact CRM payload format */
export interface CrmPayload {
  score: number;
  classification: ClassificationLabel;
  riskLevel: RiskColor;
  topGaps: Array<{
    gap: string;
    status: "Not in Place" | "Incomplete" | "Partial";
    impact: string;
    severity?: "CRITICAL" | "HIGH";
    regulatoryBasis?: string[];
    preparednessBasis?: string[];
    sectionTag?:
      | "planning_documentation"
      | "training_awareness"
      | "reporting_communication"
      | "response_readiness"
      | "critical_risk_factors";
  }>;
  categoryScores: CategoryScores;
  industry: string;
  jurisdiction: string;
  recommendedActions: string[];
}

export interface AssessmentOutput {
  score: number;
  classification: ClassificationLabel;
  riskMap: RiskMap;
  topGaps: TopGap[];
  categoryScores: CategoryScores;
  interpretation: string;
  advisorSummary: string;
  immediateActionPlan: string[];
  ctaBlock: string[];
  crmPayload: CrmPayload;
}

// ─── Questions ───────────────────────────────────────────────────────────────
// 15 questions across 5 categories.
// weight = points subtracted when control is MISSING.

export const QUESTIONS: Question[] = [
  // ─── Planning & Documentation (q1–q3) ────────────────────────────────────
  // Total possible deduction: 10+20+15 = 45
  {
    id: "q1",
    text: "Do you have a documented Workplace Violence Prevention Policy that defines prohibited behaviors, reporting expectations, and response protocols?",
    category: "planning_documentation",
    weight: 10,
    liabilityImpact:
      "Without a documented policy, the organization fails to meet the standard of due diligence to prevent workplace violence — a foundational element in civil liability defense.",
  },
  {
    id: "q2",
    text: "Do you have a documented Emergency Action Plan (EAP) that includes active threat response procedures (e.g., lockdown, lockout, evacuation, communication)?",
    category: "planning_documentation",
    weight: 20,
    liabilityImpact:
      "The absence of a documented EAP with active threat procedures may increase exposure significantly. OSHA 29 CFR 1910.38 requires a written EAP; the inclusion of active threat scenarios is a preparedness best practice. Post-incident reviews may cite this gap as evidence of inadequate preparedness.",
    regulatoryBasis: [
      "OSHA 29 CFR 1910.38: Employers with more than 10 employees must maintain a written Emergency Action Plan covering evacuation, reporting, and employee accountability procedures.",
      "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards likely to cause death or serious physical harm. Workplace violence and active threat scenarios are recognized hazards in many industries.",
    ],
    preparednessBasis: [
      "CISA active threat preparedness principles recommend a documented active threat response plan as a foundational preparedness element.",
      "NFPA 3000 (Standard for an Active Shooter / Hostile Event Response Program) requires a documented hostile event response program including lockdown, lockout, and escape procedures.",
    ],
  },
  {
    id: "q3",
    text: "Has a site-specific risk assessment been conducted and documented?",
    category: "planning_documentation",
    weight: 15,
    liabilityImpact:
      "Without a documented site-specific risk assessment, the organization fails to meet the standard of due diligence — a core requirement in both regulatory defense and insurance claims.",
  },

  // ─── Training & Awareness (q4–q6) ────────────────────────────────────────
  // Total possible deduction: 10+15+8 = 33
  {
    id: "q4",
    text: "Are employees trained to recognize pre-incident threat indicators and escalation behaviors?",
    category: "training_awareness",
    weight: 10,
    liabilityImpact:
      "Failure to train employees to recognize warning signs is frequently cited in post-incident litigation as evidence that harm was foreseeable and preventable.",
  },
  {
    id: "q5",
    text: "Are employees trained in active threat response (e.g., lockdown, lockout, escape, defend)?",
    category: "training_awareness",
    weight: 15,
    liabilityImpact:
      "Untrained employees in active threat scenarios may increase exposure. Post-incident litigation may examine whether the organization provided actionable response training. OSHA does not mandate a specific active shooter training standard, but the General Duty Clause requires employers to address recognized hazards, which includes providing employees with the means to respond.",
    regulatoryBasis: [
      "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards. Failure to provide active threat response training may be cited as evidence of inadequate hazard mitigation.",
    ],
    preparednessBasis: [
      "CISA active threat preparedness principles recommend Run-Hide-Fight or equivalent response training for all employees.",
      "NFPA 3000 requires training aligned with the organization's hostile event response program.",
    ],
  },
  {
    id: "q6",
    text: "Is training conducted at onboarding and refreshed on a defined and consistent schedule?",
    category: "training_awareness",
    weight: 8,
    liabilityImpact:
      "One-time training without a defined refresh schedule is insufficient to demonstrate an ongoing commitment to employee safety and regulatory compliance.",
  },

  // ─── Reporting & Communication (q7–q10) ──────────────────────────────────
  // Total possible deduction: 10+8+12+20 = 50
  {
    id: "q7",
    text: "Is there a clearly defined internal process for employees to report suspicious behavior or security concerns?",
    category: "reporting_communication",
    weight: 10,
    liabilityImpact:
      "Without a defined internal reporting chain, threat indicators have no pathway to supervisors or management. This is a system failure — not a gap. Post-incident reviews consistently find that employees observed warning signs but had no clear process for escalating them through the organization.",
  },
  {
    id: "q8",
    text: "Are incidents and near-misses consistently documented and tracked?",
    category: "reporting_communication",
    weight: 8,
    liabilityImpact:
      "Inconsistent documentation creates an evidentiary gap. In litigation, the inability to show a pattern of documented response suggests systemic negligence.",
  },
  // Reporting & Communication — Anonymous Threat Reporting (position 3)
  {
    id: "q9",
    text: "Does your organization provide a formal and accessible reporting mechanism for employees to report threats or concerning behavior?",
    category: "reporting_communication",
    weight: 12,
    severity: "HIGH",
    liabilityImpact:
      "Without an anonymous reporting mechanism, employees who observe threatening or concerning behavior may be less likely to report it. Fear of retaliation or identification is a recognized driver of non-reporting. This may increase exposure under the OSHA General Duty Clause and, where applicable, California SB 553, and may structurally increase the risk that threat indicators go undetected before an incident occurs.",
    options: [
      {
        value: "anon_full",
        label: "Yes — anonymous and formal system in place (hotline, app, or secure portal)",
        deductionFraction: 0,
        gapStatus: "In Place",
      },
      {
        value: "anon_formal_only",
        label: "Yes — formal reporting exists but not anonymous",
        deductionFraction: 0.4,
        gapStatus: "Partial",
      },
      {
        value: "anon_informal",
        label: "Informal only — manager-based, no formal system",
        deductionFraction: 0.75,
        gapStatus: "Incomplete",
      },
      {
        value: "anon_none",
        label: "No reporting mechanism in place",
        deductionFraction: 1,
        gapStatus: "Not in Place",
      },
    ],
    reportGapOutput: {
      exposureExplanation:
        "Without an anonymous reporting mechanism, employees who observe threatening or concerning behavior may not report it due to fear of retaliation or identification. This creates a systemic failure in early threat identification and escalation — the primary mechanism for preventing incidents before they occur.",
      realWorldConsequence:
        "Post-incident reviews frequently find that warning signs existed but were not reported. In organizations without anonymous reporting channels, fear of retaliation is a recognized driver of non-reporting. The absence of an anonymous mechanism may be cited as evidence of inadequate preparedness and may weaken defensibility where California SB 553 or equivalent state requirements apply.",
      requiredFix:
        "Implement an anonymous reporting mechanism (hotline, app, or secure portal) that allows employees to report threats without identification or fear of retaliation.",
    },
    regulatoryBasis: [
      "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards. The absence of a reporting mechanism may be cited as evidence of inadequate hazard identification infrastructure.",
      "California SB 553 (effective July 1, 2024): Covered employers must establish a Workplace Violence Prevention Plan including a procedure for employees to report workplace violence hazards without fear of retaliation.",
      "State-level equivalents to California SB 553 are emerging in multiple jurisdictions — organizations should verify applicable state requirements.",
    ],
    preparednessBasis: [
      "CISA active threat preparedness principles recommend anonymous reporting channels as a key element of pre-incident threat identification and behavioral threat management.",
      "NFPA 3000 preparedness concepts support early threat identification through accessible, confidential reporting mechanisms.",
    ],
  },
  {
    id: "q10",
    text: "Does your organization have a method to immediately notify employees of an active threat and provide clear instructions (e.g., lockdown, evacuation)?",
    category: "reporting_communication",
    weight: 20,
    severity: "CRITICAL",
    liabilityImpact:
      "OSHA does not maintain a specific active-threat notification standard. However, employers must address recognized hazards under the General Duty Clause. The absence of a real-time notification capability may increase exposure by delaying protective action and may weaken defensibility in post-incident review. If an employee alarm or notification system is used within the emergency action plan, the system should align with OSHA emergency action plan and employee alarm requirements.",
    options: [
      {
        value: "ras_full",
        label: "Yes — real-time system with role-based alerts and acknowledgement tracking",
        deductionFraction: 0,
        gapStatus: "In Place",
      },
      {
        value: "ras_basic",
        label: "Yes — basic mass notification (no role-based routing or tracking)",
        deductionFraction: 0.4,
        gapStatus: "Partial",
      },
      {
        value: "ras_limited",
        label: "Limited — email, PA announcement, or delayed methods only",
        deductionFraction: 0.75,
        gapStatus: "Incomplete",
      },
      {
        value: "ras_none",
        label: "No real-time alert system",
        deductionFraction: 1,
        gapStatus: "Not in Place",
      },
    ],
    reportGapOutput: {
      exposureExplanation:
        "OSHA does not maintain a specific active-threat notification standard. However, the absence of a real-time alert system may increase exposure by delaying employee protective action and may weaken the organization's defensibility under the General Duty Clause, which requires employers to address recognized hazards. If an alarm system is used as part of the emergency action plan, it should align with OSHA 29 CFR 1910.38 and 1910.165 requirements.",
      realWorldConsequence:
        "Delayed or absent notification during an active threat incident may be cited in post-incident litigation as evidence that the organization failed to take reasonable precautions. The absence of coordinated notification capability may undermine coordinated response and may be cited as evidence of inadequate preparedness.",
      requiredFix:
        "Implement a real-time alert system capable of immediate lockdown/lockout activation, role-based instruction delivery, and acknowledgment tracking.",
    },
    regulatoryBasis: [
      "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards likely to cause death or serious physical harm. The absence of an employee notification capability may be cited as failure to address a recognized hazard.",
      "If the organization uses an employee alarm system as part of its emergency action plan, OSHA 29 CFR 1910.38 and 1910.165 govern related EAP and alarm requirements — these are not active-threat-specific mandates.",
    ],
    preparednessBasis: [
      "CISA active threat preparedness principles recommend real-time notification capability as a core element of coordinated active threat response.",
      "NFPA 3000 (Standard for an Active Shooter / Hostile Event Response Program) addresses coordinated notification and lockdown/lockout procedures as preparedness requirements.",
    ],
  },

  // ─── Response Readiness (q11–q13) ────────────────────────────────────────
  // Total possible deduction: 10+5+8 = 23
  {
    id: "q11",
    text: "Are emergency or active threat drills conducted on a regular and defined basis?",
    category: "response_readiness",
    weight: 10,
    liabilityImpact:
      "Organizations that fail to produce documented evidence of regular drills face significant exposure in post-incident reviews. Drills are evidence of operational commitment to safety.",
  },
  {
    id: "q12",
    text: "Are drills documented and reviewed for performance improvement?",
    category: "response_readiness",
    weight: 5,
    liabilityImpact:
      "Undocumented drills provide no defensibility. Documentation of drill outcomes and corrective actions is required to demonstrate a continuous improvement posture.",
  },
  {
    id: "q13",
    text: "Are roles and responsibilities clearly defined during an emergency response?",
    category: "response_readiness",
    weight: 8,
    liabilityImpact:
      "Undefined roles during an emergency create confusion, delayed response, and direct liability. Regulators and courts examine whether the organization had a clear chain of command.",
  },

  // ─── Critical Risk Factors (q14–q16) ─────────────────────────────────────
  // Total possible deduction: 10+6+6 = 22
  {
    id: "q14",
    text: "Are domestic violence or external personal threat risks identified and managed when known?",
    category: "critical_risk_factors",
    weight: 10,
    liabilityImpact:
      "Domestic violence spillover is a leading cause of workplace homicide. Organizations that fail to identify and manage this risk when known face significant civil and regulatory exposure.",
  },
  {
    id: "q15",
    text: "Does your organization have a defined process for identifying and managing individuals of concern (e.g., threat assessment or behavioral intervention process)?",
    category: "critical_risk_factors",
    weight: 6,
    liabilityImpact:
      "Without a defined threat assessment or behavioral intervention process, the organization lacks a structured mechanism to identify and manage individuals who may pose a risk before an incident occurs. Post-incident reviews frequently examine whether warning signs were identified and acted upon.",
  },
  {
    id: "q16",
    text: "Does your organization have measures in place to identify and prevent insider threats or acts of internal violence (e.g., employee risk indicators, reporting pathways, intervention protocols)?",
    category: "critical_risk_factors",
    weight: 6,
    liabilityImpact:
      "Insider threats and acts of internal violence are among the most preventable forms of workplace violence. Organizations without structured risk indicator monitoring, reporting pathways, and intervention protocols may face significant exposure when internal warning signs were present but unaddressed.",
  },

];

// ─── Category weight totals (for percentage scoring) ─────────────────────────
// planning_documentation: q1(10)+q2(20)+q3(15) = 45
// training_awareness: q4(10)+q5(15)+q6(8) = 33
// reporting_communication: q7(10)+q8(8)+q9(12,HIGH)+q10(20,CRITICAL) = 50
// response_readiness: q11(10)+q12(5)+q13(8) = 23
// critical_risk_factors: q14(10)+q15(6)+q16(6) = 22
// TOTAL: 45+33+50+23+22 = 173
const CATEGORY_TOTALS: Record<CategoryKey, number> = {
  planning_documentation: 45,
  training_awareness: 33,
  reporting_communication: 50,
  response_readiness: 23,
  critical_risk_factors: 22,
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  planning_documentation: "Planning & Documentation",
  training_awareness: "Training & Awareness",
  reporting_communication: "Reporting & Communication",
  response_readiness: "Response Readiness",
  critical_risk_factors: "Critical Risk Factors",
};

// ─── Scoring constants ───────────────────────────────────────────────────────

/**
 * Sum of all question weights — the denominator for normalized scoring.
 * q1(10)+q2(20)+q3(15)+q4(10)+q5(15)+q6(8)+q7(10)+q8(8)+q9(12,HIGH)+q10(20,CRITICAL)+
 * q11(10)+q12(5)+q13(8)+q14(10)+q15(6)+q16(6) = 173
 * Computed dynamically so adding/changing questions auto-updates the denominator.
 */
export const MAX_POSSIBLE_DEDUCTION: number = QUESTIONS.reduce(
  (sum, q) => sum + q.weight,
  0
);

// ─── Classification ───────────────────────────────────────────────────────────
// Bands are calibrated to the normalized 0–100 scale.
// 0–29   = Severe Exposure    (≥71 pts of controls missing)
// 30–54  = High Exposure      (46–70 pts missing)
// 55–79  = Moderate Exposure  (23–45 pts missing)
// 80–100 = Defensible Position (≤22 pts missing)

export function classify(score: number): ClassificationLabel {
  if (score <= 29) return "Severe Exposure";
  if (score <= 54) return "High Exposure";
  if (score <= 79) return "Moderate Exposure";
  return "Defensible Position";
}

export function getRiskMap(classification: ClassificationLabel): RiskMap {
  const map: Record<ClassificationLabel, RiskMap> = {
    "Severe Exposure": {
      color: "red",
      label: "Severe Exposure",
      descriptor: "Significant liability exposure across multiple critical areas.",
    },
    "High Exposure": {
      color: "orange",
      label: "High Exposure",
      descriptor: "Elevated exposure with critical gaps requiring immediate attention.",
    },
    "Moderate Exposure": {
      color: "yellow",
      label: "Moderate Exposure",
      descriptor: "Manageable exposure with identifiable improvement areas.",
    },
    "Defensible Position": {
      color: "green",
      label: "Defensible Position",
      descriptor: "Defensible with ongoing maintenance required.",
    },
  };
  return map[classification];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Normalize any answer value to a canonical "yes" or "no" string.
// Handles: "YES", "Yes", true, false, undefined, null, " yes ", etc.
// ---------------------------------------------------------------------------
function normalizeAnswer(raw: unknown): string {
  if (typeof raw === "string") return raw.trim().toLowerCase();
  if (raw === true) return "yes";
  if (raw === false) return "no";
  return String(raw ?? "").trim().toLowerCase();
}

export function isYes(answer: unknown): boolean {
  return normalizeAnswer(answer) === "yes";
}

// ─── Jurisdiction-Aware Regulatory Basis ────────────────────────────────────
// Returns the correct regulatory citations for a given question and jurisdiction.
// The jurisdiction string is the label from stateProvinces.ts (e.g. "CA — California",
// "ON — Ontario"). Country is inferred from the 2-letter code prefix.

const CA_PROVINCE_CODES = new Set(["ON","AB","BC","MB","NB","NL","NS","PE","QC","SK","NT","NU","YT"]);
const US_STATE_CODES = new Set(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]);

function detectJurisdiction(jurisdiction: string): { country: "US" | "CA" | "unknown"; stateCode: string } {
  const code = (jurisdiction || "").trim().split(/[\s—-]/)[0].toUpperCase();
  if (US_STATE_CODES.has(code)) return { country: "US", stateCode: code };
  if (CA_PROVINCE_CODES.has(code)) return { country: "CA", stateCode: code };
  return { country: "unknown", stateCode: code };
}

export function getJurisdictionRegulatoryBasis(
  questionId: string,
  jurisdiction: string
): { regulatoryBasis: string[]; preparednessBasis: string[] } {
  const { country, stateCode } = detectJurisdiction(jurisdiction);

  const PREP_BASIS_Q10 = [
    "CISA active threat preparedness principles recommend real-time notification capability as a core element of coordinated active threat response.",
    "NFPA 3000 (Standard for an Active Shooter / Hostile Event Response Program) addresses coordinated notification and lockdown/lockout procedures as preparedness requirements.",
  ];

  if (questionId === "q10") {
    // Real-Time Alert System
    if (country === "US") {
      return {
        regulatoryBasis: [
          "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards. The absence of an employee notification capability may be cited as failure to address a recognized hazard.",
          "If the organization uses an employee alarm system as part of its emergency action plan, OSHA 29 CFR 1910.38 and 1910.165 govern related EAP and alarm requirements — these are not active-threat-specific mandates.",
        ],
        preparednessBasis: PREP_BASIS_Q10,
      };
    }
    if (country === "CA" && stateCode === "ON") {
      return {
        regulatoryBasis: [
          "Ontario Occupational Health and Safety Act (OHSA), Section 25(2)(h) requires employers to take every precaution reasonable in the circumstances for the protection of workers.",
          "OHSA Sections 32.0.1–32.0.8 require employers to develop a workplace violence policy and program, including measures to summon immediate assistance when workplace violence occurs or is likely to occur.",
        ],
        preparednessBasis: PREP_BASIS_Q10,
      };
    }
    if (country === "CA") {
      return {
        regulatoryBasis: [
          "Provincial Occupational Health and Safety legislation (general duty provision) requires employers to take every reasonable precaution to protect workers from recognized hazards, including workplace violence.",
          "Provincial workplace violence provisions require employers to establish procedures for workers to summon immediate assistance when violence occurs or is likely to occur.",
        ],
        preparednessBasis: PREP_BASIS_Q10,
      };
    }
    // Unknown jurisdiction
    return {
      regulatoryBasis: [
        "Applicable occupational health and safety legislation requires employers to establish emergency communication procedures to notify workers of active threats and coordinate an immediate response.",
      ],
      preparednessBasis: PREP_BASIS_Q10,
    };
  }

  const PREP_BASIS_Q16 = [
    "CISA active threat preparedness principles recommend anonymous reporting channels as a key element of pre-incident threat identification and behavioral threat management.",
    "NFPA 3000 preparedness concepts support early threat identification through accessible, confidential reporting mechanisms.",
  ];

  if (questionId === "q16") {
    // Anonymous Threat Reporting
    if (country === "US") {
      const refs: string[] = [
        "OSHA General Duty Clause (Section 5(a)(1)): Employers must address recognized hazards. The absence of a reporting mechanism may be cited as evidence of inadequate hazard identification infrastructure.",
      ];
      if (stateCode === "CA") {
        refs.push(
          "California SB 553 (effective July 1, 2024): Covered employers must establish a Workplace Violence Prevention Plan including a procedure for employees to report workplace violence hazards without fear of retaliation."
        );
      }
      refs.push(
        "State-level equivalents to California SB 553 are emerging in multiple jurisdictions — organizations should verify applicable state requirements."
      );
      return { regulatoryBasis: refs, preparednessBasis: PREP_BASIS_Q16 };
    }
    if (country === "CA" && stateCode === "ON") {
      return {
        regulatoryBasis: [
          "Ontario OHSA Section 32.0.6 requires employers to include in their workplace violence program a procedure for workers to report incidents of workplace violence to the employer or supervisor.",
          "Ontario OHSA Section 32.0.7 requires employers to investigate and address reports of workplace violence, including anonymous reports where practicable.",
          "Ontario Human Rights Code and OHSA reprisal provisions prohibit retaliation against workers who report workplace violence concerns.",
        ],
        preparednessBasis: PREP_BASIS_Q16,
      };
    }
    if (country === "CA") {
      return {
        regulatoryBasis: [
          "Provincial Occupational Health and Safety legislation requires employers to establish a procedure for workers to report incidents of workplace violence without fear of retaliation.",
          "Provincial workplace violence provisions require employers to investigate and address all reports of workplace violence or threatening behavior.",
        ],
        preparednessBasis: PREP_BASIS_Q16,
      };
    }
    // Unknown jurisdiction
    return {
      regulatoryBasis: [
        "Applicable occupational health and safety legislation requires employers to establish a procedure for workers to report threatening behavior without fear of retaliation.",
      ],
      preparednessBasis: PREP_BASIS_Q16,
    };
  }

  // Default: no jurisdiction-specific basis for other questions
  return { regulatoryBasis: [], preparednessBasis: [] };
}

export function runAssessment(
  answers: Record<string, AnswerValue>,
  industry: string,
  jurisdiction: string
): AssessmentOutput {
  // 1. Normalized score:
  //    For binary (yes/no) questions: deduct q.weight when answer !== "yes".
  //    For multi-option questions: deduct q.weight × option.deductionFraction.
  //    score = round(((maxPossibleDeduction − actualDeduction) / maxPossibleDeduction) × 100)
  //    Floored at 0, capped at 100. No multipliers, no overrides.
  let actualDeduction = 0;

  for (const q of QUESTIONS) {
    if (q.options && q.options.length > 0) {
      // Multi-option question: look up the selected option's deductionFraction
      const selectedValue = answers[q.id];
      const selectedOption = q.options.find((o) => o.value === selectedValue);
      if (selectedOption) {
        actualDeduction += q.weight * selectedOption.deductionFraction;
      } else {
        // No answer or unrecognized value → full deduction
        actualDeduction += q.weight;
      }
    } else {
      // Binary yes/no question
      if (!isYes(answers[q.id])) {
        actualDeduction += q.weight;
      }
    }
  }

  // 2. Normalize and clamp
  let score = Math.round(
    ((MAX_POSSIBLE_DEDUCTION - actualDeduction) / MAX_POSSIBLE_DEDUCTION) * 100
  );
  score = Math.max(0, Math.min(100, score));

  // 3. Classification — tied solely to score ranges, no external override
  const classification = classify(score);
  const riskMap = getRiskMap(classification);

  // 4. Category scores (weighted: present weight / total possible weight x 100)
  const categoryPresent: Record<CategoryKey, number> = {
    planning_documentation: 0,
    training_awareness: 0,
    reporting_communication: 0,
    response_readiness: 0,
    critical_risk_factors: 0,
  };

  for (const q of QUESTIONS) {
    if (q.options && q.options.length > 0) {
      const selectedValue = answers[q.id];
      const selectedOption = q.options.find((o) => o.value === selectedValue);
      if (selectedOption) {
        // Credit = weight × (1 - deductionFraction)
        categoryPresent[q.category] += q.weight * (1 - selectedOption.deductionFraction);
      }
      // No answer → 0 credit (already initialized to 0)
    } else {
      if (isYes(answers[q.id])) {
        categoryPresent[q.category] += q.weight;
      }
    }
  }

  const categoryScores: CategoryScores = {
    planningDocumentation: Math.round(
      (categoryPresent.planning_documentation / CATEGORY_TOTALS.planning_documentation) * 100
    ),
    trainingAwareness: Math.round(
      (categoryPresent.training_awareness / CATEGORY_TOTALS.training_awareness) * 100
    ),
    reportingCommunication: Math.round(
      (categoryPresent.reporting_communication / CATEGORY_TOTALS.reporting_communication) * 100
    ),
    responseReadiness: Math.round(
      (categoryPresent.response_readiness / CATEGORY_TOTALS.response_readiness) * 100
    ),
  };

  // 5. Top gaps (max 5, sorted by effective deduction descending)
  // For multi-option questions, a question is a "gap" if deductionFraction > 0.
  // For binary questions, a question is a "gap" if answer !== "yes".
  const missingQuestions = QUESTIONS.filter((q) => {
    if (q.options && q.options.length > 0) {
      const selectedValue = answers[q.id];
      const selectedOption = q.options.find((o) => o.value === selectedValue);
      // Gap if no answer (full deduction) or partial/incomplete/not-in-place
      return !selectedOption || selectedOption.deductionFraction > 0;
    }
    return !isYes(answers[q.id]);
  });

  // ORDER PRIORITY sort — enforces the mandated severity-tier liability ranking:
  //   CRITICAL tier: Active Threat Plan (q2), EAP (q3), Real-Time Alert System (q10)
  //   HIGH tier:     Reporting mechanisms (q16 anonymous, q8 internal chain, q9 documentation)
  //   MODERATE tier: Training (q5, q6, q7) and all other questions
  // HIGH must always rank above MODERATE regardless of weight.
  // Within the same tier, sort by effective deduction weight (handled by secondary sort).
  // ORDER PRIORITY sort — enforces the mandated severity-tier liability ranking:
  //   CRITICAL tier: EAP w/ active threat (q2), Risk Assessment (q3), Real-Time Alert System (q10)
  //   HIGH tier:     Anonymous Reporting (q9), Internal Reporting Chain (q7), Incident Documentation (q8)
  //   MODERATE tier: Training (q4, q5, q6) and all other questions
  // HIGH must always rank above MODERATE regardless of weight.
  const ORDER_PRIORITY: Record<string, number> = {
    q2: 100, // CRITICAL — EAP with active threat procedures
    q3: 90,  // CRITICAL — Site-specific risk assessment
    q10: 80, // CRITICAL — Real-Time Alert System (never below training or reporting)
    q9: 75,  // HIGH — Anonymous Reporting Mechanism (HIGH must rank above MODERATE training)
    q7: 74,  // HIGH — Internal Reporting Chain
    q8: 73,  // HIGH — Incident Documentation
    q4: 70,  // MODERATE — Training: threat recognition
    q5: 69,  // MODERATE — Training: active threat response
    q6: 68,  // MODERATE — Training: frequency
  };
  missingQuestions.sort((a, b) => {
    const getEffectiveDeduction = (q: typeof a) => {
      if (q.options && q.options.length > 0) {
        const sel = q.options.find((o) => o.value === answers[q.id]);
        return q.weight * (sel ? sel.deductionFraction : 1);
      }
      return q.weight;
    };
    // Primary: ORDER_PRIORITY position (higher number = higher rank)
    const priorityA = ORDER_PRIORITY[a.id] ?? 0;
    const priorityB = ORDER_PRIORITY[b.id] ?? 0;
    if (priorityB !== priorityA) return priorityB - priorityA;
    // Secondary: effective deduction weight (for questions not in ORDER_PRIORITY)
    return getEffectiveDeduction(b) - getEffectiveDeduction(a);
  });

  // GUARANTEE: q9 (Anonymous Reporting, HIGH severity) must always appear in Top 5
  // when the answer is "anon_none" (no reporting mechanism), regardless of how many
  // higher-priority items are missing. If q9 is a gap but was cut off by the slice,
  // replace the 5th item with q9 to ensure legally relevant deficiencies are never omitted.
  const q9Question = QUESTIONS.find((q) => q.id === "q9")!;
  const q9Answer = answers["q9"];
  const q9IsFullGap = q9Answer === "anon_none" || !q9Answer;
  const sliceBase = missingQuestions.slice(0, 5);
  const q9InSlice = sliceBase.some((q) => q.id === "q9");
  const q9IsMissing = missingQuestions.some((q) => q.id === "q9");
  let topGapsSource = sliceBase;
  if (q9IsFullGap && q9IsMissing && !q9InSlice) {
    // q9 is a full gap but was cut off — replace position 5 with q9
    topGapsSource = [...sliceBase.slice(0, 4), q9Question];
  }

  const topGaps: TopGap[] = topGapsSource.map((q) => {
    if (q.options && q.options.length > 0) {
      const selectedValue = answers[q.id];
      const selectedOption = q.options.find((o) => o.value === selectedValue);
      const gapStatus = selectedOption ? selectedOption.gapStatus : "Not in Place";
      // Use reportGapOutput if available and status is not "In Place"
      const impact = q.reportGapOutput
        ? `${q.reportGapOutput.exposureExplanation} ${q.reportGapOutput.realWorldConsequence}`
        : q.liabilityImpact;
      // Override regulatoryBasis with jurisdiction-aware citations when available
      const dynBasis = getJurisdictionRegulatoryBasis(q.id, jurisdiction);
      const finalReg = dynBasis.regulatoryBasis.length > 0 ? dynBasis.regulatoryBasis : q.regulatoryBasis;
      const finalPrep = dynBasis.preparednessBasis.length > 0 ? dynBasis.preparednessBasis : q.preparednessBasis;
      return {
        id: q.id,
        gap: q.text,
        status: (gapStatus === "In Place" ? "Incomplete" : gapStatus) as TopGap["status"],
        impact,
        ...(q.severity ? { severity: q.severity } : {}),
        ...(finalReg && finalReg.length > 0 ? { regulatoryBasis: finalReg } : {}),
        ...(finalPrep && finalPrep.length > 0 ? { preparednessBasis: finalPrep } : {}),
      };
    }
    // Binary question branch
    const dynBasisBin = getJurisdictionRegulatoryBasis(q.id, jurisdiction);
    const finalRegBin = dynBasisBin.regulatoryBasis.length > 0 ? dynBasisBin.regulatoryBasis : q.regulatoryBasis;
    const finalPrepBin = dynBasisBin.preparednessBasis.length > 0 ? dynBasisBin.preparednessBasis : q.preparednessBasis;
    return {
      id: q.id,
      gap: q.text,
      status: "Not in Place" as const,
      impact: q.liabilityImpact,
      ...(q.severity ? { severity: q.severity } : {}),
      ...(finalRegBin && finalRegBin.length > 0 ? { regulatoryBasis: finalRegBin } : {}),
      ...(finalPrepBin && finalPrepBin.length > 0 ? { preparednessBasis: finalPrepBin } : {}),
    };
  });

  // 6. Interpretation (liability-focused)
  const interpretation = buildInterpretation(classification, missingQuestions, industry);

  // 7. Advisor summary
  const advisorSummary = buildAdvisorSummary(classification, missingQuestions, industry, jurisdiction);

  // 8. Immediate Action Plan
  const immediateActionPlan = buildImmediateActionPlan(missingQuestions);

  // 9. CTA block
  const ctaBlock = [
    "Full Liability Assessment — A structured, on-site evaluation of your organization's exposure across all threat categories, documented for legal and regulatory defensibility.",
    "Site-Specific Plan Development — Development of a customized Active Threat Response Plan and Emergency Action Plan aligned to your facility, industry, and jurisdiction.",
    "Training & Drill Implementation — Delivery of evidence-based active threat training and facilitated drills, with documentation suitable for post-incident review.",
  ];

  // 10. CRM payload
  const crmPayload: CrmPayload = {
    score,
    classification,
    riskLevel: riskMap.color,
    topGaps: topGaps.map((g) => ({
      gap: g.gap,
      status: g.status,
      impact: g.impact,
      ...(g.severity ? { severity: g.severity } : {}),
      ...(g.regulatoryBasis ? { regulatoryBasis: g.regulatoryBasis } : {}),
    })),
    categoryScores,
    industry,
    jurisdiction,
    recommendedActions: immediateActionPlan,
  };

  return {
    score,
    classification,
    riskMap,
    topGaps,
    categoryScores,
    interpretation,
    advisorSummary,
    immediateActionPlan,
    ctaBlock,
    crmPayload,
  };
}

// ─── Text builders ────────────────────────────────────────────────────────────

function buildInterpretation(
  classification: ClassificationLabel,
  missing: Question[],
  industry: string
): string {
  const missingCount = missing.length;
  const hasPlanningGap = missing.some((q) => q.category === "planning_documentation");
  const hasTrainingGap = missing.some((q) => q.category === "training_awareness");
  const hasReportingGap = missing.some((q) => q.category === "reporting_communication");

  const industryContext =
    industry && industry !== "Other"
      ? ` In the ${industry} sector, these gaps carry heightened scrutiny from regulators and plaintiff attorneys.`
      : "";

  if (classification === "Severe Exposure") {
    return (
      `This organization presents severe liability exposure across ${missingCount} identified control areas. ` +
      `The absence of foundational systems — including ` +
      `${hasPlanningGap ? "documented prevention and response plans, " : ""}` +
      `${hasTrainingGap ? "structured employee training, " : ""}` +
      `${hasReportingGap ? "formal reporting and escalation processes, " : ""}` +
      `— creates a profile that is difficult to defend in post-incident review, regulatory scrutiny, or civil litigation.` +
      `${industryContext} ` +
      `Without immediate remediation, this organization faces significant exposure to negligence claims, regulatory penalties, and reputational harm.`
    );
  }

  if (classification === "High Exposure") {
    return (
      `This organization carries high liability exposure, with ${missingCount} control gaps that undermine its defensibility posture. ` +
      `${hasPlanningGap ? "Core planning and documentation requirements remain unmet, limiting the ability to demonstrate due diligence. " : ""}` +
      `${hasTrainingGap ? "Training gaps mean employees are not equipped to recognize or respond to active threat scenarios. " : ""}` +
      `${hasReportingGap ? "Without a formal reporting process, threat indicators may go unaddressed until an incident occurs. " : ""}` +
      `${industryContext} ` +
      `Post-incident review would likely identify these gaps as evidence of systemic failure to protect.`
    );
  }

  if (classification === "Moderate Exposure") {
    return (
      `This organization has established some foundational controls but carries moderate liability exposure through ${missingCount} remaining gap${missingCount !== 1 ? "s" : ""}. ` +
      `While a partial framework is in place, incomplete systems create exploitable vulnerabilities in post-incident review and regulatory examination.` +
      `${industryContext} ` +
      `Closing these gaps is essential to achieving a defensible posture and reducing insurance and legal exposure.`
    );
  }

  return (
    `This organization maintains a defensible posture with ${missingCount > 0 ? `${missingCount} remaining gap${missingCount !== 1 ? "s" : ""} that require ongoing attention` : "controls in place across all assessed areas"}. ` +
    `Defensibility is not a static condition — it requires continuous maintenance, documentation, and review to withstand post-incident scrutiny.` +
    `${industryContext}`
  );
}

function buildAdvisorSummary(
  classification: ClassificationLabel,
  missing: Question[],
  industry: string,
  jurisdiction: string
): string {
  const topMissing = missing
    .slice(0, 3)
    .map((q) => q.text.replace(/\?$/, ""))
    .join("; ");
  const locationContext = jurisdiction ? ` operating in ${jurisdiction}` : "";
  const industryContext = industry && industry !== "Other" ? ` in the ${industry} sector` : "";

  if (classification === "Severe Exposure") {
    return (
      `Based on this assessment, your organization${locationContext}${industryContext} has severe liability exposure. ` +
      `The most critical gaps identified are: ${topMissing}. ` +
      `These are not procedural oversights — they represent foundational failures that create direct exposure in the event of an incident. ` +
      `The path forward requires immediate action on documented plans, structured training, and formal reporting systems before any incident occurs.`
    );
  }

  if (classification === "High Exposure") {
    return (
      `Your organization${locationContext}${industryContext} has high liability exposure with identifiable gaps that need to be addressed. ` +
      `Key areas of concern include: ${topMissing}. ` +
      `These gaps leave the organization in a difficult position if an incident occurs and post-incident review begins. ` +
      `Prioritizing the missing foundational controls will meaningfully reduce exposure and strengthen defensibility.`
    );
  }

  if (classification === "Moderate Exposure") {
    return (
      `Your organization${locationContext}${industryContext} has a partial framework in place, but moderate exposure remains through ${missing.length} gap${missing.length !== 1 ? "s" : ""}. ` +
      `${missing.length > 0 ? `Areas still requiring attention: ${topMissing}. ` : ""}` +
      `Closing these gaps will move the organization toward a fully defensible posture and reduce ongoing insurance and regulatory exposure.`
    );
  }

  return (
    `Your organization${locationContext}${industryContext} is in a defensible position based on this assessment. ` +
    `${missing.length > 0 ? `Remaining gaps — ${topMissing} — should be addressed to maintain this posture. ` : ""}` +
    `Defensibility requires continuous documentation, regular training, and periodic review to hold up under scrutiny.`
  );
}

function buildImmediateActionPlan(missing: Question[]): string[] {
  const actions: string[] = [];
  const has = (id: string) => missing.some((q) => q.id === id);

  // q1: WVPP, q2: EAP with active threat
  if (has("q1") || has("q2")) {
    actions.push(
      "Develop and formalize a Workplace Violence Prevention Policy and an Emergency Action Plan that includes active threat response procedures. These are the foundational documents required to establish any defensible posture — their absence is the single largest liability exposure in this assessment."
    );
  }

  // q3: site-specific risk assessment
  if (has("q3")) {
    actions.push(
      "Commission a site-specific risk assessment and document findings. Without this, the organization fails to meet the evidentiary standard for having identified and addressed its specific threat environment."
    );
  }

  // q4/q5/q6: training
  if (has("q4") || has("q5") || has("q6")) {
    actions.push(
      "Implement structured active threat training for all employees, covering threat recognition, escalation behaviors, and response protocols. Training must be documented, delivered at onboarding, and refreshed on a defined schedule to carry weight in post-incident review."
    );
  }

  // q7/q8: reporting chain and incident documentation
  if (has("q7") || has("q8")) {
    actions.push(
      "Establish a formal internal reporting chain and incident tracking process. These systems create the evidentiary record that demonstrates the organization responded to warning signs before an incident escalated."
    );
  }

  // q9: Anonymous Threat Reporting — generate action based on selected tier
  const q9Gap = missing.find((q) => q.id === "q9");
  if (q9Gap) {
    const q9 = QUESTIONS.find((q) => q.id === "q9");
    if (q9?.reportGapOutput) {
      actions.push(
        `Anonymous Threat Reporting: ${q9.reportGapOutput.requiredFix}`
      );
    }
  }

  // q10: RAS — generate action based on selected tier
  const q10Gap = missing.find((q) => q.id === "q10");
  if (q10Gap) {
    const q10 = QUESTIONS.find((q) => q.id === "q10");
    if (q10?.reportGapOutput) {
      actions.push(
        `Real-Time Alert System (RAS): ${q10.reportGapOutput.requiredFix}`
      );
    }
  }

  if (has("q11") || has("q12") || has("q13")) {
    actions.push(
      "Schedule and document active threat drills with defined roles and post-drill review. Drills without documentation provide no defensibility — the review and corrective action record is what matters in a post-incident examination."
    );
  }

  if (has("q14")) {
    actions.push(
      "Implement a domestic violence or external personal threat protocol. This is a leading cause of workplace violence incidents and a frequently overlooked liability gap — organizations that fail to identify and manage this risk when known face significant exposure."
    );
  }

  if (has("q15")) {
    actions.push(
      "Establish a defined threat assessment or behavioral intervention process. Without a structured mechanism to identify and manage individuals of concern, the organization lacks a critical pre-incident intervention capability."
    );
  }

  if (has("q16")) {
    actions.push(
      "Implement measures to identify and prevent insider threats, including employee risk indicator monitoring, accessible reporting pathways, and defined intervention protocols."
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Conduct an annual review of all existing plans, policies, and training records to ensure they remain current and defensible.",
      "Schedule the next round of active threat drills and document outcomes with corrective action notes.",
      "Verify that all new employees have completed onboarding safety training and that records are retained."
    );
  }

  return actions;
}

// ─── Sample responses for testing ────────────────────────────────────────────

/** All controls in place -> Defensible Position */
export const SAMPLE_RESPONSES_DEFENSIBLE: Record<string, AnswerValue> = {
  q1: "yes",  // WVPP
  q2: "yes",  // EAP with active threat
  q3: "yes",  // Site risk assessment
  q4: "yes",  // Threat recognition training
  q5: "yes",  // Active threat response training
  q6: "yes",  // Onboarding + refresh schedule
  q7: "yes",  // Internal reporting chain
  q8: "yes",  // Incident documentation
  q9: "anon_full",  // Anonymous reporting — full mechanism
  q10: "ras_full",  // RAS — full system
  q11: "yes", // Drills conducted
  q12: "yes", // Drills documented
  q13: "yes", // Roles defined
  q14: "yes", // Domestic violence protocol
  q15: "yes", // Threat assessment process
  q16: "yes", // Insider threat measures
};

/** Several gaps -> Moderate Exposure */
export const SAMPLE_RESPONSES_MODERATE: Record<string, AnswerValue> = {
  q1: "yes",  q2: "yes",  q3: "yes",  q4: "yes",
  q5: "yes",  q6: "yes",  q7: "no",
  q8: "yes",  q9: "anon_formal_only",  q10: "ras_basic",
  q11: "no",  q12: "no",  q13: "yes",
  q14: "yes", q15: "no",  q16: "no",
};

/** Critical gaps -> Severe Exposure */
export const SAMPLE_RESPONSES_HIGH_EXPOSURE: Record<string, AnswerValue> = {
  q1: "no",  q2: "no",  q3: "no",  q4: "no",
  q5: "no",  q6: "no",  q7: "no",
  q8: "no",  q9: "anon_none",  q10: "ras_none",
  q11: "no", q12: "no", q13: "no",
  q14: "no", q15: "no", q16: "no",
};
