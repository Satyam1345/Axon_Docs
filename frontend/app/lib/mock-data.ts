import { AnalysisData } from "@/app/types";

export const mockAnalysisData: AnalysisData = {
  collectionName: "AI Strategy Documents 2025",
  documents: [
    "AI Strategy Brief 2025.pdf",
    "Security Posture Audit.pdf",
    "Vendor SLA Comparison.pdf",
  ],
  keyInsights: [
    {
      type: "fact",
      content: "Did you know? 63% of surveyed teams report reduced cycle time after adopting AI-assisted review.",
    },
    {
      type: "contradiction",
      content: "Contradiction spotted: Section 2 claims 18-month ROI while Appendix B models 24-30 months.",
    },
    {
      type: "risk",
      content: "Risk note: Data residency assumptions differ between Phase 1 and Phase 2 deployment plans.",
    },
  ],
  highlightedSections: [
    {
      title: "Executive Summary",
      summary: "High-level outcomes, scope and KPIs for the AI rollout.",
      page: 2,
      document: "AI Strategy Brief 2025.pdf",
    },
    {
      title: "Risk Matrix",
      summary: "Prioritized risks with mitigations and ownership.",
      page: 6,
      document: "AI Strategy Brief 2025.pdf",
    },
    {
      title: "Budget Overview",
      summary: "Cost breakdown by phase, including sensitivity analysis.",
      page: 10,
      document: "AI Strategy Brief 2025.pdf",
    },
  ],
  relatedSections: [
    {
      title: "Security Posture Audit.pdf",
      summary: "Key controls overlap with the AI Strategy risk mitigations, particularly in data handling.",
      page: 4,
      document: "Security Posture Audit.pdf",
    },
    {
      title: "Vendor SLA Comparison.pdf",
      summary: "SLA tiers contradict the assumed RTO in Section 4. Consider the premium tie...",
      page: 9,
      document: "Vendor SLA Comparison.pdf",
    },
  ],
};
