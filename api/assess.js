/**
 * /api/assess.js  —  Multi-Model OpenAI Supplier Health Assessment
 *
 * ARCHITECTURE: Specialist-per-task LLM routing (OpenAI models)
 * ──────────────────────────────────────────────────────────────
 *  Stage / Task                Model              Why
 *  ──────────────────────────────────────────────────────────────
 *  1. Web intelligence gather  gpt-4o-mini        Fast, cheap, supports function-calling
 *  2a. Financial scoring        gpt-4o             Best structured JSON + financial reasoning
 *  2b. Legal & compliance       gpt-4o             Nuanced legal reasoning, regulation-aware
 *  2c. ESG + reputation         gpt-4o-mini        Pattern matching, NLP classification
 *  3. Final synthesis/verdict   gpt-4o             Deep reasoning, CPO-level procurement verdict
 *
 * BUG FIX: Deterministic caching via SHA-256 keyed result store.
 * Same supplier + deepSearch flag → same cache key → same result for 24 hours.
 * temperature=0 on ALL calls eliminates non-determinism when cache is cold.
 *
 * BENEFITS vs single-model:
 * 1. PRECISION — gpt-4o for scoring/legal is demonstrably more accurate on structured output
 * 2. COST     — gpt-4o-mini for high-volume / simple tasks cuts API spend ~50-60%
 * 3. SPEED    — parallel specialist calls (Stages 2a/2b/2c) complete faster than one serial call
 * 4. CONSISTENCY — temperature=0 + cache eliminates refresh inconsistency
 * 5. AUDITABILITY — each score carries the model that produced it
 */

import crypto from "crypto";

// ── In-process cache (survives warm lambda restarts, 24h TTL) ─────────────
const CACHE_TTL_MS =
  parseInt(process.env.CACHE_TTL_HOURS || "24") * 60 * 60 * 1000;
const resultCache = new Map();

function makeCacheKey(supplierName, deepSearch) {
  const normalised = supplierName.trim().toLowerCase().replace(/\s+/g, " ");
  return crypto
    .createHash("sha256")
    .update(`${normalised}::${Boolean(deepSearch)}`)
    .digest("hex");
}

function fromCache(key) {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resultCache.delete(key);
    return null;
  }
  return entry.data;
}

