# Project context

> Shared glossary and map for this repository (OpenContract), so any
> agent (Claude, Cursor, Codex, OpenCode, Grok, Kimi) navigates it with less back-and-forth
> and re-pitches (`/wait-what`) use the same vocabulary in every language.
> Keep it current and terse - definitions, not prose.

## Domain glossary

One row per term. Use the en term as the canonical identifier in code and config;
use the vi column only in prose replies in that language. Terms without a
translation stay in English in every language.

| Term (en) | vi | Meaning |
| --- | --- | --- |
| ABI | ABI | JSON interface the user uploads; drives the generated UI (`src/lib/abi.ts`). |
| workspace | workspace | In-memory set of loaded contracts (`src/hooks/use-workspace.tsx`). |
| custom network | mạng tùy chỉnh | User-defined EVM chain config (`src/lib/chain.ts`, `NetworkDialog`). |
| EIP-1193 | EIP-1193 | Browser wallet provider interface (`window.ethereum`). |
| RAM-only | chỉ lưu trong RAM | No persistence of any kind; reload resets state. |
| translator `t` | hàm dịch `t` | `useLanguage().t`: Vietnamese source string, English via `src/lib/translations.ts`. |
| coding level | coding level | The explanation register 0-5 set by `/coding-level N`; changes detail, never model quality or safety. |

## Key areas

- Entry point(s): `src/routes/index.tsx`, `src/routes/__root.tsx`.
- Core domain logic: `src/lib/` (chain, abi, args, errors, i18n, translations).
- Configuration: `backbone.yml`, `vite.config.ts`, `components.json`.
- Tests: `bun run test` (vitest, `src/test/`).
- Build/deploy: `bun run build`; hosted on Lovable.

## Conventions in use

- Naming: PascalCase files in `src/components/oc`; kebab-case or lowercase elsewhere.
- Architecture / folder layout: routes, lib (pure logic), components/oc (app UI), components/ui (shadcn), hooks (state).
- Shared resources: `public/` only; no registry.
- User-facing copy / localization: `useLanguage().t` with Vietnamese source strings and an English map in `src/lib/translations.ts`.

## External systems & integrations

- EVM RPC endpoints (user-supplied custom networks) and browser wallets via EIP-1193.
- Credentials/secrets location: none stored; `.env*` and secret-like paths are protected in `backbone.yml`.

## Gotchas

- Zero persistence: never add localStorage, sessionStorage, IndexedDB, cookies or a backend.
- `src/routeTree.gen.ts` and `src/components/ui/` are generated; do not hand-edit.
- English-only writing standards (ASD-STE100 word lists) apply only when the reply language is English; Vietnamese replies use the plain-language register plus this glossary instead.

---

Related: `backbone.yml` (project map, commands, protected paths) and
`.vibekit/docs/templates/CONTEXT_TEMPLATE.md` (the blank template end-user projects scaffold from).
`backbone.yml` `project.context` points at this file.
