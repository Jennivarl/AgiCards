"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import type { ValidatedIntent } from "@/lib/v2/intent";

const EXAMPLE =
  "Let an agent pay for AI tools and APIs, up to $50/day and $10 per charge, for 7 days.";

export function CreateCardPrompt({
  onIntent
}: {
  onIntent?: (intent: ValidatedIntent | undefined) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState<ValidatedIntent>();
  const [mode, setMode] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function preview() {
    setLoading(true);
    setError(undefined);
    setIntent(undefined);
    onIntent?.(undefined);
    try {
      const res = await fetch("/api/v2/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setIntent(data.intent);
      setMode(data.mode);
      onIntent?.(data.intent);
    } catch {
      setError("Could not reach the intent parser.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium" style={{ color: "rgba(255, 246, 232, 0.7)" }}>
          Describe the card in plain English
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={EXAMPLE}
          rows={3}
          className="w-full mt-2 p-4 rounded-lg text-sm resize-none outline-none"
          style={{
            background: "rgba(11, 7, 5, 0.6)",
            border: "1px solid rgba(255, 129, 32, 0.25)",
            color: "#FFF7E8"
          }}
        />
      </div>

      <motion.button
        onClick={preview}
        disabled={loading || !prompt.trim()}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="flex items-center gap-2 px-7 py-4 rounded-lg font-semibold disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)",
          color: "#050403",
          boxShadow: "0 8px 24px rgba(255, 90, 18, 0.4)"
        }}
      >
        <Sparkles className="w-5 h-5" />
        {loading ? "Reading…" : "Preview Card"}
      </motion.button>

      {intent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl space-y-3"
          style={{ background: "rgba(11, 7, 5, 0.5)", border: "1px solid rgba(67, 212, 131, 0.25)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5" style={{ color: "#43D483" }} />
            <span className="font-semibold" style={{ color: "#FFF7E8" }}>
              {intent.purpose}
            </span>
            {mode === "fallback" && (
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "rgba(255, 179, 49, 0.15)", color: "#FFB331" }}
              >
                offline preview
              </span>
            )}
          </div>
          <Row label="Daily cap" value={`$${intent.dailyCapUsd.toFixed(2)} ${intent.token}`} />
          <Row label="Per-charge cap" value={`$${intent.perCallCapUsd.toFixed(2)} ${intent.token}`} />
          <Row label="Can spend on" value={intent.allowedTargets.join(", ")} />
          <Row label="Expires in" value={`${intent.expiresInDays} days`} />
        </motion.div>
      )}

      {error && (
        <div
          className="flex items-start gap-2 p-4 rounded-lg text-sm"
          style={{ background: "rgba(255, 90, 18, 0.12)", color: "#FFB331" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-sm font-medium" style={{ color: "rgba(255, 246, 232, 0.6)" }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: "#FFB331" }}>
        {value}
      </span>
    </div>
  );
}
