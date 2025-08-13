// app/types/index.ts
export interface KeyInsight {
  type: "fact" | "contradiction" | "risk";
  content: string;
}

export interface HighlightedSection {
  title: string;
  summary: string;
  page: number;
  document: string;
}

export interface RelatedSection {
  title: string;
  summary: string;
  page: number;
  document: string;
}

export interface AnalysisData {
  collectionName: string;
  documents: string[];
  keyInsights: KeyInsight[];
  highlightedSections: HighlightedSection[];
  relatedSections: RelatedSection[];
}
