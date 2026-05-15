"use client";

import {
  Activity,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Check,
  CircleDollarSign,
  Coins,
  CreditCard,
  Database,
  ExternalLink,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { demoAgent, demoPolicy, demoWallet, initialRequests } from "@/lib/demoData";
import { formatUsd, makeId, makeRoot, shortHash } from "@/lib/id";
import { availableWalletBalance, reserveFunds, settleReservedSpend } from "@/lib/policyEngine";
import { contractExplorerLink, ogGalileo, transactionExplorerLink } from "@/lib/ogNetwork";
import type { CardRequest, ChainProof, RiskReport, SpendMode, WalletState } from "@/lib/types";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type RequestFormState = {
  mode: SpendMode;
  merchant: string;
  category: string;
  amountUsd: number;
  purpose: string;
};

type IntegrationStatus = {
  chain: { mode: string; configured: boolean };
  storage: { mode: string; configured: boolean };
  compute: { mode: string; configured: boolean };
  stripe: { mode: string; configured: boolean; issuingEnabled: boolean };
};

const categoryOptions = ["SaaS", "AI tools", "Marketing", "Hosting", "Travel"];

const defaultForm: RequestFormState = {
  mode: "web3",
  merchant: "AI Landing Reviewer",
  category: "AI tools",
  amountUsd: 9,
  purpose: "Review landing page copy before launch"
};

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>(demoWallet);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [depositUsd, setDepositUsd] = useState(50);
  const [requests, setRequests] = useState<CardRequest[]>(initialRequests);
  const [form, setForm] = useState<RequestFormState>(defaultForm);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("Ready for agent card requests.");
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);

  const latestRequest = requests[0];
  const available = availableWalletBalance(wallet);
  const policyUsage = Math.min(100, ((wallet.spentUsd + wallet.reservedUsd) / demoPolicy.dailyLimitUsd) * 100);

  const proofItems = useMemo(
    () => [
      {
        label: "0G Chain",
        value: "AgiCardsRegistry events",
        icon: Activity,
        detail: "Deposits, policies, approvals, card links, and spend receipts."
      },
      {
        label: "0G Storage",
        value: "Policy + memory roots",
        icon: Database,
        detail: "Agent profile, policy JSON, receipts, and AI memory snapshots."
      },
      {
        label: "0G Compute",
        value: "Risk inference",
        icon: BrainCircuit,
        detail: "Evaluates requests before a card is issued or a Web3 spend is approved."
      },
      {
        label: "Stripe Adapter",
        value: "Test card mode",
        icon: CreditCard,
        detail: "Future real-card rail, isolated from the 0G-native card flow."
      }
    ],
    []
  );

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("No browser wallet found. Install MetaMask or another EVM wallet to connect.");
      return;
    }

    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    const account = accounts[0];

    if (!account) {
      setStatus("Wallet connection was cancelled.");
      return;
    }

    setConnectedWallet(account);
    setStatus(`Wallet connected: ${shortHash(account)}`);
  }

  async function refreshIntegrationStatus() {
    const response = await fetch("/api/integrations/status");
    const payload = (await response.json()) as IntegrationStatus;
    setIntegrationStatus(payload);
    setStatus("Integration status refreshed.");
  }

  async function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const receiptRoot = makeRoot({
      type: "deposit",
      amountUsd: depositUsd,
      owner: connectedWallet ?? demoAgent.owner,
      createdAt: new Date().toISOString()
    });

    setWallet((current) => ({
      ...current,
      depositedUsd: current.depositedUsd + depositUsd,
      depositReceiptRoot: receiptRoot
    }));
    setStatus(`Deposited ${formatUsd(depositUsd)} and created 0G deposit receipt ${shortHash(receiptRoot)}.`);
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatus("0G Compute is evaluating the agent request...");

    const requestRoot = makeRoot({
      agentId: demoAgent.id,
      policyId: demoPolicy.id,
      ...form
    });
    const requestId = makeId("req", requestRoot);
    const evaluationResponse = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const evaluation = (await evaluationResponse.json()) as {
      risk: RiskReport;
      decisionRoot: string;
    };

    const nextRequest: CardRequest = {
      id: requestId,
      agentId: demoAgent.id,
      policyId: demoPolicy.id,
      mode: form.mode,
      merchant: form.merchant,
      category: form.category,
      purpose: form.purpose,
      amountUsd: Number(form.amountUsd),
      status: evaluation.risk.decision === "rejected" ? "rejected" : "pending",
      requestRoot,
      decisionRoot: evaluation.decisionRoot,
      risk: evaluation.risk
    };

    if (evaluation.risk.decision === "rejected") {
      setRequests((current) => [nextRequest, ...current]);
      setStatus(`Request rejected by policy: ${evaluation.risk.reason}`);
      setIsBusy(false);
      return;
    }

    setWallet((current) => reserveFunds(current, Number(form.amountUsd)));
    nextRequest.status = "approved";
    setStatus("Policy approved. Reserving funds and issuing card through selected adapter...");

    const issueResponse = await fetch("/api/cards/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextRequest)
    });
    const issued = (await issueResponse.json()) as {
      metadata: { cardId: string; last4?: string };
      receiptRoot: string;
      chainProofs: ChainProof[];
    };

    nextRequest.status = "completed";
    nextRequest.providerCardId = issued.metadata.cardId;
    nextRequest.last4 = issued.metadata.last4;
    nextRequest.receiptRoot = issued.receiptRoot;
    nextRequest.chainProofs = issued.chainProofs;

    setWallet((current) => settleReservedSpend(current, Number(form.amountUsd)));
    setRequests((current) => [nextRequest, ...current]);
    setStatus(
      `${form.mode === "stripe" ? "Stripe test card" : "0G Web3 card"} completed. Receipt root ${shortHash(
        issued.receiptRoot
      )}.`
    );
    setIsBusy(false);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">A</div>
          <div>
            <strong>AgiCards</strong>
            <span>Agent spend control</span>
          </div>
        </div>
        <nav className="navList" aria-label="Main">
          <a href="#wallet">
            <Wallet size={18} />
            Wallet
          </a>
          <a href="#agent">
            <Bot size={18} />
            Agent
          </a>
          <a href="#request">
            <CreditCard size={18} />
            Request
          </a>
          <a href="#proof">
            <ShieldCheck size={18} />
            0G Proof
          </a>
        </nav>
        <div className="networkBox">
          <span>Network</span>
          <strong>{ogGalileo.name}</strong>
          <small>Chain ID {ogGalileo.id}</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Track 3 / Agentic Economy</p>
            <h1>AgiCards</h1>
          </div>
          <div className="topActions">
            <button className="walletButton" type="button" onClick={connectWallet}>
              <Wallet size={16} />
              {connectedWallet ? shortHash(connectedWallet) : "Connect wallet"}
            </button>
            <a className="externalButton" href={contractExplorerLink()} target="_blank" rel="noreferrer">
              Explorer
              <ExternalLink size={16} />
            </a>
          </div>
        </header>

        <section className="statusBar" aria-live="polite">
          <Activity size={18} />
          <span>{status}</span>
          <button className="statusButton" type="button" onClick={refreshIntegrationStatus}>
            Check integrations
          </button>
        </section>

        {integrationStatus ? (
          <section className="integrationGrid" aria-label="Integration status">
            <IntegrationCard label="0G Chain" mode={integrationStatus.chain.mode} configured={integrationStatus.chain.configured} />
            <IntegrationCard
              label="0G Storage"
              mode={integrationStatus.storage.mode}
              configured={integrationStatus.storage.configured}
            />
            <IntegrationCard
              label="0G Compute"
              mode={integrationStatus.compute.mode}
              configured={integrationStatus.compute.configured}
            />
            <IntegrationCard
              label="Stripe"
              mode={integrationStatus.stripe.mode}
              configured={integrationStatus.stripe.configured}
            />
          </section>
        ) : null}

        <section className="metrics" id="wallet">
          <MetricCard icon={Coins} label="Deposited" value={formatUsd(wallet.depositedUsd)} tone="green" />
          <MetricCard icon={LockKeyhole} label="Reserved" value={formatUsd(wallet.reservedUsd)} tone="amber" />
          <MetricCard icon={ReceiptText} label="Spent Today" value={formatUsd(wallet.spentUsd)} tone="purple" />
          <MetricCard icon={Wallet} label="Available" value={formatUsd(available)} tone="blue" />
        </section>

        <section className="mainGrid">
          <div className="panel agentPanel" id="agent">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Active Agent</p>
                <h2>{demoAgent.name}</h2>
              </div>
              <span className="pill success">Active</span>
            </div>
            <p className="muted">{demoAgent.purpose}</p>
            <div className="policyBox">
              <div>
                <span>Policy</span>
                <strong>{demoPolicy.name}</strong>
              </div>
              <div className="policyTrack">
                <span style={{ width: `${policyUsage}%` }} />
              </div>
              <div className="policyGrid">
                <PolicyStat label="Max/request" value={formatUsd(demoPolicy.maxPerRequestUsd)} />
                <PolicyStat label="Daily limit" value={formatUsd(demoPolicy.dailyLimitUsd)} />
                <PolicyStat label="Auto approve" value={`< ${formatUsd(demoPolicy.autoApproveBelowUsd)}`} />
                <PolicyStat label="Expires" value={`${demoPolicy.expiresInHours}h`} />
              </div>
            </div>
            <div className="rootList">
              <RootItem label="Owner" value={connectedWallet ?? demoAgent.owner} />
              <RootItem label="Agent root" value={demoAgent.storageRoot} />
              <RootItem label="Memory root" value={demoAgent.memoryRoot} />
              <RootItem label="Policy root" value={demoPolicy.storageRoot} />
            </div>
          </div>

          <div className="panel depositPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Fund First</p>
                <h2>User Wallet Deposit</h2>
              </div>
              <CircleDollarSign size={24} />
            </div>
            <form className="depositForm" onSubmit={handleDeposit}>
              <label>
                Deposit amount
                <input
                  type="number"
                  min="1"
                  value={depositUsd}
                  onChange={(event) => setDepositUsd(Number(event.target.value))}
                />
              </label>
              <button type="submit">Deposit demo funds</button>
            </form>
            <p className="muted">
              Every agent request reserves user funds before a Stripe test card or 0G-native Web3 card can be issued.
            </p>
            <RootItem label="Latest deposit root" value={wallet.depositReceiptRoot} />
          </div>

          <div className="panel requestPanel" id="request">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Agent Request</p>
                <h2>Create Spend</h2>
              </div>
              <CreditCard size={24} />
            </div>
            <form className="requestForm" onSubmit={handleRequest}>
              <div className="modeSwitch" role="group" aria-label="Spend mode">
                <button
                  type="button"
                  className={form.mode === "web3" ? "selected" : ""}
                  onClick={() => setForm((current) => ({ ...current, mode: "web3" }))}
                >
                  0G Web3
                </button>
                <button
                  type="button"
                  className={form.mode === "stripe" ? "selected" : ""}
                  onClick={() => setForm((current) => ({ ...current, mode: "stripe" }))}
                >
                  Stripe test
                </button>
              </div>
              <label>
                Merchant
                <input
                  value={form.merchant}
                  onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))}
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {categoryOptions.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={form.amountUsd}
                  onChange={(event) => setForm((current) => ({ ...current, amountUsd: Number(event.target.value) }))}
                />
              </label>
              <label>
                Purpose
                <textarea
                  value={form.purpose}
                  onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
                />
              </label>
              <button disabled={isBusy} type="submit">
                {isBusy ? "Processing..." : "Evaluate and issue"}
              </button>
            </form>
          </div>

          <div className="panel activityPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Latest Activity</p>
                <h2>Requests</h2>
              </div>
              <ReceiptText size={24} />
            </div>
            <div className="requestList">
              {requests.map((request) => (
                <article className="requestItem" key={request.id}>
                  <div className="requestTop">
                    <div>
                      <strong>{request.merchant}</strong>
                      <span>{request.mode === "stripe" ? "Stripe test card" : "0G Web3 card"}</span>
                    </div>
                    <span className={`pill ${request.status === "rejected" ? "danger" : "success"}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="requestMeta">
                    <span>{formatUsd(request.amountUsd)}</span>
                    <span>{request.category}</span>
                    {request.last4 ? <span>ending {request.last4}</span> : null}
                  </div>
                  {request.risk ? <RiskReportView risk={request.risk} /> : null}
                  <div className="rootList compact">
                    <RootItem label="Request root" value={request.requestRoot} />
                    {request.decisionRoot ? <RootItem label="Decision root" value={request.decisionRoot} /> : null}
                    {request.receiptRoot ? <RootItem label="Receipt root" value={request.receiptRoot} /> : null}
                  </div>
                  {request.chainProofs?.length ? (
                    <div className="chainProofs">
                      {request.chainProofs.map((proof) => (
                        <a
                          href={transactionExplorerLink(proof.hash)}
                          key={`${request.id}-${proof.label}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{proof.label}</span>
                          <code>
                            {proof.mode} {shortHash(proof.hash)}
                          </code>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="proofGrid" id="proof">
          {proofItems.map((item) => (
            <article className="proofItem" key={item.label}>
              <item.icon size={22} />
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </section>

        {latestRequest ? (
          <section className="proofStrip">
            <BadgeCheck size={18} />
            <span>
              Latest proof path: wallet deposit {"->"} 0G policy {"->"} 0G Compute decision {"->"} card adapter{" "}
              {"->"} 0G receipt{" "}
              {latestRequest.receiptRoot ? shortHash(latestRequest.receiptRoot) : ""}
            </span>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: "green" | "amber" | "purple" | "blue";
}) {
  return (
    <article className={`metric ${tone}`}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function IntegrationCard({ label, mode, configured }: { label: string; mode: string; configured: boolean }) {
  return (
    <article className="integrationCard">
      <span>{label}</span>
      <strong>{mode}</strong>
      <small>{configured ? "Configured" : "Fallback active"}</small>
    </article>
  );
}

function PolicyStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RootItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rootItem">
      <span>{label}</span>
      <code>{shortHash(value)}</code>
    </div>
  );
}

function RiskReportView({ risk }: { risk: RiskReport }) {
  return (
    <div className="riskBox">
      <div className="riskHeader">
        <span>Risk {risk.riskScore}</span>
        <strong>{risk.reason}</strong>
      </div>
      <div className="checks">
        {risk.checks.map((check) => (
          <div key={check.label} className={check.passed ? "check pass" : "check fail"}>
            {check.passed ? <Check size={14} /> : <X size={14} />}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
