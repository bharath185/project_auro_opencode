export interface CeoQuestionOption {
  id: string;
  label: string;
  description?: string;
  isRecommended?: boolean;
}

export interface CeoDiscoveryQuestion {
  id: string;
  category: string;
  question: string;
  explanation: string;
  options: CeoQuestionOption[];
}

export interface CeoConsultationAnalysis {
  projectTitle: string;
  domain: "saree_ecommerce" | "general_ecommerce" | "saas" | "marketplace" | "general_software";
  executiveObservation: string;
  questions: CeoDiscoveryQuestion[];
}

export function analyzeIdeaAndGenerateQuestions(ideaPrompt: string): CeoConsultationAnalysis {
  const normalized = ideaPrompt.toLowerCase();

  // Check if idea is specifically saree / apparel e-commerce
  const isSaree =
    normalized.includes("saree") ||
    normalized.includes("sari") ||
    normalized.includes("apparel") ||
    normalized.includes("clothing") ||
    normalized.includes("silk") ||
    normalized.includes("ethnic");

  const isEcom =
    isSaree ||
    normalized.includes("ecom") ||
    normalized.includes("ecommerce") ||
    normalized.includes("selling") ||
    normalized.includes("shop") ||
    normalized.includes("store") ||
    normalized.includes("cart");

  if (isSaree || isEcom) {
    return {
      projectTitle: isSaree ? "Sarees Selling E-Commerce Platform" : "Next-Gen E-Commerce Platform",
      domain: isSaree ? "saree_ecommerce" : "general_ecommerce",
      executiveObservation: isSaree
        ? "The CEO has analyzed your saree e-commerce initiative. Saree retail requires special attention to fabric texture visualization, custom blouse tailoring measurements, multi-currency NRI support, and high-conversion mobile checkout."
        : "The CEO has analyzed your e-commerce proposal. E-commerce platforms require clarity on catalog structure, transactional volume, payment integrations, and fulfillment logistics.",
      questions: [
        {
          id: "business_model",
          category: "Business Model & Target Segment",
          question: "Which e-commerce operating model best fits your venture?",
          explanation: "Defines whether we architect for retail end-customers, wholesale merchant orders, or a multi-vendor artisan collective.",
          options: [
            {
              id: "d2c_boutique",
              label: "D2C Direct-to-Consumer Boutique",
              description: "Curated premium handloom and festive collections sold directly to retail buyers.",
              isRecommended: true,
            },
            {
              id: "b2c_mass",
              label: "B2C Multi-Category Catalog",
              description: "High-volume daily wear and festive sarees sourced from multiple regional weavers.",
            },
            {
              id: "b2b_wholesale",
              label: "B2B Wholesale / Weaver-to-Retailer",
              description: "Bulk minimum-order quantities (MOQs), tiered merchant pricing, and GST invoicing.",
            },
            {
              id: "hybrid_d2c_b2b",
              label: "Hybrid (Retail Storefront + Wholesale Portal)",
              description: "Unified catalog with customer retail checkout and authenticated B2B bulk ordering.",
            },
          ],
        },
        {
          id: "customization_catalog",
          category: "Catalog & Tailoring Customization",
          question: "What customization and product variations should buyers be able to select?",
          explanation: "Determines database schema complexity for product attributes and custom service add-ons.",
          options: [
            {
              id: "blouse_fall_pico",
              label: "Custom Blouse Stitching & Fall/Pico Add-on",
              description: "Interactive sizing forms (bust, sleeve, neckline) + saree pre-pleating services.",
              isRecommended: true,
            },
            {
              id: "ready_unstitched",
              label: "Standard Unstitched Sarees Only",
              description: "Quick turnaround, standard saree length with running blouse piece (no custom tailoring).",
            },
            {
              id: "exclusive_handcrafted",
              label: "Single-Piece Handcrafted / Artisan Silk",
              description: "One-of-a-kind Silk Mark certified single SKU inventory with authenticity certificates.",
            },
          ],
        },
        {
          id: "payments_geography",
          category: "Geographical Market & Payment Gateways",
          question: "Where are your primary buyers located and what payment methods must be supported?",
          explanation: "Guides payment gateway selection, currency conversion engines, and tax compliance.",
          options: [
            {
              id: "india_upi_cod",
              label: "Domestic India (UPI, Cards & Cash on Delivery)",
              description: "Razorpay / Cashfree integration with PhonePe, GPay, Paytm, and COD OTP verification.",
              isRecommended: true,
            },
            {
              id: "global_nri",
              label: "Global NRI Diaspora (USD, GBP, AED, EUR)",
              description: "Stripe / PayPal multi-currency checkout with dynamic currency localization.",
            },
            {
              id: "omnichannel_global",
              label: "Omnichannel Global + Domestic India",
              description: "Full dual-rail payment stack: UPI/COD for India and Stripe for international orders.",
            },
          ],
        },
        {
          id: "discovery_features",
          category: "Customer Experience & Mobile Discovery",
          question: "What visual discovery and shopping features should we build into the MVP?",
          explanation: "Essential for boosting conversion rate and reducing return/exchange rates.",
          options: [
            {
              id: "video_reels_zoom",
              label: "Fabric Video Reels, 4K Macro Zoom & WhatsApp 1-Click Support",
              description: "Ultra-fast mobile viewing of saree drape texture, pallu details, and instant chat.",
              isRecommended: true,
            },
            {
              id: "ai_drape_preview",
              label: "AI Saree Drape Preview / Virtual Try-On",
              description: "AI-assisted visualization of how the saree looks on various body profiles and skin tones.",
            },
            {
              id: "occasion_matcher",
              label: "Occasion-Based Curations (Bridal, Office, Temple, Party)",
              description: "Smart moodboards, filter by color tone, silk weight, and price bracket.",
            },
          ],
        },
        {
          id: "fulfillment_logistics",
          category: "Logistics & Order Tracking",
          question: "How will shipping, packaging, and delivery tracking be automated?",
          explanation: "Ensures automated shipping label generation and webhook-driven tracking notifications.",
          options: [
            {
              id: "shiprocket_automated",
              label: "Shiprocket / Delhivery Automated API Integration",
              description: "Real-time shipping rate calculator, 1-click AWB generation, and SMS/WhatsApp live tracking.",
              isRecommended: true,
            },
            {
              id: "inhouse_dispatch",
              label: "In-House Dispatch & Manual Tracking",
              description: "Admin panel to manually assign tracking numbers and courier partner URLs.",
            },
          ],
        },
      ],
    };
  }

  // Generic / SaaS / Software analysis
  return {
    projectTitle: "Custom Digital Solution",
    domain: "general_software",
    executiveObservation: "The CEO has reviewed your concept. To architect an optimal engineering and product plan, please clarify target users, scalability requirements, and deployment preferences.",
    questions: [
      {
        id: "business_model",
        category: "Product Scope & Business Model",
        question: "What is the primary target user segment?",
        explanation: "Defines the core UX workflows and tenancy architecture.",
        options: [
          { id: "b2b_saas", label: "B2B Multi-Tenant SaaS (Subscription / Teams)", isRecommended: true },
          { id: "b2c_consumer", label: "B2C Consumer Application (High Scale / Self-Serve)" },
          { id: "internal_enterprise", label: "Internal Enterprise Tool / Operations Portal" },
        ],
      },
      {
        id: "architecture_scale",
        category: "Scalability & Performance Targets",
        question: "What is your target scale and traffic profile for launch?",
        explanation: "Guides database partitioning, caching layers, and cloud infrastructure.",
        options: [
          { id: "mvp_fast", label: "Lean MVP (<1,000 daily active users, sub-200ms latency)", isRecommended: true },
          { id: "enterprise_scale", label: "High Concurrency (>50,000 users, auto-scaling clusters)" },
        ],
      },
      {
        id: "integrations_stack",
        category: "Key Integrations & Infrastructure",
        question: "Which core integrations are mandatory for V1?",
        explanation: "Ensures OpenAPI contracts and third-party webhooks are planned upfront.",
        options: [
          { id: "auth_payments", label: "Auth (OAuth/SSO) + Payments (Stripe/Razorpay) + Email/SMS", isRecommended: true },
          { id: "ai_analytics", label: "AI Models (Gemini/DeepSeek) + Real-time WebSockets" },
        ],
      },
    ],
  };
}

