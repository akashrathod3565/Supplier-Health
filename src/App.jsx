/**
 * App.jsx — Supplier Health Frontend
 *
 * Changes from original:
 * 1. MODEL_LABELS updated to OpenAI model names (gpt-4o-mini, gpt-4o)
 * 2. ModelPipelineBadge updated to show OpenAI model info per stage
 * 3. CacheIndicator shows ⚡ CACHED or 🔄 LIVE with timestamp
 * 4. All scoring/verdict logic delegated to backend (no client recalc needed)
 * 5. nocache param forwarded when user clicks "Force Refresh"
 */

import { useState } from "react";
import "./App.css";

// ── Model display config ────────────────────────────────────────────────────
const MODEL_LABELS = {
  "gpt-4o-mini": {
    label: "GPT-4o Mini",
    role: "Speed",
    color: "#10b981",
    description: "Fast extraction & NLP",
  },
  "gpt-4o": {
    label: "GPT-4o",
    role: "Precision",
    color: "#6366f1",
    description: "Analytical scoring & synthesis",
  },
};

// ── API call ────────────────────────────────────────────────────────────────
async function assessSupplier(
  supplierName,
  deepSearch = false,
  uploadedText = null,
  nocache = false
) {
  const r = await fetch("/api/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supplierName, deepSearch, uploadedText, nocache }),
  });
  const text = await r.text();
  if (!text || text.trim() === "")
    throw new Error(
      "Server returned empty response — likely a timeout. Please try again."
    );
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid response from server. Please try again.");
  }
  if (!r.ok) throw new Error(data.error || "Assessment failed");
  return data;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function verdictColor(score) {
  if (score >= 65) return "var(--green)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}
function verdictDim(score) {
  if (score >= 65) return "var(--green-dim)";
  if (score >= 40) return "var(--amber-dim)";
  return "var(--red-dim)";
}
function confidenceColor(c) {
  if (c === "high") return "var(--green)";
  if (c === "medium") return "var(--amber)";
  return "var(--red)";
}

// ── Sub-components ──────────────────────────────────────────────────────────

/** Shows which OpenAI model handled each pipeline stage */
function ModelPipelineBadge({ pipeline, modelLabels }) {
  if (!pipeline) return null;

  const stages = [
    { label: "Data Gathering", key: "dataGathering", icon: "🔍" },
    { label: "Financial Scoring", key: "financialScoring", icon: "💰" },
    { label: "Legal Scoring", key: "legalScoring", icon: "⚖️" },
    { label: "ESG Scoring", key: "esgScoring", icon: "🌱" },
    { label: "Final Synthesis", key: "finalSynthesis", icon: "🧠" },
  ];

  const labels = modelLabels || MODEL_LABELS;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "12px",
        padding: "18px 22px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: "var(--accent)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}
      >
        🤖 Multi-Model Pipeline — OpenAI
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {stages.map((s) => {
          const model = pipeline[s.key];
          const meta = labels[model] || {
            label: model,
            role: "Model",
            color: "var(--accent)",
            description: "",
          };
          return (
            <div
              key={s.key}
              style={{
                background: "var(--bg)",
                border: `1px solid ${meta.color}40`,
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                minWidth: "140px",
              }}
            >
              <div
                style={{ fontSize: "11px", color: "var(--text3)" }}
              >
                {s.icon} {s.label}
              </div>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "12px",
                  color: meta.color,
                  fontWeight: 700,
                }}
              >
                {meta.label}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text3)" }}>
                {meta.description}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: "12px",
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: "var(--text3)",
          borderTop: "1px solid var(--border)",
          paddingTop: "10px",
          lineHeight: "1.6",
        }}
      >
        ⓘ GPT-4o Mini handles fast extraction tasks (cost-efficient).
        GPT-4o handles precision scoring, legal reasoning and final synthesis (temperature=0 for determinism).
      </div>
    </div>
  );
}

