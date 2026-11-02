import { createFileRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/hooks/use-language";
import { SitePage } from "@/components/oc/SitePage";
import { about } from "@/lib/content/about";
import { absoluteUrl, pageHead, personJsonLd } from "@/lib/site";

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: about.en.title,
      url: absoluteUrl("/about"),
      description: about.en.description,
      author: personJsonLd,
      mainEntity: personJsonLd,
    },
    {
      "@type": "FAQPage",
      mainEntity: (about.en.faq ?? []).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export const Route = createFileRoute("/about")({
  head: () => pageHead("/about", about.en, aboutJsonLd),
  component: () => (
    <LanguageProvider>
      <SitePage content={about} />
    </LanguageProvider>
  ),
});
