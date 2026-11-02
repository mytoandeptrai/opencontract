import { createFileRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/hooks/use-language";
import { SitePage } from "@/components/oc/SitePage";
import { about } from "@/lib/content/about";
import { SITE, absoluteUrl, pageHead } from "@/lib/site";

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: about.en.title,
      url: absoluteUrl("/about"),
      description: about.en.description,
      author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url, email: SITE.email },
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