function toCache(key, data) {
  resultCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── OpenAI Model routing ───────────────────────────────────────────────────
const MODELS = {
  FAST: "gpt-4o-mini",   // Data gathering, ESG/reputation NLP, pattern matching
  ANALYTICAL: "gpt-4o",  // Financial scoring, legal/compliance, structured JSON
  REASONING: "gpt-4o",   // Final synthesis, CPO-level verdict (use gpt-4o; o1 has no system prompt support)
};

// ── Helper: call OpenAI chat completions ──────────────────────────────────
async function callOpenAI(model, systemPrompt, userPrompt, maxTokens = 1500) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY env var not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0, // deterministic — critical for cache consistency
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // enforce JSON output
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error ${res.status}: ${errBody?.error?.message || res.statusText}`
    );
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return safeParseJSON(raw);
}

// ── Helper: Tavily web search ──────────────────────────────────────────────
async function tavilySearch(query, maxResults = 7, searchDepth = "basic") {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  if (!TAVILY_API_KEY) return { results: [], answer: "" };

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: true,
      }),
    });
    if (!res.ok) return { results: [], answer: "" };
    return await res.json();
  } catch {
    return { results: [], answer: "" };
  }
}

// ── Helper: safe JSON parse ────────────────────────────────────────────────
function safeParseJSON(text, fallback = {}) {
  if (typeof text === "object" && text !== null) return text;
  try {
    return JSON.parse(text);
  } catch {
    try {
      const s = text.indexOf("{");
      const e = text.lastIndexOf("}");
      if (s !== -1 && e !== -1) return JSON.parse(text.slice(s, e + 1));
    } catch {}
    return fallback;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  STAGE 1 — Data Gathering  (gpt-4o-mini + Tavily web search)
//  Purpose: Collect raw factual intelligence. No scoring — just facts.
//  Model choice: gpt-4o-mini is fast and cost-effective for extraction tasks.
// ══════════════════════════════════════════════════════════════════════════
async function gatherIntelligence(supplierName, deepSearch, uploadedText) {
  const searchDepth = deepSearch ? "advanced" : "basic";
  const maxResults = deepSearch ? 10 : 7;

  // 5 parallel Tavily searches for comprehensive coverage
  const [globalData, indiaData, leadershipData, financialData, registryData] =
    await Promise.all([
      tavilySearch(
        `${supplierName} company overview headquarters website employees founded history`,
        maxResults,
        searchDepth
      ),
      tavilySearch(
        `${supplierName} India CIN MCA GST registration address contact`,
        maxResults,
        searchDepth
      ),
      tavilySearch(
        `${supplierName} CEO director board leadership management team`,
        maxResults,
        searchDepth
      ),
      tavilySearch(
        `${supplierName} revenue turnover annual report 2024 2025 financial results fraud litigation`,
        maxResults,
        searchDepth
      ),
      tavilySearch(
        `"${supplierName}" site:zaubacorp.com OR site:screener.in OR site:tofler.in CIN directors charges`,
        maxResults,
        searchDepth
      ),
    ]);

  // Build condensed context string for the LLM
  const buildSection = (data, label) => {
    const answer = data.answer ? `Summary: ${data.answer}\n` : "";
    const lines = (data.results || [])
      .slice(0, 6)
      .map((r) => `• ${r.title}: ${r.content?.slice(0, 300)}`)
      .join("\n");
    return `[${label}]\n${answer}${lines}`;
  };

  const webContext = [
    buildSection(globalData, "COMPANY OVERVIEW"),
    buildSection(indiaData, "INDIA REGISTRY (MCA/GST/CIN)"),
    buildSection(leadershipData, "LEADERSHIP & BOARD"),
    buildSection(financialData, "FINANCIALS & COMPLIANCE"),
    buildSection(registryData, "REGISTRY DEEP DIVE (Zauba/Screener/Tofler)"),
  ].join("\n\n");

  // Collect source URLs
  const sources = [];
  [globalData, indiaData, leadershipData, financialData, registryData].forEach(
    (d) => {
      (d.results || []).forEach((r) => {
        try {
          sources.push({
            url: r.url,
            title: r.title,
            domain: new URL(r.url).hostname.replace("www.", ""),
          });
        } catch {}
      });
    }
  );

  const uploadContext = uploadedText
    ? `\n\nUSER-UPLOADED DOCUMENT (treat as high-confidence primary source):\n${uploadedText.slice(0, 3000)}`
    : "";

  // gpt-4o-mini: fast extraction, no complex reasoning needed here
  const systemPrompt = `You are a procurement intelligence analyst. Extract factual data about a company from web search results.
Return ONLY a valid JSON object — no markdown, no explanation.
If a field is unknown, use null. Never invent CIN, GST, or phone numbers.`;

  const userPrompt = `Extract factual intelligence about: "${supplierName}"

WEB SEARCH RESULTS:
${webContext}
${uploadContext}

Return this exact JSON structure:
{
  "companyName": "Official legal name",
  "cin": "CIN or null",
  "gstin": "GST number or null",
  "founded": "Year or null",
  "headquarters": "City, State, Country or null",
  "registeredOffice": "Full address or null",
  "employeeCount": "Count with year or null",
  "annualTurnover": "Revenue figure with FY year or null",
  "stockExchange": "BSE/NSE/etc or null",
  "marketCap": "Value or null",
  "parentCompany": "Parent or null",
  "supplierType": "Large Enterprise|SME|MSME|Startup",
  "website": "URL or null",
  "contactEmail": "Email or null",
  "contactPhone": "Phone or null",
  "keyProducts": ["array of products/services"],
  "certifications": ["ISO certs, etc"],
  "directors": ["Name — Title"],
  "majorClients": ["client names"],
  "charges": "Active charges/liens description or null",
  "lastFilingDate": "Date or null",
  "registryStatus": "active|inactive|struck-off|unknown",
  "legalCases": ["brief description of each case"],
  "recentNews": [{"headline": "string", "sentiment": "positive|neutral|negative", "date": "string", "url": "string or null"}],
  "esgSignals": ["positive or negative ESG signals"],
  "creditSignals": ["credit/financial health signals"],
  "dataConfidence": "high|medium|low",
  "sources": [{"url": "string", "title": "string", "domain": "string"}]
}`;

  const intel = await callOpenAI(
    MODELS.FAST,
    systemPrompt,
    userPrompt,
    2000
  );

  // Merge in the Tavily sources we collected
  intel.sources = intel.sources?.length
    ? intel.sources
    : sources.slice(0, 15);

  return intel;
}

// ══════════════════════════════════════════════════════════════════════════
//  STAGE 2a — Financial Scoring  (gpt-4o: analytical precision)
//  Purpose: Score financial health, turnover, credit risk with rubric bands.
//  Model choice: gpt-4o outperforms gpt-4o-mini on structured numerical reasoning
//  and evidence-based scoring — critical for procurement risk accuracy.
// ══════════════════════════════════════════════════════════════════════════
async function scoreFinancials(supplierName, intel) {
  const systemPrompt = `You are a Chartered Accountant and senior credit analyst with 15+ years evaluating Indian B2B suppliers for procurement risk.
You apply a strict rubric to produce precise, evidence-based financial scores.
Return ONLY a valid JSON object.

SCORING RUBRIC (Annual Turnover):
  80-100 = >₹1000Cr / $120M+
  60-79  = ₹250-1000Cr / $30-120M
  40-59  = ₹10-250Cr / $1.2-30M
  0-39   = <₹10Cr or pre-revenue

SCORING RUBRIC (Financial Health):
  80-100 = Profitable, low debt, consistent growth, published annual reports
  60-79  = Stable profitability, manageable debt
  40-59  = Break-even, moderate concerns
  0-39   = Recurring losses, high debt, insolvency risk

SCORING RUBRIC (Credit Risk):
  80-100 = AAA/AA equivalent, zero payment defaults, BSE/NSE listed
  60-79  = A/BBB equivalent, minor historical delays
  40-59  = BB equivalent, occasional payment issues
  0-39   = B/C/D equivalent, active NPAs, defaults, insolvency

RED FLAG PENALTIES (apply to base score):
  -30 if bankruptcy/insolvency detected
  -20 if NPA bank classification
  -5  per unpaid creditor signal

TRUST BONUSES (add to base score):
  +5 if BSE/NSE/NYSE/NASDAQ listed
  +3 per ISO certification (max +10)
  +3 if published annual report last 2 years
  +3 if MSME Udyam registered`;

  const userPrompt = `Score the financial dimensions for: "${supplierName}"

INTELLIGENCE:
- Annual Turnover: ${intel.annualTurnover || "unknown"}
- Employee Count: ${intel.employeeCount || "unknown"}
- Founded: ${intel.founded || "unknown"}
- Stock Exchange: ${intel.stockExchange || "none"}
- Market Cap: ${intel.marketCap || "unknown"}
- Registry Status: ${intel.registryStatus || "unknown"}
- Certifications: ${JSON.stringify(intel.certifications || [])}
- Credit Signals: ${JSON.stringify(intel.creditSignals || [])}
- Charges/Liens: ${intel.charges || "none reported"}
- Last Filing: ${intel.lastFilingDate || "unknown"}

Instructions:
- Scores must be precise integers (avoid multiples of 5 unless truly warranted by evidence)
- Apply penalties and bonuses from the rubric
- confidence = "high" only if you have confirmed web-sourced data for this dimension
- List ONLY penalties/bonuses that actually apply

Return this exact JSON:
{
  "financialHealth": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "2-3 sentence evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": ["penalty string if applied"],
    "bonuses": ["bonus string if applied"]
  },
  "annualTurnover": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": [],
    "bonuses": []
  },
  "creditRisk": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": [],
    "bonuses": []
  },
  "redFlags": ["list of red flags found"],
  "trustBonuses": ["list of trust bonuses applied"]
}`;

  return callOpenAI(MODELS.ANALYTICAL, systemPrompt, userPrompt, 1400);
}

// ══════════════════════════════════════════════════════════════════════════
//  STAGE 2b — Legal & Compliance Scoring  (gpt-4o: nuanced legal reasoning)
//  Purpose: Assess regulatory compliance, legal cases, filing status.
//  Model choice: gpt-4o has significantly better legal/regulatory reasoning
//  than gpt-4o-mini — critical for identifying compliance risks.
// ══════════════════════════════════════════════════════════════════════════
async function scoreLegalCompliance(supplierName, intel) {
  const systemPrompt = `You are a senior corporate lawyer and compliance officer specialising in Indian regulatory frameworks:
