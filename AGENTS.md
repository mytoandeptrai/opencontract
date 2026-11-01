# AGENTS
- All user data lives only in React state (src/hooks/use-workspace.tsx, use-wallet.tsx); never add localStorage/sessionStorage/IndexedDB/cookies/backend — product requirement is zero persistence.
- Blockchain access uses viem directly + EIP-1193 window.ethereum; no wagmi/ethers.
- Pure logic lives in src/lib (chain, abi, args, errors); UI in src/components/oc.
