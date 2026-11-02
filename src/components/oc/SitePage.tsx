import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAST_UPDATED, type BilingualPage } from "@/lib/content/types";
import { SITE } from "@/lib/site";

export function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <Select value={language} onValueChange={(value) => { if (value === "vi" || value === "en") setLanguage(value); }}>
      <SelectTrigger aria-label={t("Ngôn ngữ")} className="h-8 w-[76px] gap-1 px-2 text-xs">
        <Languages className="size-3.5 shrink-0" /><SelectValue />
      </SelectTrigger>
      <SelectContent><SelectItem value="vi">VI</SelectItem><SelectItem value="en">EN</SelectItem></SelectContent>
    </Select>
  );
}

// newTab: links from the app open in a new tab so the RAM-only workspace survives.
export function SiteFooter({ newTab = false }: { newTab?: boolean }) {
  const { t } = useLanguage();
  const target = newTab ? { target: "_blank", rel: "noopener" } : {};
  const links = [
    { href: "/about", label: t("Giới thiệu") },
    { href: "/privacy", label: t("Quyền riêng tư") },
    { href: "/terms", label: t("Điều khoản") },
  ];
  return (
    <footer className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>© 2026 {SITE.name}</span>
        {links.map((l) => (
          <a key={l.href} href={l.href} {...target} className="hover:text-foreground">{l.label}</a>
        ))}
        <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
      </nav>
    </footer>
  );
}

export function SitePage({ content }: { content: BilingualPage }) {
  const { language, t } = useLanguage();
  const c = content[language];
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex min-h-14 items-center gap-2 border-b border-border px-4 py-2">
        <a href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-primary font-mono text-sm font-bold text-primary-foreground">oc</div>
          <span className="font-semibold tracking-tight">{SITE.name}</span>
        </a>
        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSelect />
          <Button asChild size="sm"><a href="/">{t("Mở ứng dụng")}</a></Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{c.heading}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{t("Cập nhật lần cuối: {0}", LAST_UPDATED)}</p>
        <p className="mt-6 text-base leading-relaxed">{c.intro}</p>

        {c.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            {s.paragraphs?.map((p) => <p key={p} className="mt-2 text-sm leading-relaxed text-muted-foreground">{p}</p>)}
            {s.list && (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {s.list.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}

        {c.faq && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("Câu hỏi thường gặp")}</h2>
            <dl className="mt-3 space-y-4">
              {c.faq.map((f) => (
                <div key={f.q}>
                  <dt className="text-sm font-medium">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          {t("Liên hệ")}: <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">{SITE.email}</a>
          {" · "}
          <a href={SITE.author.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>
          {" · "}
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
