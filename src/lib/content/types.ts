import type { Language } from "@/lib/i18n";

// Long-form bilingual page copy. Short UI strings still go through t().
export interface PageSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface PageContent {
  title: string;
  description: string;
  heading: string;
  intro: string;
  sections: PageSection[];
  faq?: { q: string; a: string }[];
  author?: { heading: string; role: string; bio: string[] };
}

export type BilingualPage = Record<Language, PageContent>;

export const LAST_UPDATED = "2026-11-02";
