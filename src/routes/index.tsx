import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { WalletProvider } from "@/hooks/use-wallet";
import { LanguageProvider } from "@/hooks/use-language";
import { AppShell } from "@/components/oc/AppShell";
import { SITE, absoluteUrl, jsonLd } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE.title },
      { name: "description", content: SITE.description },
      { name: "keywords", content: SITE.keywords.join(", ") },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: SITE.title },
      { property: "og:description", content: SITE.description },
      { property: "og:url", content: absoluteUrl("/") },
      { name: "twitter:title", content: SITE.title },
      { name: "twitter:description", content: SITE.description },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
  }),
  component: Index,
});

function Index() {
  return (
    <LanguageProvider>
    <WorkspaceProvider>
      <WalletProvider>
        <AppShell />
        <Toaster theme="dark" position="bottom-right" />
      </WalletProvider>
    </WorkspaceProvider>
    </LanguageProvider>
  );
}
