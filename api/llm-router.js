/**
 * llm-router.js — Specialist LLM routing configuration (OpenAI)
 *
 * This is the single source of truth for which model handles which task.
 * Changing a model here affects the entire pipeline — no hunting through code.
 *
 * ROUTING PHILOSOPHY:
 * ──────────────────────────────────────────────────────────────────────────
 *  Task Category          Model Selected    Reasoning
 *  ──────────────────────────────────────────────────────────────────────
 *  Web search / crawl     gpt-4o-mini       Low cost, high speed, good extraction
 *  ESG / news sentiment   gpt-4o-mini       Pattern matching, NLP classification
 *  Financial scoring      gpt-4o            Structured analytical output, precise numbers
 *  Legal / compliance     gpt-4o            Nuanced legal reasoning, regulation awareness
 *  Final synthesis        gpt-4o            Deep reasoning, contextual judgement, CPO-level
 *
 * WHY NOT o1 FOR SYNTHESIS?
 *   o1/o3 models do not support system prompts or JSON mode as of 2025.
 *   gpt-4o with temperature=0 is the correct choice for deterministic synthesis.
 *
 * BENEFITS OF THIS APPROACH vs single-model:
 * 1. PRECISION    — gpt-4o for scoring/legal is demonstrably more accurate
 * 2. COST         — gpt-4o-mini for high-volume tasks reduces API spend ~50%
 * 3. SPEED        — parallel specialist calls (Stages 2a/2b/2c) complete faster
 * 4. CONSISTENCY  — temperature=0 on ALL models + cache = deterministic results
 * 5. AUDITABILITY — each score carries the model that produced it (traceable)
 */

export const MODELS = {
  /** Fast, cheap — web search data extraction, NLP classification */
  FAST: "gpt-4o-mini",

  /** Balanced — structured scoring, financial/legal analysis, JSON output */
  ANALYTICAL: "gpt-4o",

  /** Most capable — final synthesis, verdict, nuanced judgement */
  REASONING: "gpt-4o",
};

export const PIPELINE_STAGES = {
  dataGathering: {
    model: MODELS.FAST,
    description: "Web intelligence gathering & data extraction",
    maxTokens: 2000,
  },
  financialScoring: {
    model: MODELS.ANALYTICAL,
    description: "Financial health, turnover & credit analysis",
    maxTokens: 1400,
  },
  legalScoring: {
    model: MODELS.ANALYTICAL,
    description: "Legal & compliance assessment",
    maxTokens: 1000,
  },
  esgScoring: {
    model: MODELS.FAST,
    description: "ESG & market reputation evaluation",
    maxTokens: 900,
  },
  finalSynthesis: {
    model: MODELS.REASONING,
    description: "Procurement verdict synthesis",
    maxTokens: 2000,
  },
};

export const MODEL_METADATA = {
  [MODELS.FAST]: {
    displayName: "GPT-4o Mini",
    tier: "speed",
    costTier: "low",
    bestFor: [
      "data extraction",
      "web search",
      "NLP classification",
      "pattern matching",
      "ESG signals",
    ],
  },
  [MODELS.ANALYTICAL]: {
    displayName: "GPT-4o",
    tier: "precision",
    costTier: "medium",
    bestFor: [
      "structured analysis",
      "financial scoring",
      "legal reasoning",
      "JSON output",
      "rubric-based scoring",
    ],
  },
  // REASONING uses same model as ANALYTICAL (gpt-4o)
  // Listed separately for semantic clarity and future upgrade path
};

/**
 * Returns a summary of the pipeline for embedding in API responses.
 * Used by the frontend ModelPipelineBadge component.
 */
export function getPipelineSummary() {
  return Object.fromEntries(
    Object.entries(PIPELINE_STAGES).map(([stage, cfg]) => [stage, cfg.model])
  );
}

/**
 * Returns display metadata for a given model string.
 */
export function getModelMeta(modelString) {
  return (
    MODEL_METADATA[modelString] || {
      displayName: modelString,
      tier: "unknown",
      costTier: "unknown",
      bestFor: [],
    }
  );
}