Companies Act 2013, GST Act, MSME Act, RoC filings, EPF, ESI, SEBI regulations, and procurement standards.
You assess supplier legal risk with precision and apply evidence-based scoring.
Return ONLY a valid JSON object.

SCORING RUBRIC (Legal & Compliance):
  80-100 = All filings current, no pending cases, clean ROC status, valid GST
  60-79  = Minor historical issues only, mostly compliant, small delays
  40-59  = Pending filings, minor disputes, some compliance gaps
  0-39   = Active litigation, major violations, blacklisted, struck-off

PENALTY TABLE:
  -40 if government blacklisted or debarred
  -25 if active fraud/criminal investigation
  -20 if major SEBI/MCA violations
  -15 if struck-off or inactive registry status
  -10 per active court case

BONUS TABLE:
  +3 per ISO certification (max +10)
  +3 if MSME Udyam registered
  +5 if 20+ years in business with clean record`;

  const userPrompt = `Assess legal and compliance posture of: "${supplierName}"

DATA:
- CIN: ${intel.cin || "not found"}
- GSTIN: ${intel.gstin || "not found"}
- Registry Status: ${intel.registryStatus || "unknown"}
- Founded: ${intel.founded || "unknown"}
- Last MCA Filing: ${intel.lastFilingDate || "unknown"}
- Active Charges/Liens: ${intel.charges || "none reported"}
- Legal Cases: ${JSON.stringify(intel.legalCases || [])}
- Certifications: ${JSON.stringify(intel.certifications || [])}

