# OpenContract - Product Requirements

> Scaffolded by Minimal Vibe Coding Kit during init. Keep it short and current;
> agents read this to understand intent. Fill answers from the init interview.

## 1. Summary

Browser tool for interacting with EVM smart contracts from an uploaded ABI, a contract address and a custom network. Built for the author's own use, validated with teammates, now open source.

## 2. Problem & goal

- Problem it solves: unverified or not-yet-indexed contracts have no usable block explorer UI, leaving CLI or Remix as the only options.
- Primary goal / focus right now: OPEN (not stated)
- Why now / motivation: positive teammate feedback; open-sourcing for everyone.

## 3. Users & use cases

- Primary users: smart contract developers and teammates deploying contracts.
- Top use cases: upload ABI + address + custom network, then read and write functions instantly without explorer verification.

## 4. Success criteria

- OPEN (not stated)

## 5. Scope

- In scope (this iteration): auto-generated read/write interface from ABI; custom networks; wallet via EIP-1193; Vietnamese/English UI.
- Out of scope / non-goals: any persistence or backend.

## 6. Constraints & assumptions

- Zero user data stored; state lives only in the browser session and resets on reload or navigation.
- viem directly, no wagmi or ethers; TypeScript strict.

## 7. Focus area (brownfield)

OPEN (not stated)

## 8. Open questions

- Primary goal now, success criteria and first area to improve.

---

Linked context: see `.vibekit/docs/CONTEXT.md` for domain terminology and `backbone.yml`
for the project map (`project.mode`, `project.prd`, conventions, commands).
