"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode
} from "react";
import type { Address } from "viem";
import { connectMetaMask, type ConnectedWallet } from "@/lib/v2/wallet";
import { toUserSmartAccount } from "@/lib/v2/smartAccount";

type Status = "disconnected" | "connecting" | "connected" | "error";

type WalletState = {
  wallet?: ConnectedWallet;
  address?: Address; // the connected EOA
  smartAddress?: Address; // the EIP-7702 smart account
  status: Status;
  error?: string;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  short: (a?: string) => string;
};

const WalletCtx = createContext<WalletState | null>(null);

export function useWallet(): WalletState {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}

function short(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

// Shared wallet/session state for the whole /studio app. Connects MetaMask on
// Base, wraps the EOA as a 7702 smart account, and exposes the addresses every
// screen needs (replacing the old hardcoded 0x3f9a…c4e1 mock).
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<ConnectedWallet>();
  const [address, setAddress] = useState<Address>();
  const [smartAddress, setSmartAddress] = useState<Address>();
  const [status, setStatus] = useState<Status>("disconnected");
  const [error, setError] = useState<string>();

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(undefined);
    try {
      const w = await connectMetaMask();
      setWallet(w);
      setAddress(w.address);
      const sa = await toUserSmartAccount(w.walletClient, w.address);
      setSmartAddress(sa.address);
      setStatus("connected");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
      setStatus("error");
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(undefined);
    setAddress(undefined);
    setSmartAddress(undefined);
    setError(undefined);
    setStatus("disconnected");
  }, []);

  return (
    <WalletCtx.Provider
      value={{ wallet, address, smartAddress, status, error, connect, disconnect, short }}
    >
      {children}
    </WalletCtx.Provider>
  );
}
