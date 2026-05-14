/**
 * HowWeHelp.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared service overview page: "How We Reduce Liability Exposure"
 * Three anchored sections — each deep-linked from the service cards on the
 * Liability Scan results page.
 *
 * Routes:
 *   /how-we-help
 *   /how-we-help#full-liability-assessment
 *   /how-we-help#site-specific-plan-development
 *   /how-we-help#training-drill-implementation
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck,
  ClipboardList,
  FileText,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssessmentCTAButton } from "@/components/assessment";
import { BRAND, HEADING_FONT } from "@/components/assessment/brandUtils";

// ─── Service data ─────────────────────────────────────────────────────────────
// Each service has identical 5-section structure per pasted_content_37:
// description, directlyAddresses, whyRequired, includes, liabilityReduction
const SERVICES = [
  {
    id: "full-liability-assessment",
    icon: ClipboardList,
    color: "#E5484D",
    title: "Full Liability Assessment",
    overview:
      "A structured, on-site evaluation of your organization’s workplace violence exposure across all threat categories — documented for legal and regulatory defensibility.",
    directlyAddresses: [
      "No documented baseline assessment on record",
      "Unscored or unweighted gap analysis",
      "Missing jurisdiction-specific regulatory review",
      "No third-party verification of existing controls",
    ],
    whyRequired:
      "Without a documented assessment, the organization fails to meet the standard of due diligence. In regulatory review and civil litigation, this is interpreted as a failure to identify and act on foreseeable risk — a foundational element of liability.",
    includes: [
      "On-site facility walkthrough using CISA and OSHA-aligned assessment protocols",
      "15-category liability exposure scoring with weighted gap analysis",
      "Documentation of existing controls, policies, and training records",
      "Jurisdiction-specific regulatory compliance review",
      "Written assessment report with prioritized findings and exposure ratings",
    ],
    liabilityReduction:
      "Without a documented, third-party assessment, organizations fail to meet the evidentiary standard required in regulatory reviews, insurance underwriting, and civil litigation. The assessment establishes a baseline and creates a paper trail demonstrating proactive risk management — the foundation of a defensible program.",
  },
  {
    id: "site-specific-plan-development",
    icon: FileText,
    color: BRAND.steel,
    title: "Site-Specific Plan Development",
    overview:
      "Development of a customized Active Threat Response Plan and Emergency Action Plan aligned to your facility layout, workforce profile, industry, and jurisdiction.",
    directlyAddresses: [
      "No documented Active Threat Response Plan (ATRP) on file",
      "Generic or template plans not tailored to the facility",
      "Missing OSHA 29 CFR 1910.38-compliant Emergency Action Plan",
      "No role-specific response protocols for staff and leadership",
    ],
    whyRequired:
      "Generic plans are treated as non-compliant under regulatory scrutiny. Regulators, insurers, and courts require evidence that plans were tailored to the specific facility and workforce. An organization that cannot produce a site-specific plan is evaluated as having failed to address foreseeable risk.",
    includes: [
      "Facility-specific Active Threat Response Plan (ATRP) with evacuation and lockdown procedures",
      "Emergency Action Plan (EAP) compliant with OSHA 29 CFR 1910.38",
      "Role-specific response protocols for leadership, staff, and security personnel",
      "Communication trees and escalation procedures",
      "Documentation package suitable for regulatory submission and post-incident review",
    ],
    liabilityReduction:
      "A documented, facility-specific plan is one of the strongest defenses available in workplace violence litigation. Without it, organizations fails to establish that they anticipated foreseeable risks and established a structured response — the legal standard for reasonable care.",
  },
  {
    id: "training-drill-implementation",
    icon: Users,
    color: BRAND.gold,
    title: "Training & Drill Implementation",
    overview:
      "Delivery of evidence-based active threat training and facilitated drills, with documentation suitable for post-incident review, insurance reporting, and regulatory compliance.",
    directlyAddresses: [
      "Lack of documented training records",
      "No recurring or refresher training program",
      "No structured drill execution or after-action documentation",
      "Staff not trained for real-time response",
    ],
    whyRequired:
      "Undocumented training and drills are treated as if they did not occur. In post-incident investigations, organizations are required to produce verifiable records of training, participation, and reinforcement. Failure to do so results in increased exposure during regulatory enforcement and civil litigation, as the organization fails to establish that staff were prepared to respond.",
    includes: [
      "Active threat awareness training for all staff levels",
      "Leadership-specific decision-making and escalation training",
      "Scenario-based drills and tabletop exercises",
      "Drill documentation (attendance logs, scenarios, after-action reports)",
      "Annual training and refresh schedule",
    ],
    liabilityReduction:
      "Documented training and drills provide verifiable proof that the organization prepared its workforce to respond — not just that policies existed. This is a critical factor in demonstrating duty of care and is heavily scrutinized in both regulatory investigations and legal proceedings. Training without documentation is treated as no training at all.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HowWeHelp() {
  const [, navigate] = useLocation();

  // Scroll to anchor on mount if hash is present
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-14">

      {/* ── Back navigation ─────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Use browser history when available; fall back to Liability Scan
          // (which restores scan context from sessionStorage).
          if (window.history.length > 1) {
            window.history.back();
          } else {
            navigate("/liability-scan");
          }
        }}
        className="text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back
      </Button>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: BRAND.navy }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={HEADING_FONT}>
              How We Reduce Liability Exposure
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Three structured services that move your organization from exposure to defensibility.
            </p>
          </div>
        </div>

        {/* Value proposition banner */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.steel} 100%)` }}
        >
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND.gold }} />
            <div className="space-y-1">
              <p className="font-semibold text-base" style={HEADING_FONT}>
                What a Defensible Program Requires
              </p>
              <p className="text-sm text-blue-100 leading-relaxed">
                Courts, regulators, and insurers look for three things: a documented assessment, a
                site-specific plan, and evidence of ongoing training. Together, these create a
                defensible record that shows your organization identified risk, acted on it, and
                prepared its people to respond.
              </p>
            </div>
          </div>
        </div>

        {/* Quick-jump anchors */}
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Service sections ─────────────────────────────────────────────────── */}
      {SERVICES.map((service, idx) => {
        const Icon = service.icon;
        return (
          <section key={service.id} id={service.id} className="scroll-mt-8 space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: service.color + "18" }}
              >
                <Icon className="w-6 h-6" style={{ color: service.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Service {idx + 1}
                </p>
                <h2 className="text-xl font-bold text-foreground" style={HEADING_FONT}>
                  {service.title}
                </h2>
              </div>
            </div>

            {/* Overview */}
            <p className="text-base text-muted-foreground leading-relaxed">{service.overview}</p>

            {/* Detail cards — 5-section structure per pasted_content_37 */}
            <div className="space-y-4">
              {/* Row 1: Directly Addresses + Why Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm border-l-4" style={{ borderLeftColor: service.color }}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: service.color }} />
                      <p className="text-sm font-semibold text-foreground" style={HEADING_FONT}>
                        Directly Addresses
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {service.directlyAddresses.map((item, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-snug">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                            style={{ color: service.color }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4" style={{ color: service.color }} />
                      <p className="text-sm font-semibold text-foreground" style={HEADING_FONT}>
                        Why This Is Required
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.whyRequired}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Row 2: What It Includes + How It Reduces Liability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" style={{ color: service.color }} />
                      <p className="text-sm font-semibold text-foreground" style={HEADING_FONT}>
                        What It Includes
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {service.includes.map((item, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-snug">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                            style={{ color: service.color }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4" style={{ borderLeftColor: service.color }}>
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4" style={{ color: service.color }} />
                      <p className="text-sm font-semibold text-foreground" style={HEADING_FONT}>
                        How It Reduces Liability Exposure
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.liabilityReduction}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {idx < SERVICES.length - 1 && (
              <div className="border-t border-border pt-2" />
            )}
          </section>
        );
      })}

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-8 text-white text-center space-y-4"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.steel} 100%)` }}
      >
        <p className="text-xl font-bold" style={HEADING_FONT}>
          Review Your Facility’s Risk Gaps with a Specialist
        </p>
        <p className="text-sm text-blue-100 max-w-md mx-auto leading-relaxed">
          This session will walk through your identified gaps and outline the exact steps required
          to establish a defensible safety program.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <AssessmentCTAButton
            variant="primary"
            size="lg"
            iconLeft={<ArrowRight className="w-4 h-4" />}
            onClick={() =>
              window.open(
                "https://calendly.com/dave-962/engagement-call?month=2026-04",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Review Your Facility’s Risk Gaps with a Specialist
          </AssessmentCTAButton>
        </div>
      </div>
    </div>
  );
}
