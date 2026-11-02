# AGENTS
- All user data lives only in React state (src/hooks/use-workspace.tsx, use-wallet.tsx); never add localStorage/sessionStorage/IndexedDB/cookies/backend — product requirement is zero persistence.
- Blockchain access uses viem directly + EIP-1193 window.ethereum; no wagmi/ethers.
- Pure logic lives in src/lib (chain, abi, args, errors); UI in src/components/oc.
- Localization uses a React language context with Vietnamese as the initial language; translate at presentation boundaries so workspace and blockchain logic remain language-independent.
