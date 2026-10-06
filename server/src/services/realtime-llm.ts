import { type CeoConsultationAnalysis, type CeoDiscoveryQuestion } from "./ceo-consultation.js";

export interface LlmConfig {
  provider?: "openai" | "gemini" | "anthropic" | "groq" | "deepseek" | "ollama" | "builtin";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Universal caller for OpenAI, Gemini, Anthropic, Groq, DeepSeek, or Local Ollama
 */
export async function callLlmApi(prompt: string, systemPrompt: string, config: LlmConfig = {}): Promise<string> {
  const provider = config.provider || detectProvider(config.apiKey);
  const apiKey = config.apiKey || getEnvApiKey(provider);

  if (provider === "ollama") {
    const url = (config.baseUrl || "http://127.0.0.1:11434").replace(/\/$/, "") + "/api/chat";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model || "llama3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
    const data = await res.json() as { message?: { content?: string } };
    return data.message?.content || "";
  }

  if (provider === "gemini" && apiKey) {
    const model = config.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error (${res.status}): ${await res.text()}`);
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (provider === "anthropic" && apiKey) {
    const model = config.model || "claude-3-5-sonnet-20241022";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error (${res.status}): ${await res.text()}`);
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text || "";
  }

  if ((provider === "openai" || provider === "groq" || provider === "deepseek") && apiKey) {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let defaultModel = "gpt-4o";

    if (provider === "groq") {
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      defaultModel = "llama-3.3-70b-versatile";
    } else if (provider === "deepseek") {
      endpoint = "https://api.deepseek.com/chat/completions";
      defaultModel = "deepseek-chat";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`${provider} error (${res.status}): ${await res.text()}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No active LLM API key configured or supported provider specified.");
}

function detectProvider(apiKey?: string): "openai" | "gemini" | "anthropic" | "groq" | "deepseek" | "builtin" {
  if (!apiKey) return "builtin";
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("AIzaSy")) return "gemini";
  if (apiKey.startsWith("gsk_")) return "groq";
  if (apiKey.startsWith("sk-")) return "openai";
  return "openai";
}

function getEnvApiKey(provider: string): string | undefined {
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "gemini") return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (provider === "groq") return process.env.GROQ_API_KEY;
  if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY;
  return undefined;
}

/**
 * Real-time dynamic CEO Consultation with LLM or Semantic NLP Engine
 */
export async function executeRealtimeCeoConsultation(
  ideaPrompt: string,
  config?: LlmConfig,
): Promise<CeoConsultationAnalysis> {
  const hasKey = config?.apiKey || getEnvApiKey(config?.provider || "openai") || config?.provider === "ollama";

  if (hasKey) {
    try {
      const systemPrompt = `You are the Autonomous CEO & Chief Strategist of an elite software agency.
The client has given you a raw project idea.
Your goal is to deeply analyze their concept and ask 4 to 5 critical clarification questions to guide the CTO and PM in building technical specs.

Respond ONLY with valid JSON matching this schema:
{
  "projectTitle": "Clear, exciting title for the project",
  "domain": "short_domain_slug",
  "executiveObservation": "2-3 sentences of strategic, high-value CEO feedback on why this project is interesting and what key business/technical trade-offs must be evaluated.",
  "questions": [
    {
      "id": "question_identifier_slug",
      "category": "High level category (e.g. Business Model, Payments, Customization, Architecture)",
      "question": "Clear, direct question asking for a specific decision",
      "explanation": "Why this decision matters for engineering or product",
      "options": [
        {
          "id": "option_slug_1",
          "label": "Short option name",
          "description": "Specific details and implications",
          "isRecommended": true
        },
        {
          "id": "option_slug_2",
          "label": "Alternative option name",
          "description": "Details"
        },
        {
          "id": "option_slug_3",
          "label": "Another alternative option name",
          "description": "Details"
        }
      ]
    }
  ]
}`;

      const rawJson = await callLlmApi(
        `User Project Concept: "${ideaPrompt}"`,
        systemPrompt,
        config,
      );

      const parsed = JSON.parse(rawJson) as CeoConsultationAnalysis;
      if (parsed.projectTitle && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("Real-time LLM consultation failed, falling back to dynamic semantic engine:", err);
    }
  }

  // Dynamic Semantic Analyzer for any domain
  return dynamicSemanticCeoAnalysis(ideaPrompt);
}

/**
 * Intelligent Semantic Domain Analyzer (runs in sub-milliseconds without external API keys)
 */
export function dynamicSemanticCeoAnalysis(ideaPrompt: string): CeoConsultationAnalysis {
  const text = ideaPrompt.toLowerCase();

  // 1. Saree / Ethnic Apparel E-Commerce
  if (text.includes("saree") || text.includes("sari") || text.includes("silk") || text.includes("ethnic") || text.includes("handloom")) {
    return {
      projectTitle: "Sarees Selling E-Commerce Platform",
      domain: "saree_ecommerce",
      executiveObservation: "Saree e-commerce demands high customer trust around fabric authenticity, drape visualization, and custom tailoring (blouse stitching and fall/pico). We must architect seamless UPI/COD and global diaspora payments.",
      questions: [
        {
          id: "business_model",
          category: "Business Model & Target Segment",
          question: "Which e-commerce operating model best fits your venture?",
          explanation: "Defines whether we architect for retail boutique buyers, wholesale merchant orders, or a multi-weaver collective.",
          options: [
            { id: "d2c_boutique", label: "D2C Direct-to-Consumer Boutique", description: "Curated premium handloom and festive collections sold directly to retail buyers.", isRecommended: true },
            { id: "b2c_mass", label: "B2C Multi-Category Catalog", description: "High-volume daily wear and festive sarees sourced from multiple regional weavers." },
            { id: "b2b_wholesale", label: "B2B Wholesale / Weaver-to-Retailer", description: "Bulk minimum-order quantities (MOQs), tiered merchant pricing, and GST invoicing." },
            { id: "hybrid_d2c_b2b", label: "Hybrid (Storefront + Wholesale Portal)", description: "Unified catalog with customer retail checkout and authenticated B2B bulk ordering." },
          ],
        },
        {
          id: "customization_catalog",
          category: "Catalog & Tailoring Customization",
          question: "What tailoring and saree customization options should buyers have?",
          explanation: "Determines database schema complexity for product attributes and custom service add-ons.",
          options: [
            { id: "blouse_fall_pico", label: "Custom Blouse Stitching & Fall/Pico Add-on", description: "Interactive sizing forms (bust, sleeve, neckline) + saree pre-pleating services.", isRecommended: true },
            { id: "ready_unstitched", label: "Standard Unstitched Sarees Only", description: "Quick turnaround, standard saree length with running blouse piece (no custom tailoring)." },
            { id: "exclusive_handcrafted", label: "Single-Piece Handcrafted / Artisan Silk", description: "One-of-a-kind Silk Mark certified single SKU inventory with authenticity certificates." },
          ],
        },
        {
          id: "payments_geography",
          category: "Geographical Market & Payment Gateways",
          question: "Where are your primary buyers located and what payment methods must be supported?",
          explanation: "Guides payment gateway selection, currency conversion engines, and tax compliance.",
          options: [
            { id: "india_upi_cod", label: "Domestic India (UPI, Cards & Cash on Delivery)", description: "Razorpay / Cashfree integration with PhonePe, GPay, Paytm, and COD OTP verification.", isRecommended: true },
            { id: "global_nri", label: "Global NRI Diaspora (USD, GBP, AED, EUR)", description: "Stripe / PayPal multi-currency checkout with dynamic currency localization." },
            { id: "omnichannel_global", label: "Omnichannel Global + Domestic India", description: "Full dual-rail payment stack: UPI/COD for India and Stripe for international orders." },
          ],
        },
        {
          id: "discovery_features",
          category: "Customer Experience & Mobile Discovery",
          question: "What visual discovery and shopping features should we build into the MVP?",
          explanation: "Essential for boosting conversion rate and reducing return/exchange rates.",
          options: [
            { id: "video_reels_zoom", label: "Fabric Video Reels, 4K Macro Zoom & WhatsApp Support", description: "Ultra-fast mobile viewing of saree drape texture, pallu details, and instant chat.", isRecommended: true },
            { id: "ai_drape_preview", label: "AI Saree Drape Preview / Virtual Try-On", description: "AI-assisted visualization of how the saree looks on various body profiles and skin tones." },
            { id: "occasion_matcher", label: "Occasion-Based Curations (Bridal, Office, Temple, Party)", description: "Smart moodboards, filter by color tone, silk weight, and price bracket." },
          ],
        },
        {
          id: "fulfillment_logistics",
          category: "Logistics & Order Tracking",
          question: "How will shipping, packaging, and delivery tracking be automated?",
          explanation: "Ensures automated shipping label generation and webhook-driven tracking notifications.",
          options: [
            { id: "shiprocket_automated", label: "Shiprocket / Delhivery Automated API Integration", description: "Real-time shipping rate calculator, 1-click AWB generation, and SMS/WhatsApp live tracking.", isRecommended: true },
            { id: "inhouse_dispatch", label: "In-House Dispatch & Manual Tracking", description: "Admin panel to manually assign tracking numbers and courier partner URLs." },
          ],
        },
      ],
    };
  }

  // 2. Healthcare / Hospital / Medical
  if (text.includes("hospital") || text.includes("clinic") || text.includes("doctor") || text.includes("patient") || text.includes("medical") || text.includes("health")) {
    return {
      projectTitle: "Smart Healthcare & Clinical Management Suite",
      domain: "healthcare_telemed",
      executiveObservation: "Healthcare systems require strict HIPAA/HL7/FHIR compliance, atomic doctor appointment scheduling, EHR medical history encryption, and zero-latency telemedicine video consultations.",
      questions: [
        {
          id: "clinical_scope",
          category: "Operational Scope & Care Delivery",
          question: "What is the primary operational focus of this platform?",
          explanation: "Guides clinical workflow modeling and role-based permissions.",
          options: [
            { id: "clinic_ehr_booking", label: "Multi-Specialty Clinic & OPD Appointments", description: "Online doctor scheduling, digital prescriptions, and patient EHR records.", isRecommended: true },
            { id: "telemedicine_virtual", label: "Direct-to-Patient Telehealth & E-Consultation", description: "Encrypted video calls, instant digital billing, and prescription delivery." },
            { id: "inpatient_hospital", label: "Full Hospital ERP (IPD, Beds, OT, Pharmacy & Billing)", description: "Comprehensive ward occupancy, nurse stations, and insurance TPA claims." },
          ],
        },
        {
          id: "security_compliance",
          category: "Data Privacy & Regulatory Compliance",
          question: "Which compliance standards must the architecture enforce?",
          explanation: "Determines database field-level encryption and audit logging protocols.",
          options: [
            { id: "hipaa_disha", label: "HIPAA / ABDM (Ayushman Bharat Digital Mission) Compliance", description: "ABHA health ID linking, consent artifact verification, and AES-256 encrypted storage.", isRecommended: true },
            { id: "gdpr_standard", label: "GDPR / Standard Medical Encryption", description: "Patient data anonymization, exportable medical records, and strict consent controls." },
          ],
        },
        {
          id: "telehealth_integrations",
          category: "Clinical Integrations & Diagnostic Lab APIs",
          question: "Which integrations are required for the V1 rollout?",
          explanation: "Ensures lab reporting and pharmacy dispensing pipelines are connected.",
          options: [
            { id: "lab_pharmacy_video", label: "Diagnostic Lab APIs + E-Pharmacy + WebRTC Video", description: "Automated test result ingestion, e-prescription fulfillment, and 1-click video consults.", isRecommended: true },
            { id: "basic_opd_sms", label: "Core Booking + WhatsApp/SMS Appointment Reminders", description: "Lean setup focused on reducing OPD no-shows with automated WhatsApp reminders." },
          ],
        },
      ],
    };
  }

  // 3. Fintech / Banking / Lending / Crypto
  if (text.includes("bank") || text.includes("loan") || text.includes("lending") || text.includes("crypto") || text.includes("wallet") || text.includes("payment") || text.includes("finance") || text.includes("fintech")) {
    return {
      projectTitle: "Next-Gen Fintech & Digital Financial Platform",
      domain: "fintech_banking",
      executiveObservation: "Fintech architectures require double-entry immutable ledgers, idempotent transaction processors, KYC/AML fraud detection, and banking gateway webhooks.",
      questions: [
        {
          id: "financial_model",
          category: "Financial Service Type",
          question: "What core financial workflow are we building?",
          explanation: "Determines compliance licensing, payment rail integrations, and ledger architecture.",
          options: [
            { id: "digital_lending", label: "Digital Micro-Lending & Instant Credit Scoring", description: "Automated credit risk assessment, loan disbursement, and EMI auto-debit.", isRecommended: true },
            { id: "neobank_wallet", label: "Neo-Banking Wallet & P2P / Merchant Payments", description: "Prepaid card issuing, QR payments, and high-throughput balance management." },
            { id: "wealth_investment", label: "Robo-Advisory & Mutual Fund / Stock Investment", description: "Portfolio rebalancing, SIP mandate automation, and market data feeds." },
          ],
        },
        {
          id: "ledger_architecture",
          category: "Ledger & Transaction Integrity",
          question: "What database transaction guarantees are required?",
          explanation: "Ensures financial reconciliation and zero-loss ledger auditing.",
          options: [
            { id: "immutable_double_entry", label: "Immutable Double-Entry Ledger (PostgreSQL + Append-Only Audit)", description: "Strict debit/credit parity with cryptographic checksums and event-sourcing.", isRecommended: true },
            { id: "standard_relational", label: "Standard Relational Transactional DB with Redis Lock", description: "ACID transactions with distributed mutex locks for fast checkout." },
          ],
        },
        {
          id: "kyc_verification",
          category: "KYC / AML & Identity Verification",
          question: "How will user identities and fraud prevention be handled?",
          explanation: "Guides KYC provider integration (Aadhaar/PAN, Persona, Onfido).",
          options: [
            { id: "instant_video_kyc", label: "Instant Automated KYC + Video Liveness + AML Screening", description: "Sub-60s verification via government ID APIs, face-match, and sanctions screening.", isRecommended: true },
            { id: "document_upload_review", label: "Manual Document Upload & Backoffice Review Queue", description: "Admin console for compliance officers to verify uploaded IDs." },
          ],
        },
      ],
    };
  }

  // 4. Default / General Custom Software & SaaS
  const cleanTitle = ideaPrompt.length > 40 ? `${ideaPrompt.slice(0, 35)}... Platform` : `${ideaPrompt} Platform`;
  return {
    projectTitle: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    domain: "general_software",
    executiveObservation: `The CEO has analyzed your concept: "${ideaPrompt}". To deliver an enterprise-grade solution, we must define user personas, scalability benchmarks, and core integration dependencies.`,
    questions: [
      {
        id: "business_model",
        category: "Product Scope & Target Audience",
        question: "Which audience and business model is this platform primarily serving?",
        explanation: "Guides tenancy architecture, UX complexity, and authentication protocols.",
        options: [
          { id: "b2b_saas", label: "B2B Multi-Tenant SaaS (Subscriptions & Organizations)", description: "Workspaces, role-based access control, team member invites, and billing tiers.", isRecommended: true },
          { id: "b2c_consumer", label: "B2C Consumer Application (High Scale & Self-Serve)", description: "Frictionless onboarding, social auth, viral loops, and high-concurrency caching." },
          { id: "internal_enterprise", label: "Internal Operations / Enterprise Workflow Portal", description: "Single-sign-on (SSO/SAML), audit logging, and legacy system integration." },
        ],
      },
      {
        id: "architecture_scale",
        category: "Scalability & Performance Targets",
        question: "What is your target traffic volume and performance SLA?",
        explanation: "Determines database partitioning, Redis caching, and serverless/container deployment.",
        options: [
          { id: "mvp_fast", label: "Lean Fast MVP (<1,000 DAU, Sub-200ms Latency)", description: "Monolithic Next.js + PostgreSQL + Tailwind for maximum iteration speed.", isRecommended: true },
          { id: "high_scale", label: "High Concurrency Cluster (>50,000 DAU, Auto-scaling)", description: "Distributed microservices, Redis queues, and read-replica database pool." },
        ],
      },
      {
        id: "integrations_stack",
        category: "Core Third-Party Integrations",
        question: "Which third-party services and APIs are mandatory for V1 launch?",
        explanation: "Ensures OpenAPI contracts and webhook listeners are scaffolded upfront.",
        options: [
          { id: "auth_payments_notifications", label: "Auth (Google/OAuth) + Payments (Stripe/Razorpay) + Email/SMS Notifications", description: "Standard modern SaaS stack with transactional webhooks.", isRecommended: true },
          { id: "ai_realtime_analytics", label: "AI Model Ingestion + Real-time WebSockets + Advanced Analytics", description: "Live AI assistance, collaborative streaming, and behavioral event tracking." },
        ],
      },
    ],
  };
}
