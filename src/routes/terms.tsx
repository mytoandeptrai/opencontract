import { createFileRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/hooks/use-language";
import { SitePage } from "@/components/oc/SitePage";
import { terms } from "@/lib/content/terms";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("/terms", terms.en),
  component: () => (
    <LanguageProvider>
      <SitePage content={terms} />
    </LanguageProvider>
  ),
});
