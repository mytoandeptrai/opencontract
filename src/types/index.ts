import type { Abi, AbiEvent, AbiFunction, Address, Hash } from "viem";

export type RpcStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; chainId: number; blockNumber: bigint; checkedAt: number }
  | { kind: "mismatch"; expected: number; actual: number }
  | { kind: "error"; message: string; detail?: string };

export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  currencyName: string;
  currencySymbol: string;
  currencyDecimals: number;
  explorerUrl?: string;
  color: string;
}

export type AbiSource = "paste" | "file" | "hardhat" | "foundry";

export type BytecodeStatus =
  | { kind: "unknown" }
  | { kind: "checking" }
  | { kind: "found"; size: number }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export interface ContractEntry {
  id: string;
  name: string;
  networkId: string;
  address: Address;
  abi: Abi;
  abiSource: AbiSource;
  abiWarnings: string[];
}

export interface FunctionItem {
  key: string; // canonical signature
  signature: string;
  fn: AbiFunction;
  overloaded: boolean;
  unsupported?: string;
}

export interface EventItem {
  key: string;
  signature: string;
  event: AbiEvent;
}

export type TxPhase =
  | "idle"
  | "validating"
  | "simulating"
  | "awaiting-wallet"
  | "submitted"
  | "confirming"
  | "success"
  | "reverted"
  | "rejected"
  | "failed";

export interface TxRecord {
  id: string;
  contractId: string;
  contractName: string;
  networkId: string;
  signature: string;
  phase: TxPhase;
  hash?: Hash;
  blockNumber?: bigint;
  gasUsed?: bigint;
  error?: string;
  detail?: string;
  createdAt: number;
}

export interface WalletState {
  available: boolean;
  account?: Address;
  chainId?: number;
  connecting: boolean;
}
