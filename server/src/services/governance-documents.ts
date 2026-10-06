/**
 * Project Auro - Governance Document Pack Definitions, Templates, and Validators
 * 
 * Defines the 12 canonical project governance documents:
 * 1. Charter / Vision (CEO)
 * 2. PRD (PM)
 * 3. Architecture + ADRs (CTO)
 * 4. Tech Stack (CTO)
 * 5. DB/ER + OpenAPI (CTO / DevOps)
 * 6. Execution Plan + Timeline (PM / CEO)
 * 7. Sprint Plan (PM)
 * 8. Team Allocation Sheet (CEO / PM)
 * 9. Test Strategy + QA Checklist (QA)
 * 10. CI/CD + Infra (DevOps)
 * 11. Threat Model + Security Requirements (Security)
 * 12. Risk Register + RACI Matrix (CEO / Security)
 */

export const GOVERNANCE_DOCUMENT_KINDS = [
  "charter",
  "prd",
  "architecture",
  "tech_stack",
  "db_openapi",
  "execution_plan",
  "sprint_plan",
  "team_allocation",
  "test_strategy",
  "cicd_infra",
  "threat_model",
  "risk_raci",
] as const;

export type GovernanceDocumentKind = (typeof GOVERNANCE_DOCUMENT_KINDS)[number];

export interface DocumentSectionRequirement {
  id: string;
  heading: string;
  aliases?: string[];
  description: string;
}

export interface GovernanceDocumentDefinition {
  kind: GovernanceDocumentKind;
  title: string;
  fileName: string;
  authorRole: "ceo" | "cto" | "pm" | "qa" | "devops" | "security";
  reviewerRoles: Array<"ceo" | "cto" | "pm" | "qa" | "devops" | "security">;
  requiredSections: DocumentSectionRequirement[];
  templateGenerator: (context: GovernanceProjectContext) => string;
}

export interface GovernanceProjectContext {
  projectName: string;
  problem: string;
  targetUsers: string;
  goals: string;
  constraints?: string;
  budget?: string;
  deadline?: string;
  preferredStack?: string;
  integrations?: string;
  teamSize?: string;
  teamSkills?: string;
  isDemo?: boolean;
}

export interface DocumentVersion {
  version: number;
  content: string;
  authorRole: string;
  changeSummary: string;
  createdAt: string;
}

export interface DocumentReview {
  id: string;
  reviewerRole: "ceo" | "cto" | "pm" | "qa" | "devops" | "security";
  status: "approved" | "changes_requested" | "pending";
  comments: string;
  createdAt: string;
}

export interface GovernanceDocumentRecord {
  id: string;
  kind: GovernanceDocumentKind;
  title: string;
  fileName: string;
  currentVersion: number;
  status: "draft" | "in_review" | "approved";
  versions: DocumentVersion[];
  reviews: DocumentReview[];
  metadata?: Record<string, unknown>;
}