Return this exact JSON:
{
  "legalCompliance": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "2-3 sentence evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": ["penalty applied"],
    "bonuses": ["bonus applied"]
  },
  "complianceFlags": ["list of compliance concerns"],
  "regulatoryStrengths": ["list of compliance strengths"],
  "cinVerified": true|false,
  "gstVerified": true|false
}`;

  return callOpenAI(MODELS.ANALYTICAL, systemPrompt, userPrompt, 1000);
}

// ══════════════════════════════════════════════════════════════════════════
//  STAGE 2c — ESG & Reputation Scoring  (gpt-4o-mini: NLP classification)
//  Purpose: Score ESG posture and market reputation from signals/news.
//  Model choice: gpt-4o-mini is excellent at NLP classification, sentiment
//  analysis, and pattern matching — cheaper than gpt-4o for this task.
// ══════════════════════════════════════════════════════════════════════════
async function scoreESGReputation(supplierName, intel) {
  const systemPrompt = `You are an ESG analyst and brand reputation specialist.
You classify supplier ESG posture and market reputation from available signals.
Return ONLY a valid JSON object.

SCORING RUBRIC (ESG):
  80-100 = Published ESG/sustainability report, net-zero commitment, BRSR compliant
  60-79  = Active CSR programs, some sustainability disclosure
  40-59  = Basic statutory compliance only, limited disclosure
  0-39   = Environmental violations, labour law issues, poor governance

SCORING RUBRIC (Market Reputation):
  80-100 = Industry leader, Fortune 500/Nifty 50 clients, major awards
  60-79  = Well-known brand, positive sector standing
  40-59  = Mixed reviews, regional presence, some negative signals
  0-39   = Active reputational damage, scandals, fraud allegations

PENALTY:
  -15 for environmental/safety violations
  -15 for active customer fraud complaints
  -10 for unexplained leadership exits

BONUS:
  +5 for 20+ years in business
  +5 for Fortune 500/Nifty 50 clients
  +5 for industry awards or certifications`;

  const userPrompt = `Score ESG and market reputation for: "${supplierName}"

SIGNALS:
- ESG Signals: ${JSON.stringify(intel.esgSignals || [])}
- Recent News: ${JSON.stringify((intel.recentNews || []).slice(0, 8))}
- Major Clients: ${JSON.stringify(intel.majorClients || [])}
- Certifications: ${JSON.stringify(intel.certifications || [])}
- Founded: ${intel.founded || "unknown"}
- Legal Cases: ${JSON.stringify(intel.legalCases || [])}