/** ⚡ CACHED or 🔄 LIVE indicator */
function CacheIndicator({ cached, generatedAt }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "DM Mono, monospace",
        fontSize: "10px",
        color: cached ? "var(--green)" : "var(--text3)",
        background: cached ? "var(--green-dim)" : "var(--surface)",
        border: `1px solid ${
          cached ? "rgba(34,197,94,0.3)" : "var(--border)"
        }`,
        borderRadius: "20px",
        padding: "4px 10px",
        marginLeft: "10px",
      }}
    >
      {cached ? "⚡ CACHED" : "🔄 LIVE"}
      {generatedAt && (
        <span style={{ color: "var(--text3)", marginLeft: "4px" }}>
          · {new Date(generatedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/** Score card */
function ScoreCard({
  supplierName,
  score,
  verdict,
  verdictReason,
  cached,
  generatedAt,
}) {
  const color = verdictColor(score);
  const dim = verdictDim(score);
  const icon = score >= 65 ? "✅" : score >= 40 ? "⚠️" : "🚫";

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${dim}, rgba(0,0,0,0))`,
        border: `1px solid ${color}40`,
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "10px",
            color,
            letterSpacing: "1.5px",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
          }}
        >
          SUPPLIER RISK SCORE
          <CacheIndicator cached={cached} generatedAt={generatedAt} />
        </div>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "6px",
          }}
        >
          {supplierName}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text2)",
            lineHeight: 1.6,
            maxWidth: "480px",
          }}
        >
          {icon} {verdictReason}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "56px",
            fontWeight: 900,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "11px",
            color,
            letterSpacing: "1px",
          }}
        >
          / 100 · {verdict}
        </div>
      </div>
    </div>
  );
}

/** Factor breakdown with model attribution */
function FactorList({ factors }) {
  if (!factors?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: "var(--accent)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        📊 Factor Breakdown
      </div>
      {factors.map((f) => {
        const color = verdictColor(f.score);
        const confColor = confidenceColor(f.confidence);
        const modelMeta = MODEL_LABELS[f._model] || {
          label: f._model,
          color: "var(--text3)",
        };

        return (
          <div key={f.name} style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "14px" }}>{f.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>
                  {f.name}
                </span>
                {/* Confidence dot */}
                <span
                  title={`${f.confidence} confidence`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontFamily: "DM Mono, monospace",
                    fontSize: "9px",
                    color: confColor,
                    background: `${confColor}15`,
                    border: `1px solid ${confColor}40`,
                    borderRadius: "4px",
                    padding: "1px 6px",
                  }}
                >
                  ● {f.confidence?.toUpperCase()} CONF
                </span>
                {/* Model attribution */}
                {f._model && (
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "9px",
                      color: modelMeta.color,
                      background: `${modelMeta.color}15`,
                      border: `1px solid ${modelMeta.color}30`,
                      borderRadius: "4px",
                      padding: "1px 6px",
                    }}
                  >
                    {modelMeta.label}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "13px",
                  color,
                  fontWeight: 700,
                }}
              >
                {f.score} / 100
              </div>
            </div>

            {/* Score bar */}
            <div
              style={{
                height: "6px",
                background: "var(--border2)",
                borderRadius: "3px",
                overflow: "hidden",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${f.score}%`,
                  background: color,
                  borderRadius: "3px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>

            {/* Rationale */}
            {f.detail && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text2)",
                  lineHeight: 1.5,
                  fontWeight: 300,
                  marginBottom: "4px",
                }}
              >
                {f.detail}
              </div>
            )}

            {/* Penalties */}
            {f.penalties?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                {f.penalties.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "10px",
                      color: "var(--red)",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "4px",
                      padding: "2px 7px",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Bonuses */}
            {f.bonuses?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                {f.bonuses.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "10px",
                      color: "var(--green)",
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "4px",
                      padding: "2px 7px",
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Summary + Procurement Recommendation */
function Summary({ summary, procurementRecommendation }) {
  if (!summary) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: "var(--accent)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        ✦ AI Assessment Summary
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text2)",
          lineHeight: 1.8,
          fontWeight: 300,
          marginBottom: procurementRecommendation ? "16px" : "0",
        }}
      >
        {summary}
      </p>
      {procurementRecommendation && (
        <>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "10px",
              color: "var(--amber)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "8px",
              marginTop: "16px",
            }}
          >
            📋 Procurement Recommendation
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text2)",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            {procurementRecommendation}
          </p>
        </>
      )}
    </div>
  );
}