export const GOVERNANCE_DOC_DEFINITIONS: Record<GovernanceDocumentKind, GovernanceDocumentDefinition> = {
  charter: {
    kind: "charter",
    title: "Project Charter & Vision",
    fileName: "CHARTER.md",
    authorRole: "ceo",
    reviewerRoles: ["cto", "pm"],
    requiredSections: [
      { id: "exec_summary", heading: "Executive Summary", aliases: ["Executive Summary", "Project Summary"], description: "High level project overview" },
      { id: "problem_statement", heading: "Problem Statement", aliases: ["Problem Statement", "Problem"], description: "Core problem being solved" },
      { id: "target_users", heading: "Target Users & Stakeholders", aliases: ["Target Users", "Target Audience", "Target Users & Stakeholders"], description: "User personas and stakeholders" },
      { id: "strategic_goals", heading: "Strategic Goals & Success Metrics", aliases: ["Strategic Goals", "Goals & Metrics", "Success Metrics"], description: "Key objectives and measurable KPIs" },
      { id: "scope_boundaries", heading: "Scope & Non-Goals", aliases: ["Scope & Non-Goals", "Scope Boundaries", "In Scope & Out of Scope"], description: "What is explicitly in and out of scope" },
    ],
    templateGenerator: (ctx) => `# Project Charter & Vision: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Executive Summary
${ctx.projectName} is designed to deliver a modern, autonomous solution for ${ctx.problem.slice(0, 100)}...

## Problem Statement
${ctx.problem}

## Target Users & Stakeholders
- Primary Audience: ${ctx.targetUsers}
- Key Stakeholders: Executive leadership, product team, and engineering organization.

## Strategic Goals & Success Metrics
- Goals: ${ctx.goals}
- Budget Target: ${ctx.budget || "Standard allocation"}
- Target Timeline: ${ctx.deadline || "TBD"}

## Scope & Non-Goals
### In Scope
- Core workflow automation, project governance pack, agent orchestration.
### Non-Goals
- Legacy on-premise mainframe integrations without API access.
`,
  },

  prd: {
    kind: "prd",
    title: "Product Requirements Document (PRD)",
    fileName: "PRD.md",
    authorRole: "pm",
    reviewerRoles: ["ceo", "qa", "cto"],
    requiredSections: [
      { id: "overview", heading: "Product Overview", aliases: ["Product Overview", "Overview"], description: "Product concept and vision" },
      { id: "user_journeys", heading: "User Journeys & Use Cases", aliases: ["User Journeys", "Use Cases", "User Journeys & Use Cases"], description: "Step-by-step user workflows" },
      { id: "functional_reqs", heading: "Functional Requirements", aliases: ["Functional Requirements", "Functional Specs"], description: "Detailed feature requirements" },
      { id: "non_functional_reqs", heading: "Non-Functional Requirements", aliases: ["Non-Functional Requirements", "NFRs", "System Quality Attributes"], description: "Performance, security, availability" },
      { id: "acceptance_criteria", heading: "Acceptance Criteria", aliases: ["Acceptance Criteria", "Definition of Done"], description: "Sign-off rules for release" },
    ],
    templateGenerator: (ctx) => {
      const isSaree = ctx.projectName.toLowerCase().includes("saree") || ctx.problem.toLowerCase().includes("saree");
      return `# Product Requirements Document: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Product Overview
${ctx.projectName} addresses critical operational requirements for ${ctx.targetUsers}.

## User Journeys & Use Cases
${isSaree ? `1. **Visual Discovery**: Buyer browses silk, cotton, and handloom sarees with 4K texture zoom and drape video reels.
2. **Custom Sizing & Tailoring**: Buyer selects matching blouse stitching with custom bust, waist, and neck measurements + fall/pico toggle.
3. **Dual-Rail Checkout**: India domestic buyers pay via UPI/COD with OTP verification; NRI diaspora buyers checkout in USD/GBP/AED via Stripe.
4. **Automated Courier Dispatch**: Orders trigger Shiprocket / Delhivery courier API for instant AWB generation and live WhatsApp updates.` : `1. **Kickoff Flow**: User inputs project constraints and triggers full governance pack.
2. **Review & Refinement**: Agents cross-review generated artifacts and resolve feedback in-thread.
3. **Delivery Hand-off**: Approved sprint tickets are exported to Jira / XLSX.`}

## Functional Requirements
${isSaree ? `- **FR-1 (Catalog & Media)**: High-resolution multi-angle image gallery with 4K macro zoom and video reels.
- **FR-2 (Customization Engine)**: Interactive blouse tailoring measurement capture (bust, waist, sleeve, neck) and fall/pico service add-ons.
- **FR-3 (Payment Gateways)**: Razorpay integration for domestic UPI/Netbanking/COD and Stripe for international multi-currency transactions.
- **FR-4 (Automated Logistics)**: Shiprocket API integration for real-time shipping rates and automated AWB generation.` : `- **FR-1 (Kickoff)**: Capture project metadata, team skills (${ctx.teamSkills || "N/A"}), and constraints.
- **FR-2 (Orchestration)**: CEO delegates workstreams to CTO, PM, QA, DevOps, and Security.
- **FR-3 (Document Generation)**: Produce all 12 validated governance artifacts.`}

## Non-Functional Requirements
- **Performance**: Sub-200ms API response time and CDN cached asset delivery under 1s.
- **Reliability**: 99.9% uptime with automated database backups and fallback mechanisms.
- **Security**: PCI-DSS payment compliance and HTTPS/TLS encryption.

## Acceptance Criteria
- [ ] All 12 documents pass section validator checks.
- [ ] Cross-reviews completed and signed off.
- [ ] Final document pack approved by CEO.
`;
    },
  },

  architecture: {
    kind: "architecture",
    title: "System Architecture & ADRs",
    fileName: "ARCHITECTURE.md",
    authorRole: "cto",
    reviewerRoles: ["security", "devops", "ceo"],
    requiredSections: [
      { id: "arch_overview", heading: "Architecture Overview", aliases: ["Architecture Overview", "System Overview"], description: "High-level topology" },
      { id: "mermaid_diagram", heading: "System Component Diagram (Mermaid)", aliases: ["System Component Diagram", "Mermaid Diagram", "Component Diagram"], description: "Mermaid architecture diagram" },
      { id: "data_flow", heading: "Data Flow & Integration Points", aliases: ["Data Flow", "Data Flow & Integration Points"], description: "Communication protocols and data flows" },
      { id: "adrs", heading: "Architectural Decision Records (ADRs)", aliases: ["Architectural Decision Records", "ADRs", "ADR-001"], description: "Key architectural trade-offs and decisions" },
    ],
    templateGenerator: (ctx) => {
      const isSaree = ctx.projectName.toLowerCase().includes("saree") || ctx.problem.toLowerCase().includes("saree");
      return `# System Architecture & ADRs: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Architecture Overview
The system architecture is structured around high-performance API services, edge CDN media caching, relational PostgreSQL persistence, and asynchronous worker queues.

## System Component Diagram (Mermaid)
\`\`\`mermaid
flowchart TD
  Client[Mobile & Web Storefront Next.js 15] --> Gateway[API Gateway & Auth Layer]
  Gateway --> CatalogSvc[Catalog & Saree Media Engine]
  Gateway --> CustomSvc[Blouse Customization & Measurements]
  Gateway --> OrderSvc[Order & Checkout Engine]
  Gateway --> LogisticsSvc[Shiprocket Courier Dispatch]
  OrderSvc --> Razorpay[Razorpay UPI / Cards / COD]
  OrderSvc --> Stripe[Stripe NRI Multi-Currency]
  CatalogSvc --> Cloudinary[Cloudinary CDN 4K Media]
  OrderSvc --> DB[(PostgreSQL Database)]
  LogisticsSvc --> ShiprocketAPI[Shiprocket API / Delhivery]
\`\`\`

## Data Flow & Integration Points
- **Payments**: Razorpay (Domestic UPI, Netbanking, COD OTP) + Stripe (International Multi-Currency).
- **Logistics**: Shiprocket REST API with webhook listeners for status updates (Dispatched, In-Transit, Out for Delivery, Delivered).
- **Media CDN**: Cloudinary / S3 with automatic WebP conversion for high-res saree imagery.

## Architectural Decision Records (ADRs)
### ADR-001: Next.js 15 App Router & Server Components for Fast Catalog Rendering
- **Context**: Saree e-commerce requires fast SEO indexing and instantaneous page loads.
- **Decision**: Use Next.js 15 Server Components for catalog pages with client-side interactive tailoring forms.
- **Consequences**: Optimal Core Web Vitals and lightning-fast mobile shopping experience.

### ADR-002: Dual-Rail Payment Gateway Architecture
- **Context**: Domestic shoppers prefer UPI and COD; international shoppers require USD/EUR Stripe checkout.
- **Decision**: Implement dynamic currency detection and route orders to Razorpay or Stripe based on locale.
- **Consequences**: Maximized checkout conversion across both Indian and NRI diaspora demographics.
`;
    },
  },

  tech_stack: {
    kind: "tech_stack",
    title: "Technology Stack & Justification",
    fileName: "TECH_STACK.md",
    authorRole: "cto",
    reviewerRoles: ["devops", "pm"],
    requiredSections: [
      { id: "stack_summary", heading: "Stack Summary Matrix", aliases: ["Stack Summary Matrix", "Stack Summary", "Technology Stack"], description: "Table of technologies by layer" },
      { id: "frontend_backend", heading: "Frontend & Backend Rationale", aliases: ["Frontend & Backend Rationale", "Frontend and Backend"], description: "Framework and language selection" },
      { id: "database_storage", heading: "Database & Storage Layer", aliases: ["Database & Storage Layer", "Database and Storage", "Storage"], description: "Data persistence and caching" },
      { id: "dependencies_licensing", heading: "Third-Party Dependencies & Licensing", aliases: ["Third-Party Dependencies & Licensing", "Dependencies & Licensing", "Dependencies"], description: "Library vetting and licenses" },
    ],
    templateGenerator: (ctx) => `# Technology Stack & Justification: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Stack Summary Matrix
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React 19 + Next.js 15 + Tailwind CSS | Next.js 15 / React 19 | Responsive, mobile-first storefront |
| Backend | Node.js 24 + Express / Next.js Server Actions | Node.js 24 | High-throughput transactional APIs |
| Database | PostgreSQL + Drizzle ORM | Postgres 16 | Relational consistency & schema migrations |
| Cache & Queue | Redis | Redis 7 | Cart sessions & checkout mutex locks |
| Payments | Razorpay + Stripe | Latest SDK | Dual-rail domestic & international checkout |
| Logistics | Shiprocket API | REST v2 | Automated courier label & tracking generation |

## Frontend & Backend Rationale
- Selection based on project requirements: ${ctx.preferredStack || "Modern full-stack TypeScript"}.
- Shared type packages ensure end-to-end type safety between client and server.

## Database & Storage Layer
- Relational schema managed with strict migration numbering and tenant isolation checks.
- Artifacts and document versions stored with immutable history hashes.

## Third-Party Dependencies & Licensing
- All core dependencies use permissive licenses (MIT / Apache-2.0 / BSD).
`,
  },

  db_openapi: {
    kind: "db_openapi",
    title: "Database Schema (ER) & OpenAPI Specification",
    fileName: "DB_OPENAPI.md",
    authorRole: "cto",
    reviewerRoles: ["devops", "security"],
    requiredSections: [
      { id: "er_diagram", heading: "Entity-Relationship (ER) Diagram (Mermaid)", aliases: ["Entity-Relationship Diagram", "ER Diagram", "Entity-Relationship (ER) Diagram (Mermaid)"], description: "Mermaid ER diagram" },
      { id: "data_dictionary", heading: "Data Dictionary & Tables", aliases: ["Data Dictionary & Tables", "Data Dictionary", "Table Definitions"], description: "Field specifications and constraints" },
      { id: "openapi_spec", heading: "OpenAPI 3.0 REST Specification Draft", aliases: ["OpenAPI Specification", "OpenAPI 3.0 REST Specification Draft", "OpenAPI Spec"], description: "API endpoints, request/response models" },
    ],
    templateGenerator: (ctx) => {
      const isSaree = ctx.projectName.toLowerCase().includes("saree") || ctx.problem.toLowerCase().includes("saree");
      return `# Database Schema (ER) & OpenAPI Specification: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Entity-Relationship (ER) Diagram (Mermaid)
\`\`\`mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEMS : contains
  SAREES ||--o{ FABRIC_VARIANTS : has
  ORDER_ITEMS ||--o{ BLOUSE_CUSTOMIZATIONS : includes
  ORDERS ||--|| SHIPMENTS : tracks
  ORDERS ||--|| PAYMENTS : processes

  SAREES {
    uuid id PK
    string title
    string fabric_type
    string weave_origin
    boolean silk_mark_certified
    numeric price_inr
    numeric price_usd
  }
  BLOUSE_CUSTOMIZATIONS {
    uuid id PK
    uuid order_item_id FK
    numeric bust_inches
    numeric waist_inches
    numeric sleeve_length_inches
    string front_neck_design
    string back_neck_design
    boolean fall_pico_included
  }
  ORDERS {
    uuid id PK
    uuid user_id FK
    string status
    string currency
    numeric total_amount
    string payment_rail
  }
  SHIPMENTS {
    uuid id PK
    uuid order_id FK
    string courier_name
    string awb_number
    string tracking_status
  }
\`\`\`

## Data Dictionary & Tables
- **sarees**: Master catalog with weave origin, fabric composition, Silk Mark authenticity, and pricing.
- **blouse_measurements / customizations**: Customer-submitted tailoring specifications (bust, waist, sleeve, neckline) and fall/pico selections.
- **orders & order_items**: Multi-currency transactional records linking sarees, tailoring add-ons, and payment status.
- **shipments**: Automated courier tracking with Shiprocket/Delhivery AWB numbers and delivery status.

## OpenAPI 3.0 REST Specification Draft
\`\`\`yaml
openapi: 3.0.3
info:
  title: ${ctx.projectName} API
  version: 1.0.0
paths:
  /api/sarees:
    get:
      summary: List filtered saree catalog (by fabric, weave, occasion)
      responses:
        '200':
          description: List of available sarees
  /api/customizations/blouse:
    post:
      summary: Submit custom blouse tailoring measurements
      responses:
        '201':
          description: Tailoring configuration saved
  /api/checkout/razorpay:
    post:
      summary: Initiate Razorpay payment session (UPI / Card / COD)
      responses:
        '200':
          description: Razorpay order ID and checkout payload
  /api/logistics/shiprocket/track/{awb}:
    get:
      summary: Real-time courier tracking by AWB
      responses:
        '200':
          description: Live shipping status
\`\`\`
`;
    },
  },

  execution_plan: {
    kind: "execution_plan",
    title: "Execution Plan & Timeline",
    fileName: "EXECUTION_PLAN.md",
    authorRole: "pm",
    reviewerRoles: ["ceo", "cto"],
    requiredSections: [
      { id: "phases_milestones", heading: "Project Phases & Major Milestones", aliases: ["Project Phases & Major Milestones", "Project Phases", "Milestones"], description: "Phase breakdown" },
      { id: "timeline_gantt", heading: "Timeline & Critical Path", aliases: ["Timeline & Critical Path", "Timeline", "Critical Path"], description: "Timeline chart and critical path dependencies" },
      { id: "resource_capacity", heading: "Resource Requirements & Capacity", aliases: ["Resource Requirements & Capacity", "Resource Requirements", "Capacity Planning"], description: "Staffing and compute resources" },
    ],
    templateGenerator: (ctx) => `# Execution Plan & Timeline: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Project Phases & Major Milestones
- **Phase 1: Architecture & Foundation** (Weeks 1-2) — Database schema, media pipeline, and core catalog APIs.
- **Phase 2: Storefront & Customization Engine** (Weeks 3-4) — Mobile-first UI, 4K zoom, and blouse tailoring forms.
- **Phase 3: Payments & Logistics Automation** (Weeks 5-6) — Razorpay UPI/COD + Stripe checkout & Shiprocket dispatch.
- **Phase 4: QA, Security & Launch** (Weeks 7-8) — End-to-end testing, payment verification, and production release.

## Timeline & Critical Path
- Critical Path: Database & Catalog API -> Tailoring Form -> Payment Gateway Integration -> Courier Dispatch Webhooks.

## Resource Requirements & Capacity
- Budget: ${ctx.budget || "$25,000 - $50,000"}
- Team: 1 Lead Architect, 2 Frontend Engineers, 1 Backend Engineer, 1 QA Specialist.
`,
  },

  sprint_plan: {
    kind: "sprint_plan",
    title: "Sprint Plan & Backlog Breakdown",
    fileName: "SPRINT_PLAN.md",
    authorRole: "pm",
    reviewerRoles: ["cto", "qa"],
    requiredSections: [
      { id: "sprint_cadence", heading: "Sprint Cadence & Ceremonies", aliases: ["Sprint Cadence & Ceremonies", "Sprint Cadence", "Ceremonies"], description: "Sprint length and rituals" },
      { id: "backlog_epics", heading: "Backlog Structure & Epics", aliases: ["Backlog Structure & Epics", "Backlog Epics", "Epics"], description: "Epics and user stories" },
      { id: "sprint_allocations", heading: "Sprint Allocation Matrix", aliases: ["Sprint Allocation Matrix", "Sprint Allocations", "Sprint Schedule"], description: "Stories assigned to sprints" },
    ],
    templateGenerator: (ctx) => `# Sprint Plan & Backlog Breakdown: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Sprint Cadence & Ceremonies
- Two-week sprint cycles with daily standups, weekly grooming, and sprint demos.

## Backlog Structure & Epics
- **Epic 1: Catalog & Media Pipeline** — Saree attributes, Silk Mark tags, 4K zoom.
- **Epic 2: Tailoring & Customization** — Blouse measurement capture and fall/pico options.
- **Epic 3: Dual-Rail Payments** — Razorpay UPI/COD & Stripe NRI payments.
- **Epic 4: Logistics & Tracking** — Shiprocket API integration and WhatsApp updates.

## Sprint Allocation Matrix
- **Sprint 1**: Database migrations, Saree catalog models, Cloudinary media CDN.
- **Sprint 2**: Mobile storefront, blouse measurement wizard, cart calculations.
- **Sprint 3**: Payment gateways (Razorpay + Stripe), Shiprocket courier integration.
- **Sprint 4**: Automated E2E testing, security hardening, production deployment.
`,
  },

  team_allocation: {
    kind: "team_allocation",
    title: "Team Allocation & Capacity Sheet",
    fileName: "TEAM_ALLOCATION.md",
    authorRole: "ceo",
    reviewerRoles: ["pm", "cto"],
    requiredSections: [
      { id: "org_structure", heading: "Team Structure & Key Roles", aliases: ["Team Structure & Key Roles", "Team Structure", "Key Roles"], description: "Leadership and engineering roles" },
      { id: "capacity_matrix", heading: "Capacity & Allocation Matrix", aliases: ["Capacity & Allocation Matrix", "Capacity Matrix", "Allocation Matrix"], description: "FTE allocations" },
      { id: "skill_requirements", heading: "Skill Requirements & Gaps", aliases: ["Skill Requirements & Gaps", "Skill Requirements", "Skills"], description: "Required proficiencies" },
    ],
    templateGenerator: (ctx) => `# Team Allocation & Capacity Sheet: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Team Structure & Key Roles
- **CEO**: Strategic oversight and business milestone validation.
- **CTO / Lead Architect**: System architecture, database integrity, and third-party integrations.
- **Lead Frontend Engineer**: Next.js 15 UI, tailoring configurator, and mobile responsiveness.
- **Lead Backend Engineer**: API routes, payment gateway webhooks, and courier dispatch.
- **QA Automation Lead**: Automated test suites and regression testing.

## Capacity & Allocation Matrix
| Role | Headcount | Allocation | Focus Area |
|---|---|---|---|
| Lead Architect / CTO | 1 | 100% | Architecture, DB, Security |
| Frontend Engineers | 2 | 100% | Storefront, Customization UI |
| Backend Engineer | 1 | 100% | Payments, Orders, Logistics |
| QA Engineer | 1 | 100% | Automated Test Suites |

## Skill Requirements & Gaps
- React 19 / Next.js 15 App Router, TypeScript, PostgreSQL, Drizzle ORM, Razorpay SDK, Shiprocket API.
`,
  },

  test_strategy: {
    kind: "test_strategy",
    title: "Test Strategy & QA Checklist",
    fileName: "TEST_STRATEGY.md",
    authorRole: "qa",
    reviewerRoles: ["cto", "devops"],
    requiredSections: [
      { id: "testing_levels", heading: "Testing Levels & Scope", aliases: ["Testing Levels & Scope", "Testing Levels", "Scope of Testing"], description: "Unit, integration, E2E" },
      { id: "qa_checklist", heading: "Pre-Release QA Checklist", aliases: ["Pre-Release QA Checklist", "QA Checklist", "Release Checklist"], description: "Verification checklist" },
      { id: "automation_coverage", heading: "Test Automation & Coverage Targets", aliases: ["Test Automation & Coverage Targets", "Coverage Targets", "Automation"], description: "Target test metrics" },
    ],
    templateGenerator: (ctx) => `# Test Strategy & QA Checklist: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Testing Levels & Scope
- **Unit Tests**: Vitest suite for pricing calculations, tailoring measurement validation, and cart totals.
- **Integration Tests**: Razorpay webhook validation, Shiprocket order creation, and database transactions.
- **End-to-End (E2E) Tests**: Playwright scripts simulating customer discovery -> blouse customization -> checkout -> order tracking.

## Pre-Release QA Checklist
- [ ] Product catalog filters work across all fabric and price tags.
- [ ] Blouse tailoring measurements validate min/max boundaries correctly.
- [ ] Razorpay test webhook updates order state to \`paid\` atomically.
- [ ] Shiprocket mock tracking returns live status progression.

## Test Automation & Coverage Targets
- Minimum 85% unit test code coverage on business logic and checkout services.
`,
  },

  cicd_infra: {
    kind: "cicd_infra",
    title: "CI/CD Pipeline & Infrastructure Spec",
    fileName: "INFRA_SPEC.md",
    authorRole: "devops",
    reviewerRoles: ["cto", "security"],
    requiredSections: [
      { id: "infra_topology", heading: "Infrastructure Topology & Cloud Providers", aliases: ["Infrastructure Topology & Cloud Providers", "Infrastructure Topology", "Cloud Providers"], description: "Server and cloud spec" },
      { id: "cicd_pipeline", heading: "CI/CD Pipeline Architecture", aliases: ["CI/CD Pipeline Architecture", "CI/CD Pipeline", "Pipeline"], description: "Deployment workflows" },
      { id: "monitoring_telemetry", heading: "Monitoring, Alerting & Health Probes", aliases: ["Monitoring, Alerting & Health Probes", "Monitoring & Alerting", "Health Probes"], description: "Observability stack" },
    ],
    templateGenerator: (ctx) => `# CI/CD Pipeline & Infrastructure Spec: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Infrastructure Topology & Cloud Providers
- **Compute**: Containerized Node.js services on AWS ECS / DigitalOcean Kubernetes.
- **Database**: Managed PostgreSQL with automated daily snapshot backups.
- **CDN**: Cloudflare / Cloudinary for global edge caching of high-resolution saree images.

## CI/CD Pipeline Architecture
- GitHub Actions workflow: Lint -> Typecheck -> Vitest Suite -> Docker Build -> Automated Staging Deploy.

## Monitoring, Alerting & Health Probes
- Health check endpoint at \`/api/health\`.
- Sentry error monitoring and Discord/Slack alerts on critical payment errors.
`,
  },

  threat_model: {
    kind: "threat_model",
    title: "Threat Model & Security Requirements",
    fileName: "THREAT_MODEL.md",
    authorRole: "security",
    reviewerRoles: ["cto", "ceo"],
    requiredSections: [
      { id: "threat_surface", heading: "Attack Surface & Threat Modeling (STRIDE)", aliases: ["Attack Surface & Threat Modeling (STRIDE)", "Threat Surface", "STRIDE Model"], description: "STRIDE analysis" },
      { id: "security_controls", heading: "Security Controls & Data Protection", aliases: ["Security Controls & Data Protection", "Security Controls", "Data Protection"], description: "Encryption and authentication" },
      { id: "incident_response", heading: "Incident Response & Vulnerability Management", aliases: ["Incident Response & Vulnerability Management", "Incident Response", "Vulnerability Management"], description: "Triage protocol" },
    ],
    templateGenerator: (ctx) => `# Threat Model & Security Requirements: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Attack Surface & Threat Modeling (STRIDE)
- **Spoofing**: Enforce signed webhook secrets for Razorpay and Shiprocket callbacks.
- **Tampering**: Validate pricing on server-side; client price tampering is strictly prevented.
- **Information Disclosure**: Encrypt customer delivery addresses and phone numbers.
- **Denial of Service**: Rate-limiting on checkout and SMS OTP endpoints.

## Security Controls & Data Protection
- HTTPS/TLS 1.3 enforced across all endpoints.
- CSRF tokens and Content Security Policy (CSP) headers active.

## Incident Response & Vulnerability Management
- Immediate hotfix pipeline for P0 security vulnerabilities within 4 hours.
`,
  },

  risk_raci: {
    kind: "risk_raci",
    title: "Risk Register & RACI Governance Matrix",
    fileName: "RISK_RACI.md",
    authorRole: "ceo",
    reviewerRoles: ["cto", "pm"],
    requiredSections: [
      { id: "risk_register", heading: "Risk Register & Mitigation Strategies", aliases: ["Risk Register & Mitigation Strategies", "Risk Register", "Risks & Mitigations"], description: "Identified risks and plans" },
      { id: "raci_matrix", heading: "RACI Governance Matrix", aliases: ["RACI Governance Matrix", "RACI Matrix", "Governance Matrix"], description: "Role responsibility mapping" },
      { id: "compliance_audit", heading: "Compliance, Audit & Governance Sign-Off", aliases: ["Compliance, Audit & Governance Sign-Off", "Compliance & Audit", "Governance Sign-Off"], description: "Audit trail and approval" },
    ],
    templateGenerator: (ctx) => `# Risk Register & RACI Governance Matrix: ${ctx.projectName}
${ctx.isDemo ? "> **Notice: Generated in Demo Mode**\n" : ""}
## Risk Register & Mitigation Strategies
| Risk ID | Description | Severity | Mitigation Strategy |
|---|---|---|---|
| R-01 | Custom tailoring measurement mismatch causing returns | High | Mandatory interactive sizing guide with photo references and WhatsApp confirmation |
| R-02 | Payment gateway webhook drops during high festive sales | High | Idempotent transaction verification and automated reconciliation job |
| R-03 | Courier dispatch delays during peak seasons | Medium | Multi-carrier load balancing across Shiprocket and Delhivery |

## RACI Governance Matrix
| Milestone / Deliverable | CEO | CTO | PM | QA | DevOps | Security |
|---|---|---|---|---|---|---|
| Charter & Business Model | **A/R** | C | C | I | I | I |
| System Architecture & DB | I | **A/R** | C | C | C | C |
| Product PRD & Sprints | I | C | **A/R** | C | I | I |
| Test Suites & Quality Sign-Off | I | C | C | **A/R** | I | I |
| Infrastructure & Deployment | I | C | I | I | **A/R** | C |

## Compliance, Audit & Governance Sign-Off
- Signed off by CEO and CTO. All changes logged to immutable audit trail.
`,
  },
};

