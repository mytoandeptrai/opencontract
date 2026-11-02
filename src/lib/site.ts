// Single source for SEO / social metadata. English is the search target.
export const SITE = {
  name: "OpenContract",
  url: "https://opencontract.lovable.app",
  title: "OpenContract: Interact with Unverified Smart Contracts | ABI Contract UI",
  description:
    "Call smart contract functions without verification. Paste an ABI, enter the address, pick a custom RPC and read or write any EVM contract instantly. A free, open-source Remix alternative. RAM-only, no data stored.",
  keywords: [
    "interact with unverified contract",
    "call smart contract without verification",
    "ABI contract UI",
    "Remix alternative",
    "custom RPC contract reader",
  ],
  image: "/og-image.png",
  imageAlt: "OpenContract: interact with any EVM contract, no verification needed",
  author: { name: "Tran Phuoc My Toan", url: "https://www.linkedin.com/in/tran-phuoc-my-toan-613971199/" },
  email: "mytoandn@gmail.com",
  github: "https://github.com/mytoandeptrai/",
  repo: "https://github.com/mytoandeptrai/opencontract",
  themeColor: "#14181e",
} as const;

export const absoluteUrl = (path: string) => new URL(path, SITE.url).toString();

// head() for the static content pages; English is what search engines index.
export function pageHead(path: string, page: { title: string; description: string }, extraJsonLd?: object) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: extraJsonLd ? [{ type: "application/ld+json", children: JSON.stringify(extraJsonLd) }] : [],
  };
}

export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  image: absoluteUrl(SITE.image),
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript. EIP-1193 wallet optional for write calls.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  keywords: SITE.keywords.join(", "),
  author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url, email: SITE.email, sameAs: [SITE.author.url, SITE.github] },
  sameAs: [SITE.repo],
};