export function compileCeoExecutiveBrief(
  ideaPrompt: string,
  answers: Record<string, string> = {},
  customProjectName?: string,
) {
  const analysis = analyzeIdeaAndGenerateQuestions(ideaPrompt);
  const projectName = customProjectName || analysis.projectTitle;

  const isSaree = analysis.domain === "saree_ecommerce";

  let problemStatement = "";
  let targetUsers = "";
  let goals = "";
  let preferredStack = "TypeScript, React / Next.js, Node.js, PostgreSQL, Redis, Docker, Tailwind CSS";
  let constraints = "Mobile-first responsive design, sub-200ms API response time, PCI-DSS / Razorpay compliance, automated image compression for fast loading.";

  if (isSaree) {
    const modelChoice = answers.business_model || "d2c_boutique";
    const customChoice = answers.customization_catalog || "blouse_fall_pico";
    const payChoice = answers.payments_geography || "india_upi_cod";
    const featChoice = answers.discovery_features || "video_reels_zoom";
    const logChoice = answers.fulfillment_logistics || "shiprocket_automated";

    problemStatement = `Selling authentic sarees online requires solving customer trust around fabric authenticity, drape visualization, and custom tailoring (blouse stitching and fall/pico). Existing generic e-commerce templates fail to provide high-definition fabric detail views, custom measurement capture, and seamless UPI / COD and global diaspora payments.`;

    targetUsers = `Ethnic wear enthusiasts, bridal & festive shoppers, NRI diaspora seeking authentic Indian handloom silk and designer sarees, and modern women looking for customized drape-ready sarees.`;

    goals = `1. Launch high-converting mobile-first Saree E-Commerce Storefront with instant sub-second search.\n2. Implement interactive Blouse Tailoring & Fall/Pico customization selector.\n3. Integrate dual-rail payments: Domestic UPI / Cards / COD (Razorpay) and International Multi-Currency (Stripe).\n4. Automate fulfillment logistics with Shiprocket / Delhivery courier API.\n5. Provide WhatsApp order updates, 4K fabric zoom, and fabric video reels.`;

    preferredStack = `Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion.\nBackend: Node.js / Express or Next.js Server Actions, PostgreSQL (Drizzle ORM), Redis (Cart & Session Cache).\nPayments: Razorpay (UPI, Netbanking, COD OTP) + Stripe (USD/GBP/AED).\nLogistics: Shiprocket API / Delhivery Webhooks.\nMedia: Cloudinary / S3 with auto-WebP conversion for high-res saree imagery.`;
  } else {
    problemStatement = `The market lacks an intuitive, robust digital solution for ${ideaPrompt}. Users struggle with disjointed workflows, slow load times, and poor collaboration.`;
    targetUsers = `Business professionals, team leads, and digital consumers demanding reliable, automated experiences.`;
    goals = `1. Deliver clean, responsive MVP with core transactional workflows.\n2. Ensure 99.9% uptime with automated testing and continuous deployment.\n3. Implement secure authentication, role-based permissions, and real-time alerts.`;
  }

  return {
    projectName,
    problem: problemStatement,
    targetUsers,
    goals,
    constraints,
    preferredStack,
    budget: "$25,000 - $50,000",
    deadline: "8 Weeks (4 Sprints)",
    teamSizeAndSkills: "1 Lead Full-Stack Architect, 2 Frontend/Mobile Engineers, 1 Backend/DB Engineer, 1 QA Specialist, 1 UI/UX Designer",
    executiveSummary: `CEO Directive: Build a high-performance, visually stunning ${projectName}. CTO will oversee architecture, database integrity, and payment/logistics APIs. PM will manage user story refinement, acceptance criteria, and sprint execution.`,
  };
}