/**
 * Validates whether a markdown document contains all required sections for its kind.
 */
export function validateGovernanceDocument(
  kind: GovernanceDocumentKind,
  content: string,
): { valid: boolean; missingSections: string[]; foundSections: string[] } {
  const definition = GOVERNANCE_DOC_DEFINITIONS[kind];
  if (!definition) {
    return { valid: false, missingSections: [`Unknown document kind: ${kind}`], foundSections: [] };
  }

  const foundSections: string[] = [];
  const missingSections: string[] = [];

  const lines = content.split("\n");
  const headings = lines
    .filter((l) => l.trim().startsWith("#"))
    .map((l) => l.replace(/^#+\s*/, "").trim().toLowerCase());

  for (const req of definition.requiredSections) {
    const candidates = [req.heading, ...(req.aliases || [])].map((h) => h.toLowerCase());
    const matched = headings.some((h) =>
      candidates.some((c) => h.includes(c) || c.includes(h))
    );

    if (matched) {
      foundSections.push(req.heading);
    } else {
      missingSections.push(req.heading);
    }
  }

  return {
    valid: missingSections.length === 0,
    missingSections,
    foundSections,
  };
}

/**
 * Generates the complete 12-document governance pack for a project context.
 */
export function generateGovernanceDocumentPack(
  ctx: GovernanceProjectContext,
): Record<GovernanceDocumentKind, { kind: GovernanceDocumentKind; title: string; fileName: string; authorRole: string; content: string; isValid: boolean; missingSections: string[] }> {
  const pack: any = {};

  for (const kind of GOVERNANCE_DOCUMENT_KINDS) {
    const def = GOVERNANCE_DOC_DEFINITIONS[kind];
    const content = def.templateGenerator(ctx);
    const validation = validateGovernanceDocument(kind, content);

    pack[kind] = {
      kind,
      title: def.title,
      fileName: def.fileName,
      authorRole: def.authorRole,
      content,
      isValid: validation.valid,
      missingSections: validation.missingSections,
    };
  }

  return pack;
}

export interface DynamicSprintStory {
  id: string;
  epic: string;
  summary: string;
  issueType: "Story" | "Task" | "Bug" | "Epic";
  description: string;
  priority: "Highest" | "High" | "Medium" | "Low";
  storyPoints: number;
  acceptanceCriteria: string;
  assigneeRole: string;
  dependsOn?: string;
}

/**
 * Dynamically breaks down the project summary into Agile Epics, User Stories, and Engineering Tasks
 * tailored specifically for human engineering employees to execute manually.
 */
export function generateDynamicSprintStories(ctx: GovernanceProjectContext): DynamicSprintStory[] {
  const name = ctx.projectName || "Project";
  const isSaree = name.toLowerCase().includes("saree") || ctx.problem.toLowerCase().includes("saree");

  if (isSaree) {
    return [
      {
        id: "US-101",
        epic: "Architecture & Data Layer",
        summary: `Saree Catalog & Customization PostgreSQL Database Schema`,
        issueType: "Story",
        description: `Define PostgreSQL tables for sarees, fabric_variants, blouse_customizations, orders, payments, and shipments using Drizzle ORM.`,
        priority: "Highest",
        storyPoints: 5,
        acceptanceCriteria: `Given schema definitions, when migrations run, all relational tables, foreign keys, and indexes for fabric tags are created.`,
        assigneeRole: "Lead Architect / CTO",
        dependsOn: "None",
      },
      {
        id: "TASK-102",
        epic: "Architecture & Data Layer",
        summary: `Database Migrations & Saree Catalog Seed Data`,
        issueType: "Task",
        description: `Create seed scripts with 50+ authentic silk and handloom saree SKUs, Silk Mark certificates, and regional weave origins.`,
        priority: "High",
        storyPoints: 3,
        acceptanceCriteria: `Seed scripts populate realistic catalog data with fabric specifications and pricing.`,
        assigneeRole: "Backend Engineer",
        dependsOn: "US-101",
      },
      {
        id: "US-201",
        epic: "Core Backend Services",
        summary: `Saree Catalog REST API with Occasion & Fabric Filters`,
        issueType: "Story",
        description: `Build high-performance REST APIs to search and filter sarees by fabric (Kanchipuram, Banarasi, Tussar), occasion, and price.`,
        priority: "Highest",
        storyPoints: 5,
        acceptanceCriteria: `GET /api/sarees returns filtered results in <150ms with pagination and high-res image URLs.`,
        assigneeRole: "Backend Engineer",
        dependsOn: "TASK-102",
      },
      {
        id: "US-202",
        epic: "Core Backend Services",
        summary: `Interactive Blouse Tailoring & Fall/Pico Customization Engine`,
        issueType: "Story",
        description: `Implement custom measurement validation service (bust, waist, sleeve length, front/back neckline, lining selection).`,
        priority: "High",
        storyPoints: 8,
        acceptanceCriteria: `POST /api/customizations/blouse validates measurement ranges and attaches tailoring specs to cart line items.`,
        assigneeRole: "Backend Engineer",
        dependsOn: "US-201",
      },
      {
        id: "US-203",
        epic: "Core Backend Services",
        summary: `Dual-Rail Payments: Razorpay (India UPI/COD) & Stripe (Global NRI)`,
        issueType: "Story",
        description: `Integrate Razorpay SDK for domestic UPI/Netbanking/COD OTP and Stripe for international multi-currency transactions.`,
        priority: "Highest",
        storyPoints: 8,
        acceptanceCriteria: `Order is marked 'paid' upon webhook verification; COD requires SMS/WhatsApp OTP verification.`,
        assigneeRole: "Backend Engineer",
        dependsOn: "US-202",
      },
      {
        id: "TASK-204",
        epic: "Core Backend Services",
        summary: `Shiprocket & Delhivery Automated Courier Dispatch Integration`,
        issueType: "Task",
        description: `Integrate Shiprocket API to calculate shipping rates, generate 1-click AWB labels, and listen for tracking webhooks.`,
        priority: "High",
        storyPoints: 5,
        acceptanceCriteria: `Creating an order generates an AWB number and triggers automated courier pickup requests.`,
        assigneeRole: "Backend Engineer",
        dependsOn: "US-203",
      },
      {
        id: "US-301",
        epic: "Frontend & UI Experience",
        summary: `Mobile-First Saree Storefront & 4K Fabric Macro Zoom Gallery`,
        issueType: "Story",
        description: `Build Next.js 15 storefront with responsive mobile layout, 4K pallu/texture zoom, and smooth fabric video reel preview.`,
        priority: "Highest",
        storyPoints: 8,
        acceptanceCriteria: `Images load with WebP compression; 4K zoom lens functions smoothly on touchscreens and desktop.`,
        assigneeRole: "Lead Frontend Engineer",
        dependsOn: "US-201",
      },
      {
        id: "US-302",
        epic: "Frontend & UI Experience",
        summary: `Interactive Blouse Measurement Wizard & Size Guide`,
        issueType: "Story",
        description: `Create visual measurement guide with body diagram illustrations, standard size presets (32-46), and custom input fields.`,
        priority: "High",
        storyPoints: 5,
        acceptanceCriteria: `Users can input custom measurements or pick standard sizes with live price calculation for tailoring add-ons.`,
        assigneeRole: "Frontend Engineer",
        dependsOn: "US-301",
      },
      {
        id: "US-303",
        epic: "Frontend & UI Experience",
        summary: `WhatsApp 1-Click Support & Live Order Tracking Modal`,
        issueType: "Story",
        description: `Build customer live tracking modal showing courier timeline (Dispatched -> In Transit -> Out for Delivery) and 1-click WhatsApp chat.`,
        priority: "Medium",
        storyPoints: 3,
        acceptanceCriteria: `Modal displays real-time status from Shiprocket API and deep-links to WhatsApp for support.`,
        assigneeRole: "Frontend Engineer",
        dependsOn: "TASK-204",
      },
      {
        id: "US-401",
        epic: "Security & Compliance",
        summary: `Payment Security, Webhook Signature Verification & Rate-Limiting`,
        issueType: "Story",
        description: `Enforce HMAC-SHA256 signature verification for payment webhooks, CSP headers, and rate-limiting on checkout endpoints.`,
        priority: "High",
        storyPoints: 3,
        acceptanceCriteria: `Unsigned or spoofed payment webhooks are rejected with 401 Unauthorized; payment amounts are verified server-side.`,
        assigneeRole: "Security Engineer",
        dependsOn: "US-203",
      },
      {
        id: "US-501",
        epic: "Quality Assurance",
        summary: `Automated Checkout & Measurement Validation Test Suite`,
        issueType: "Story",
        description: `Develop Vitest and Playwright test suites covering full customer journeys from saree selection to checkout and order tracking.`,
        priority: "High",
        storyPoints: 5,
        acceptanceCriteria: `Automated test suite verifies domestic UPI, international Stripe, and COD flows with >85% code coverage.`,
        assigneeRole: "QA Lead",
        dependsOn: "US-302",
      },
      {
        id: "US-601",
        epic: "DevOps & Infrastructure",
        summary: `Automated CI/CD Pipeline & Multi-Region Edge Caching`,
        issueType: "Story",
        description: `Configure GitHub Actions CI/CD workflows, Docker multi-stage build, and Cloudflare CDN caching for high-res media.`,
        priority: "High",
        storyPoints: 5,
        acceptanceCriteria: `Deployments are automated on main branch merges; static media assets are served with edge caching.`,
        assigneeRole: "DevOps Lead",
        dependsOn: "TASK-102",
      },
    ];
  }

  // General Software / SaaS sprint stories
  return [
    {
      id: "US-101",
      epic: "Architecture & Data Layer",
      summary: `System Architecture & Schema Design for ${name}`,
      issueType: "Story",
      description: `Establish the database schema, relational tables, migrations, and repository patterns.`,
      priority: "Highest",
      storyPoints: 5,
      acceptanceCriteria: `Given project requirements for ${name}, database migrations run and all primary entities are created successfully.`,
      assigneeRole: "Lead Architect / CTO",
      dependsOn: "None",
    },
    {
      id: "TASK-102",
      epic: "Architecture & Data Layer",
      summary: `Database Migrations & Seed Scripts`,
      issueType: "Task",
      description: `Write and verify SQL/ORM migrations, seed data, and connection pooling for the persistence layer.`,
      priority: "High",
      storyPoints: 3,
      acceptanceCriteria: `Database passes migration tests and clean rollback on failure.`,
      assigneeRole: "Backend Engineer",
      dependsOn: "US-101",
    },
    {
      id: "US-201",
      epic: "Core Backend Services",
      summary: `Core Business Logic & Domain Services for ${name}`,
      issueType: "Story",
      description: `Implement foundational business logic, validation routines, and data access layers.`,
      priority: "Highest",
      storyPoints: 8,
      acceptanceCriteria: `Given valid parameters, business rules execute and valid domain entities are returned.`,
      assigneeRole: "Backend Engineer",
      dependsOn: "TASK-102",
    },
    {
      id: "US-202",
      epic: "Core Backend Services",
      summary: `REST API Endpoints & OpenAPI Contract`,
      issueType: "Story",
      description: `Expose authenticated REST API endpoints with request validation (Zod) and OpenAPI documentation.`,
      priority: "High",
      storyPoints: 5,
      acceptanceCriteria: `All endpoints return structured JSON and pass contract validation.`,
      assigneeRole: "Backend Engineer",
      dependsOn: "US-201",
    },
    {
      id: "US-301",
      epic: "Frontend & UI Experience",
      summary: `Dashboard & Primary User Workflows`,
      issueType: "Story",
      description: `Design and implement responsive UI components, interactive tables, cards, and state management.`,
      priority: "Highest",
      storyPoints: 8,
      acceptanceCriteria: `Main dashboard, metrics, and interactive controls render smoothly across devices.`,
      assigneeRole: "Frontend Lead",
      dependsOn: "US-202",
    },
    {
      id: "US-401",
      epic: "Security & Compliance",
      summary: `Authentication, RBAC & Audit Logging`,
      issueType: "Story",
      description: `Implement secure JWT/session authentication, tenant authorization gates, and audit logging.`,
      priority: "Highest",
      storyPoints: 5,
      acceptanceCriteria: `Unauthorized requests receive 401/403 and all mutating actions create audit log entries.`,
      assigneeRole: "Security Engineer",
      dependsOn: "US-202",
    },
    {
      id: "US-501",
      epic: "Quality Assurance",
      summary: `Unit & Integration Test Suite for ${name}`,
      issueType: "Story",
      description: `Develop automated Vitest unit tests and API integration test suites achieving >85% code coverage.`,
      priority: "High",
      storyPoints: 5,
      acceptanceCriteria: `100% of automated test suites pass cleanly in CI environment.`,
      assigneeRole: "QA Lead",
      dependsOn: "US-202",
    },
    {
      id: "US-601",
      epic: "DevOps & Infrastructure",
      summary: `Automated CI/CD Pipeline & Docker Containerization`,
      issueType: "Story",
      description: `Create Dockerfiles and GitHub Actions CI/CD workflows for automated build, lint, and test.`,
      priority: "High",
      storyPoints: 5,
      acceptanceCriteria: `Pull requests trigger automated typecheck, lint, and test runs; merges trigger deployment.`,
      assigneeRole: "DevOps Lead",
      dependsOn: "TASK-102",
    },
  ];
}