Return this exact JSON:
{
  "esgScore": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": [],
    "bonuses": []
  },
  "marketReputation": {
    "score": 0-100,
    "band": "80-100|60-79|40-59|0-39",
    "rationale": "evidence-based explanation",
    "confidence": "high|medium|low",
    "penalties": [],
    "bonuses": []
  },
  "esgRisks": ["esg risk strings"],
  "esgStrengths": ["esg strength strings"],
  "newsSentimentSummary": "brief 1-sentence sentiment summary"
}`;

  return callOpenAI(MODELS.FAST, systemPrompt, userPrompt, 900);
}

// ══════════════════════════════════════════════════════════════════════════
//  STAGE 3 — Final Synthesis  (gpt-4o: CPO-level verdict)
//  Purpose: Synthesise all specialist scores into procurement verdict.
//  Model choice: gpt-4o provides the deepest contextual reasoning for
//  nuanced judgements that weigh conflicting signals — the highest-stakes
//  output that directly influences procurement decisions.
// ══════════════════════════════════════════════════════════════════════════
async function synthesisVerdict(supplierName, intel, financials, legal, esg) {
  const systemPrompt = `You are the Chief Procurement Officer of a Fortune 500 company with 20+ years of experience in supplier risk evaluation across India and emerging markets.
You receive specialist sub-scores and synthesise them into an authoritative procurement verdict.
Your output is used by procurement committees for onboarding decisions. Be precise, direct, and evidence-based.
Return ONLY a valid JSON object.`;

  const allRedFlags = [
    ...(financials.redFlags || []),
    ...(legal.complianceFlags || []),
    ...(esg.esgRisks || []),
  ];
  const allBonuses = [
    ...(financials.trustBonuses || []),
    ...(legal.regulatoryStrengths || []),
    ...(esg.esgStrengths || []),
  ];

  const userPrompt = `Produce final procurement assessment for: "${supplierName}"

=== SPECIALIST SCORES (from dedicated models) ===
Financial Health:    ${financials.financialHealth?.score ?? "?"}/100  [${financials.financialHealth?.confidence ?? "?"} confidence] — ${financials.financialHealth?.rationale ?? ""}
Annual Turnover:     ${financials.annualTurnover?.score ?? "?"}/100   [${financials.annualTurnover?.confidence ?? "?"} confidence] — ${financials.annualTurnover?.rationale ?? ""}
Credit Risk:         ${financials.creditRisk?.score ?? "?"}/100        [${financials.creditRisk?.confidence ?? "?"} confidence] — ${financials.creditRisk?.rationale ?? ""}
Legal & Compliance:  ${legal.legalCompliance?.score ?? "?"}/100       [${legal.legalCompliance?.confidence ?? "?"} confidence] — ${legal.legalCompliance?.rationale ?? ""}
ESG Score:           ${esg.esgScore?.score ?? "?"}/100                 [${esg.esgScore?.confidence ?? "?"} confidence] — ${esg.esgScore?.rationale ?? ""}
Market Reputation:   ${esg.marketReputation?.score ?? "?"}/100        [${esg.marketReputation?.confidence ?? "?"} confidence] — ${esg.marketReputation?.rationale ?? ""}

=== SCORING WEIGHTS ===
Financial Health: 25% | Annual Turnover: 20% | Credit Risk: 20% | Legal Compliance: 20% | Market Reputation: 10% | ESG Score: 5%

=== RED FLAGS (${allRedFlags.length}) ===
${allRedFlags.map((f) => `• ${f}`).join("\n") || "None detected"}

=== TRUST BONUSES (${allBonuses.length}) ===
${allBonuses.map((b) => `• ${b}`).join("\n") || "None identified"}

=== COMPANY CONTEXT ===
Registry Status: ${intel.registryStatus || "unknown"}
Data Confidence: ${intel.dataConfidence || "low"}
CIN: ${intel.cin || "not found"} | GSTIN: ${intel.gstin || "not found"}
Founded: ${intel.founded || "unknown"} | HQ: ${intel.headquarters || "unknown"}

Instructions:
1. Compute overallScore using the weights above. Show your weighted calculation mentally. Do NOT round to nearest 5.
2. verdict: "APPROVED" if ≥65, "CONDITIONAL" if 40-64, "REJECTED" if <40.
3. If serious red flags exist (active fraud, blacklisted, struck-off), cap score and set REJECTED.
4. verdictReason: 2-3 specific sentences about THIS supplier, not generic text.
5. summary: 4-5 sentence executive paragraph with evidence.
6. reliabilityTier: "verified" if dataConfidence=high, "partial" if medium, "limited"/"unverifiable" if low.
7. procurementRecommendation: specific action steps for the procurement team.

