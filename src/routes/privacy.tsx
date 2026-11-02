import { createFileRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/hooks/use-language";
import { SitePage } from "@/components/oc/SitePage";
import { privacy } from "@/lib/content/privacy";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("/privacy", privacy.en),
  component: () => (
    <LanguageProvider>
      <SitePage content={privacy} />
    </LanguageProvider>
  ),
});