/** Red flags + trust bonuses */
function SignalCards({ redFlags, trustBonuses }) {
  if (!redFlags?.length && !trustBonuses?.length) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          redFlags?.length && trustBonuses?.length ? "1fr 1fr" : "1fr",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {redFlags?.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "10px",
              color: "var(--red)",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            🚩 RED FLAGS ({redFlags.length})
          </div>
          {redFlags.slice(0, 6).map((f, i) => (
            <div
              key={i}
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginBottom: "6px",
                display: "flex",
                gap: "8px",
                fontWeight: 300,
              }}
            >
              <span style={{ color: "var(--red)", flexShrink: 0 }}>—</span>
              {f}
            </div>
          ))}
        </div>
      )}
      {trustBonuses?.length > 0 && (
        <div
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "10px",
              color: "var(--green)",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            ✦ TRUST BONUSES ({trustBonuses.length})
          </div>
          {trustBonuses.slice(0, 6).map((b, i) => (
            <div
              key={i}
              style={{
                fontSize: "12px",
                color: "var(--text2)",
                marginBottom: "6px",
                display: "flex",
                gap: "8px",
                fontWeight: 300,
              }}
            >
              <span style={{ color: "var(--green)", flexShrink: 0 }}>+</span>
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** News / signals block */
function NewsBlock({ news }) {
  if (!news?.length) return null;
  const sentColor = (s) =>
    s === "positive"
      ? "var(--green)"
      : s === "negative"
      ? "var(--red)"
      : "var(--text3)";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: "var(--accent)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}
      >
        📰 Recent News & Signals
      </div>
      {news.slice(0, 6).map((n, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            paddingBottom: "12px",
            marginBottom: "12px",
            borderBottom:
              i < news.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: sentColor(n.sentiment),
              marginTop: "6px",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            {n.url ? (
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text)",
                  textDecoration: "none",
                  display: "block",
                  marginBottom: "3px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
              >
                {n.headline}
              </a>
            ) : (
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "3px",
                }}
              >
                {n.headline}
              </div>
            )}
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "10px",
                color: "var(--text3)",
              }}
            >
              {n.source}
              {!n.url && (
                <span
                  style={{
                    marginLeft: "8px",
                    color: "var(--amber)",
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                  }}
                >
                  ⚡ training data
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reliability banner */
function ReliabilityBanner({ tier, alert }) {
  if (!tier) return null;
  const cfg = {
    verified: {
      color: "var(--green)",
      bg: "rgba(34,197,94,0.06)",
      border: "rgba(34,197,94,0.25)",
      icon: "✅",
      label: "VERIFIED",
    },
    partial: {
      color: "var(--amber)",
      bg: "rgba(245,158,11,0.06)",
      border: "rgba(245,158,11,0.25)",
      icon: "🔶",
      label: "PARTIAL DATA",
    },
    limited: {
      color: "#f97316",
      bg: "rgba(249,115,22,0.06)",
      border: "rgba(249,115,22,0.3)",
      icon: "⚠️",
      label: "LIMITED DATA",
    },
    unverifiable: {
      color: "var(--red)",
      bg: "rgba(239,68,68,0.06)",
      border: "rgba(239,68,68,0.3)",
      icon: "🚨",
      label: "UNVERIFIABLE",
    },
  }[tier] || {
    color: "var(--text3)",
    bg: "var(--surface)",
    border: "var(--border)",
    icon: "?",
    label: tier.toUpperCase(),
  };

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "14px", flexShrink: 0 }}>{cfg.icon}</span>
      <div>
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "10px",
            color: cfg.color,
            fontWeight: 700,
            letterSpacing: "1px",
            marginRight: "8px",
          }}
        >
          {cfg.label}
        </span>
        {alert && (
          <span
            style={{ fontSize: "12px", color: "var(--text2)", fontWeight: 300 }}
          >
            {alert}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Loading screen ──────────────────────────────────────────────────────────
const STEPS = [
  "🔍 Gathering web intelligence (GPT-4o Mini)…",
  "💰 Scoring financials & credit risk (GPT-4o)…",
  "⚖️ Assessing legal & compliance (GPT-4o)…",
  "🌱 Evaluating ESG & reputation (GPT-4o Mini)…",
  "🧠 Synthesising final verdict (GPT-4o)…",
];

function LoadingScreen({ step }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "16px",
        padding: "40px",
        textAlign: "center",
        marginBottom: "24px",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "2px solid var(--border2)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 20px",
        }}
      />
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Multi-Model Pipeline Running
      </div>
      <div
        style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}
      >
        {STEPS[Math.min(step - 1, STEPS.length - 1)]}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: i < step ? "var(--accent)" : "var(--border2)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
function Header() {
  return (
    <div
      style={{
        marginBottom: "32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
          }}
        >
          Supplier<span style={{ color: "var(--accent)" }}>IQ</span>
        </div>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "11px",
            color: "var(--text3)",
            border: "1px solid var(--border)",
            padding: "4px 10px",
            borderRadius: "20px",
            letterSpacing: "0.5px",
            display: "inline-block",
            marginTop: "6px",
          }}
        >
          PROCUREMENT INTELLIGENCE · MULTI-MODEL AI
        </div>
      </div>
    </div>
  );
}

// ── Search bar ──────────────────────────────────────────────────────────────
function SearchBar({
  value,
  onChange,
  onSearch,
  loading,
  compareMode,
  onToggleCompare,
  value2,
  onChange2,
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
        <input
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
          }}
          placeholder="Enter supplier name…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        {compareMode && (
          <input
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "14px",
              color: "var(--text)",
              fontFamily: "inherit",
              outline: "none",
            }}
            placeholder="Enter second supplier…"
            value={value2}
            onChange={(e) => onChange2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        )}
        <button
          onClick={onSearch}
          disabled={loading}
          style={{
            background: loading ? "var(--border2)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontSize: "14px",
            fontFamily: "DM Mono, monospace",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.5px",
          }}
        >
          {loading ? "…" : "ASSESS →"}
        </button>
      </div>
      <button
        onClick={onToggleCompare}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "6px 14px",
          fontSize: "11px",
          fontFamily: "DM Mono, monospace",
          color: compareMode ? "var(--accent)" : "var(--text3)",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        {compareMode ? "✓ COMPARE MODE" : "+ COMPARE TWO SUPPLIERS"}
      </button>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(false);
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [step, setStep] = useState(1);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (forceRefresh = false) => {
    if (!name1.trim() || (compareMode && !name2.trim())) return;
    setResult1(null);
    setResult2(null);
    setError("");
    setLoading(true);
    setStep(1);

    const ticker = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length)),
      7000
    );

    try {
      if (compareMode) {
        const [r1, r2] = await Promise.all([
          assessSupplier(name1, false, null, forceRefresh),
          assessSupplier(name2, false, null, forceRefresh),
        ]);
        setResult1(r1);
        setResult2(r2);
      } else {
        const r = await assessSupplier(name1, false, null, forceRefresh);
        setResult1(r);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult1(null);
    setResult2(null);
    setName1("");
    setName2("");
    setError("");
  };

  return (
    <div className="shell">
      <Header />
      <SearchBar
        value={name1}
        onChange={setName1}
        value2={name2}
        onChange2={setName2}
        onSearch={() => handleSearch(false)}
        loading={loading}
        compareMode={compareMode}
        onToggleCompare={() => {
          setCompareMode((c) => !c);
          setResult1(null);
          setResult2(null);
          setName2("");
          setError("");
        }}
      />

      {loading && <LoadingScreen step={step} />}

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            fontSize: "13px",
            color: "var(--red)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Single result */}
      {!compareMode && result1 && (
        <>
          <ScoreCard
            supplierName={result1.supplierName}
            score={result1.overallScore}
            verdict={result1.verdict}
            verdictReason={result1.verdictReason}
            cached={result1._cached}
            generatedAt={result1._generatedAt}
          />
          <ReliabilityBanner
            tier={result1.reliabilityTier}
            alert={result1.reliabilityAlert}
          />
          <ModelPipelineBadge
            pipeline={result1._modelPipeline}
            modelLabels={result1._modelLabels || MODEL_LABELS}
          />
          <Summary
            summary={result1.summary}
            procurementRecommendation={result1.procurementRecommendation}
          />
          <FactorList factors={result1.factors} />
          <SignalCards
            redFlags={result1.redFlags}
            trustBonuses={result1.trustBonuses}
          />
          <NewsBlock news={result1.news} />

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              onClick={() => handleSearch(false)}
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "12px",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: "8px",
                padding: "10px 18px",
                cursor: "pointer",
                color: "var(--text2)",
              }}
            >
              {result1._cached ? "⚡ From Cache" : "🔄 Refresh"}
            </button>
            <button
              onClick={() => handleSearch(true)}
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "12px",
                background: "var(--surface)",
                border: "1px solid var(--amber)",
                borderRadius: "8px",
                padding: "10px 18px",
                cursor: "pointer",
                color: "var(--amber)",
              }}
            >
              🔃 Force Fresh Assessment
            </button>
            <button
              onClick={handleClear}
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "12px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 18px",
                cursor: "pointer",
                color: "var(--text3)",
              }}
            >
              ✕ Clear
            </button>
          </div>
        </>
      )}

      {/* Compare mode */}
      {compareMode && result1 && result2 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {[result1, result2].map((r) => (
            <div key={r.supplierName}>
              <ScoreCard
                supplierName={r.supplierName}
                score={r.overallScore}
                verdict={r.verdict}
                verdictReason={r.verdictReason}
                cached={r._cached}
                generatedAt={r._generatedAt}
              />
              <ReliabilityBanner
                tier={r.reliabilityTier}
                alert={r.reliabilityAlert}
              />
              <ModelPipelineBadge
                pipeline={r._modelPipeline}
                modelLabels={r._modelLabels || MODEL_LABELS}
              />
              <FactorList factors={r.factors} />
              <SignalCards
                redFlags={r.redFlags}
                trustBonuses={r.trustBonuses}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