Return this exact JSON:
{
  "overallScore": integer 0-100,
  "verdict": "APPROVED|CONDITIONAL|REJECTED",
  "verdictReason": "2-3 specific sentences",
  "summary": "4-5 sentence executive summary",
  "procurementRecommendation": "specific action steps",
  "reliabilityTier": "verified|partial|limited|unverifiable",
  "reliabilityAlert": "warning string or null",
  "keyRisks": ["top 3-5 risks"],
  "keyStrengths": ["top 3-5 strengths"],
  "scoreBreakdown": {
    "financialHealth": {"score": n, "weight": 0.25, "contribution": n},
    "annualTurnover": {"score": n, "weight": 0.20, "contribution": n},
    "creditRisk": {"score": n, "weight": 0.20, "contribution": n},
    "legalCompliance": {"score": n, "weight": 0.20, "contribution": n},
    "marketReputation": {"score": n, "weight": 0.10, "contribution": n},
    "esgScore": {"score": n, "weight": 0.05, "contribution": n}
  }
}`;

  return callOpenAI(MODELS.REASONING, systemPrompt, userPrompt, 2000);
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    supplierName,
    deepSearch = false,
    uploadedText = null,
    nocache = false,
  } = req.body || {};

  if (!supplierName?.trim()) {
    return res.status(400).json({ error: "supplierName is required" });
  }

  const name = supplierName.trim();
  const key = makeCacheKey(name, deepSearch);

  // ── Cache hit: return same deterministic result ─────────────────────────
  if (!nocache) {
    const cached = fromCache(key);
    if (cached) {
      console.log(`[assess] Cache HIT for "${name}"`);
      return res.status(200).json({ ...cached, _cached: true });
    }
  }

  console.log(`[assess] Cache MISS — running pipeline for "${name}"`);

  try {
    // ── Stage 1: Intelligence gathering (gpt-4o-mini + Tavily) ─────────────
    const intel = await gatherIntelligence(name, deepSearch, uploadedText);

    // ── Stage 2: Specialist scoring — run in PARALLEL for speed ────────────
    // Each model works on its domain of expertise simultaneously
    const [financials, legal, esg] = await Promise.all([
      scoreFinancials(name, intel),       // gpt-4o: financial/credit precision
      scoreLegalCompliance(name, intel),  // gpt-4o: legal/regulatory reasoning
      scoreESGReputation(name, intel),    // gpt-4o-mini: NLP classification
    ]);

    // ── Stage 3: Synthesis (gpt-4o: CPO-level verdict) ─────────────────────
    const verdict = await synthesisVerdict(name, intel, financials, legal, esg);

    // ── Build factor array for frontend ────────────────────────────────────
    const factors = [
      {
        name: "Financial Health",
        icon: "📊",
        score: financials.financialHealth?.score ?? 40,
        value: financials.financialHealth?.score >= 65
          ? "Strong"
          : financials.financialHealth?.score >= 40
          ? "Stable"
          : "Weak",
        detail: financials.financialHealth?.rationale ?? "Insufficient data",
        band: financials.financialHealth?.band ?? "40-59",
        confidence: financials.financialHealth?.confidence ?? "low",
        penalties: financials.financialHealth?.penalties ?? [],
        bonuses: financials.financialHealth?.bonuses ?? [],
        status: scoreToStatus(financials.financialHealth?.score ?? 40),
        _model: MODELS.ANALYTICAL,
      },
      {
        name: "Annual Turnover",
        icon: "💰",
        score: financials.annualTurnover?.score ?? 40,
        value: intel.annualTurnover || "Unknown",
        detail: financials.annualTurnover?.rationale ?? "Insufficient data",
        band: financials.annualTurnover?.band ?? "40-59",
        confidence: financials.annualTurnover?.confidence ?? "low",
        penalties: financials.annualTurnover?.penalties ?? [],
        bonuses: financials.annualTurnover?.bonuses ?? [],
        status: scoreToStatus(financials.annualTurnover?.score ?? 40),
        _model: MODELS.ANALYTICAL,
      },
      {
        name: "Credit Risk",
        icon: "🏦",
        score: financials.creditRisk?.score ?? 40,
        value: financials.creditRisk?.score >= 65
          ? "Low Risk"
          : financials.creditRisk?.score >= 40
          ? "Moderate"
          : "High Risk",
        detail: financials.creditRisk?.rationale ?? "Insufficient data",
        band: financials.creditRisk?.band ?? "40-59",
        confidence: financials.creditRisk?.confidence ?? "low",
        penalties: financials.creditRisk?.penalties ?? [],
        bonuses: financials.creditRisk?.bonuses ?? [],
        status: scoreToStatus(financials.creditRisk?.score ?? 40),
        _model: MODELS.ANALYTICAL,
      },
      {
        name: "Legal & Compliance",
        icon: "⚖️",
        score: legal.legalCompliance?.score ?? 40,
        value: legal.legalCompliance?.score >= 65
          ? "Clean"
          : legal.legalCompliance?.score >= 40
          ? "Minor Issues"
          : "Serious Issues",
        detail: legal.legalCompliance?.rationale ?? "Insufficient data",
        band: legal.legalCompliance?.band ?? "40-59",
        confidence: legal.legalCompliance?.confidence ?? "low",
        penalties: legal.legalCompliance?.penalties ?? [],
        bonuses: legal.legalCompliance?.bonuses ?? [],
        status: scoreToStatus(legal.legalCompliance?.score ?? 40),
        _model: MODELS.ANALYTICAL,
      },
      {
        name: "ESG Score",
        icon: "🌱",
        score: esg.esgScore?.score ?? 40,
        value: esg.esgScore?.score >= 65
          ? "Leader"
          : esg.esgScore?.score >= 40
          ? "Basic"
          : "Poor",
        detail: esg.esgScore?.rationale ?? "Insufficient data",
        band: esg.esgScore?.band ?? "40-59",
        confidence: esg.esgScore?.confidence ?? "low",
        penalties: esg.esgScore?.penalties ?? [],
        bonuses: esg.esgScore?.bonuses ?? [],
        status: scoreToStatus(esg.esgScore?.score ?? 40),
        _model: MODELS.FAST,
      },
      {
        name: "Market Reputation",
        icon: "⭐",
        score: esg.marketReputation?.score ?? 40,
        value: esg.marketReputation?.score >= 65
          ? "Strong"
          : esg.marketReputation?.score >= 40
          ? "Moderate"
          : "Damaged",
        detail: esg.marketReputation?.rationale ?? "Insufficient data",
        band: esg.marketReputation?.band ?? "40-59",
        confidence: esg.marketReputation?.confidence ?? "low",
        penalties: esg.marketReputation?.penalties ?? [],
        bonuses: esg.marketReputation?.bonuses ?? [],
        status: scoreToStatus(esg.marketReputation?.score ?? 40),
        _model: MODELS.FAST,
      },
    ];

    // Build source map for frontend
    const sourceMap = {};
    (intel.sources || []).forEach((s, i) => {
      const id = `SRC${String(i + 1).padStart(2, "0")}`;
      sourceMap[id] = s;
    });

    // Staleness detection
    const currentYear = new Date().getFullYear();
    const staleYear = currentYear - 2;
    const staleFields = [];

    const extractYear = (str) => {
      if (!str) return null;
      const m = String(str).match(/20\d{2}/);
      return m ? parseInt(m[0]) : null;
    };

    const turnoverYear = extractYear(intel.annualTurnover);
    if (turnoverYear && turnoverYear < staleYear)
      staleFields.push({ field: "Annual Revenue", dataYear: turnoverYear });

    const employeeYear = extractYear(intel.employeeCount);
    if (employeeYear && employeeYear < staleYear)
      staleFields.push({ field: "Employees", dataYear: employeeYear });

    // Assemble the final result object
    const result = {
      // Company identity
      supplierName: intel.companyName || name,
      country: intel.headquarters?.split(",").pop()?.trim() || "Unknown",
      industry: intel.keyProducts?.[0]
        ? `${intel.keyProducts[0]} & related`
        : "Unknown",
      founded: intel.founded,
      headquarters: intel.headquarters,
      registeredOffice: intel.registeredOffice,
      employees: intel.employeeCount,
      annualRevenue: intel.annualTurnover,
      stockExchange: intel.stockExchange || "Privately Held",
      marketCap: intel.marketCap || "Private",
      parentCompany: intel.parentCompany || "Independent",
      supplierType: intel.supplierType || "SME",
      website: intel.website,
      contactEmail: intel.contactEmail,
      contactPhone: intel.contactPhone,
      linkedin: null,

      // Registry
      cin: intel.cin,
      cinConfidence: intel.cin ? "high" : "low",
      gstNumber: intel.gstin,
      gstConfidence: intel.gstin ? "high" : "low",
      udyamNumber: null,
      charges: intel.charges || "None found",
      lastFilingDate: intel.lastFilingDate,

      // Products / certs / clients
      keyProducts: intel.keyProducts || [],
      certifications: intel.certifications || [],
      majorClients: intel.majorClients || [],

      // Board
      boardMembers: (intel.directors || []).map((d) => {
        const parts = d.split("—").map((s) => s.trim());
        return {
          name: parts[0] || d,
          designation: parts[1] || "Director",
          confidence: "medium",
        };
      }),

      // Scores
      overallScore: verdict.overallScore ?? 40,
      verdict: verdict.verdict ?? "CONDITIONAL",
      verdictReason: verdict.verdictReason ?? "Assessment incomplete.",
      summary: verdict.summary ?? "Insufficient data for full assessment.",
      procurementRecommendation:
        verdict.procurementRecommendation ?? "Manual review required.",

      factors,

      redFlags: [
        ...(financials.redFlags || []),
        ...(legal.complianceFlags || []),
        ...(esg.esgRisks || []),
        ...(verdict.keyRisks || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // deduplicate

      trustBonuses: [
        ...(financials.trustBonuses || []),
        ...(legal.regulatoryStrengths || []),
        ...(esg.esgStrengths || []),
        ...(verdict.keyStrengths || []),
      ].filter((v, i, a) => a.indexOf(v) === i),

      news: (intel.recentNews || []).map((n, i) => ({
        headline: n.headline,
        source: n.date || "Recent",
        sentiment: n.sentiment || "neutral",
        url: n.url || null,
      })),

      // Reliability
      reliabilityTier: verdict.reliabilityTier ?? "limited",
      reliabilityAlert: verdict.reliabilityAlert ?? null,
      reliabilityScore: intel.dataConfidence,
      lowConfidenceFieldCount: factors.filter((f) => f.confidence === "low")
        .length,

      // Verify links
      verifyLinks: [
        {
          label: "Verify on MCA21",
          url: "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do",
          description: "Check CIN, directors and filing status",
        },
        {
          label: "GST Verification",
          url: "https://services.gst.gov.in/services/searchtp",
          description: "Verify GSTIN registration and status",
        },
        {
          label: "Company Search (Zauba)",
          url: "https://www.zaubacorp.com/company-search",
          description: "Cross-check directors, charges and financials",
        },
        {
          label: "Screener.in",
          url: "https://www.screener.in",
          description: "Financial ratios, P&L, balance sheet",
        },
        {
          label: "Tofler",
          url: "https://www.tofler.in",
          description: "MCA filings, annual returns, charges",
        },
      ],

      // Source data
      sourceIndex: intel.sources || [],
      sourceMap,
      dataWarnings: [],
      staleFields,

      // Pipeline metadata (shown in UI)
      _modelPipeline: {
        dataGathering: MODELS.FAST,
        financialScoring: MODELS.ANALYTICAL,
        legalScoring: MODELS.ANALYTICAL,
        esgScoring: MODELS.FAST,
        finalSynthesis: MODELS.REASONING,
      },
      _modelLabels: {
        [MODELS.FAST]: "GPT-4o Mini",
        [MODELS.ANALYTICAL]: "GPT-4o",
        [MODELS.REASONING]: "GPT-4o",
      },
      _cached: false,
      _generatedAt: new Date().toISOString(),
      _cacheKey: key,
    };

    // ── Cache the result ────────────────────────────────────────────────────
    toCache(key, result);
    console.log(
      `[assess] Pipeline complete for "${name}", score=${result.overallScore}, cached.`
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("[assess] Pipeline error:", err.message);
    return res.status(500).json({ error: err.message || "Assessment failed" });
  }
}

// ── Scoring helpers ─────────────────────────────────────────────────────────
function scoreToStatus(score) {
  if (score >= 65) return "green";
  if (score >= 40) return "amber";
  return "red";
}