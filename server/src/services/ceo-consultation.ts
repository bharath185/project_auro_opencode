import {
  executeRealtimeCeoConsultation,
  dynamicSemanticCeoAnalysis,
  type LlmConfig,
} from "./realtime-llm.js";

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
  domain: string;
  executiveObservation: string;
  questions: CeoDiscoveryQuestion[];
}

/**
 * Synchronous fallback analysis
 */
export function analyzeIdeaAndGenerateQuestions(ideaPrompt: string): CeoConsultationAnalysis {
  return dynamicSemanticCeoAnalysis(ideaPrompt);
}

/**
 * Asynchronous Real-Time AI Consultation
 */
export async function analyzeIdeaAndGenerateQuestionsAsync(
  ideaPrompt: string,
  config?: LlmConfig,
): Promise<CeoConsultationAnalysis> {
  return executeRealtimeCeoConsultation(ideaPrompt, config);
}

export function compileCeoExecutiveBrief(
  ideaPrompt: string,
  answers: Record<string, string> = {},
  customProjectName?: string,
) {
  const analysis = dynamicSemanticCeoAnalysis(ideaPrompt);
  const projectName = customProjectName || analysis.projectTitle;
  const isSaree = analysis.domain === "saree_ecommerce";
  const isHealthcare = analysis.domain === "healthcare_telemed";
  const isFintech = analysis.domain === "fintech_banking";

  let problemStatement = "";
  let targetUsers = "";
  let goals = "";
  let preferredStack = "TypeScript, React 19, Next.js 15, Node.js, PostgreSQL, Redis, Docker, Tailwind CSS";
  let constraints = "Mobile-first responsive design, sub-200ms API response time, PCI-DSS / security compliance, automated image compression for fast loading.";

  if (isSaree) {
    problemStatement = `Selling authentic sarees online requires solving customer trust around fabric authenticity, drape visualization, and custom tailoring (blouse stitching and fall/pico). Existing generic e-commerce templates fail to provide high-definition fabric detail views, custom measurement capture, and seamless UPI / COD and global diaspora payments.`;

    targetUsers = `Ethnic wear enthusiasts, bridal & festive shoppers, NRI diaspora seeking authentic Indian handloom silk and designer sarees, and modern women looking for customized drape-ready sarees.`;

    goals = `1. Launch high-converting mobile-first Saree E-Commerce Storefront with instant sub-second search.\n2. Implement interactive Blouse Tailoring & Fall/Pico customization selector.\n3. Integrate dual-rail payments: Domestic UPI / Cards / COD (Razorpay) and International Multi-Currency (Stripe).\n4. Automate fulfillment logistics with Shiprocket / Delhivery courier API.\n5. Provide WhatsApp order updates, 4K fabric zoom, and fabric video reels.`;

    preferredStack = `Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion.\nBackend: Node.js / Express or Next.js Server Actions, PostgreSQL (Drizzle ORM), Redis (Cart & Session Cache).\nPayments: Razorpay (UPI, Netbanking, COD OTP) + Stripe (USD/GBP/AED).\nLogistics: Shiprocket API / Delhivery Webhooks.\nMedia: Cloudinary / S3 with auto-WebP conversion for high-res saree imagery.`;
  } else if (isHealthcare) {
    problemStatement = `Healthcare clinics face fragmented patient appointment scheduling, missing electronic health records (EHR), and non-compliant communication channels that risk patient data privacy.`;
    targetUsers = `Patients seeking doctors, multi-specialty clinics, OPD specialists, and administrative front-desk staff.`;
    goals = `1. Deliver automated doctor appointment scheduling with zero double-booking.\n2. Provide encrypted patient EHR records with digital prescription generation.\n3. Integrate WebRTC video consultations and WhatsApp appointment reminders.\n4. Enforce HIPAA / ABDM data encryption at rest and in transit.`;
    preferredStack = `Frontend: Next.js 15, React 19, Tailwind CSS, WebRTC.\nBackend: Node.js, Express, PostgreSQL, Redis.\nIntegrations: Twilio/Agora Video, Razorpay, WhatsApp Business API.`;
  } else if (isFintech) {
    problemStatement = `Modern digital financial services require immutable ledger accounting, real-time transaction processing, and automated KYC/AML fraud prevention without sacrificing consumer conversion speed.`;
    targetUsers = `Retail consumers, micro-businesses, credit underwriters, and compliance officers.`;
    goals = `1. Implement double-entry immutable financial ledger with cryptographic audit trail.\n2. Provide instant video KYC and government ID verification under 60 seconds.\n3. Integrate multi-rail payment gateways (UPI, NACH, Credit Cards, Wire).\n4. Build automated risk scoring and rule-based fraud detection engine.`;
    preferredStack = `Frontend: Next.js 15, React 19, Tailwind CSS.\nBackend: Node.js, Express, PostgreSQL (Append-Only Ledger), Redis.\nIntegrations: Aadhaar/PAN Verification API, Razorpay/Stripe, SMS Webhooks.`;
  } else {
    problemStatement = `The market lacks an intuitive, robust digital solution for ${ideaPrompt}. Users struggle with disjointed workflows, slow load times, and poor collaboration.`;
    targetUsers = `Business professionals, team leads, and digital consumers demanding reliable, automated experiences.`;
    goals = `1. Deliver clean, responsive MVP with core transactional workflows.\n2. Ensure 99.9% uptime with automated testing and continuous deployment.\n3. Implement secure authentication, role-based permissions, and real-time alerts.`;
  }

  // Incorporate specific user answers if provided
  const answersList = Object.entries(answers).map(([k, v]) => `- **${k}**: ${v}`).join("\n");
  if (answersList) {
    constraints += `\n\n### User Selected Specifications:\n${answersList}`;
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
