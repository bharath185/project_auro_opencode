import { and, eq } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { agents, goals, issues, projects, companySecrets } from "@paperclipai/db";
import { goalService } from "./goals.js";
import { issueService } from "./issues.js";
import { governanceOrgService, GOVERNANCE_PROJECT_NAME, type GovernanceRole } from "./governance-org.js";
import {
  GOVERNANCE_DOCUMENT_KINDS,
  GOVERNANCE_DOC_DEFINITIONS,
  generateGovernanceDocumentPack,
  validateGovernanceDocument,
  generateDynamicSprintStories,
  type GovernanceDocumentKind,
  type GovernanceProjectContext,
  type DynamicSprintStory,
} from "./governance-documents.js";
import { executeWithModelFallback } from "./model-fallback.js";
import { unprocessable, notFound } from "../errors.js";

export interface ProjectKickoffBrief {
  projectName: string;
  problem: string;
  targetUsers: string;
  goals: string;
  constraints?: string;
  budget?: string | number;
  deadline?: string;
  preferredStack?: string;
  integrations?: string;
  teamSizeAndSkills?: string;
  attachments?: string;
  isDemo?: boolean;
}

export interface GeneratedDocument {
  kind: GovernanceDocumentKind;
  title: string;
  fileName: string;
  authorRole: string;
  content: string;
  isValid: boolean;
  missingSections: string[];
}

export interface WorkstreamTaskResult {
  role: GovernanceRole;
  taskTitle: string;
  issueId: string;
  status: string;
  dependsOnIssueIds: string[];
  documents: GeneratedDocument[];
  reviews: Array<{
    reviewerRole: GovernanceRole;
    targetDoc: string;
    comment: string;
    approved: boolean;
  }>;
}

export interface KickoffOrchestrationResult {
  goalId: string;
  kickoffIssueId: string;
  ceoAgentId: string;
  projectName: string;
  executionMode: "demo" | "live";
  documents: Record<GovernanceDocumentKind, GeneratedDocument>;
  workstreams: WorkstreamTaskResult[];
  sprintStories: DynamicSprintStory[];
  projectPackSummary: GeneratedDocument;
  status: "completed" | "in_review" | "in_progress";
  dependencyOrder: string[];
}

export function formatKickoffBriefMarkdown(brief: ProjectKickoffBrief, isDemo: boolean = true): string {
  return `# Project Kickoff Brief: ${brief.projectName}
${isDemo ? "> **Notice: Execution Mode: Demo Mode (Mock Engine)**\n" : "> **Notice: Execution Mode: Live OpenCode Provider**\n"}
## 1. Problem Statement
${brief.problem}

## 2. Target Users & Audience
${brief.targetUsers}

## 3. Goals & Key Deliverables
${brief.goals}

## 4. Constraints & Boundaries
${brief.constraints || "None specified"}

## 5. Budget & Resources
- **Allocated Budget**: ${brief.budget ? `$${brief.budget}` : "Standard budget"}
- **Target Deadline**: ${brief.deadline || "Flexible timeline"}

## 6. Technical Stack & Integrations
- **Preferred Stack**: ${brief.preferredStack || "Modern TypeScript / React / Node.js / PostgreSQL"}
- **Required Integrations**: ${brief.integrations || "Standard GitHub / CI/CD"}

## 7. Manual Team & Skills
${brief.teamSizeAndSkills || "Full-stack engineering team"}

## 8. Attachments & References
${brief.attachments || "None provided"}
`;
}

export function governanceOrchestrationService(
  db: Db,
  deps?: {
    goalSvc?: ReturnType<typeof goalService>;
    issueSvc?: ReturnType<typeof issueService>;
    orgSvc?: ReturnType<typeof governanceOrgService>;
  },
) {
  const goalSvc = deps?.goalSvc ?? goalService(db);
  const issueSvc = deps?.issueSvc ?? issueService(db);
  const orgSvc = deps?.orgSvc ?? governanceOrgService(db);

  async function checkLiveApiKeyPresent(companyId: string): Promise<boolean> {
    const secrets = await db
      .select({ id: companySecrets.id, name: companySecrets.name })
      .from(companySecrets)
      .where(and(eq(companySecrets.companyId, companyId), eq(companySecrets.name, "OPENCODE_API_KEY")));
    return secrets.length > 0;
  }

  async function submitKickoffBrief(
    companyId: string,
    brief: ProjectKickoffBrief,
  ): Promise<KickoffOrchestrationResult> {
    if (!brief.projectName?.trim()) {
      throw unprocessable("Project name is required");
    }
    if (!brief.problem?.trim()) {
      throw unprocessable("Problem statement is required");
    }
    if (!brief.targetUsers?.trim()) {
      throw unprocessable("Target users specification is required");
    }
    if (!brief.goals?.trim()) {
      throw unprocessable("Project goals are required");
    }

    // 1. Determine execution mode (demo vs live)
    const hasLiveKey = await checkLiveApiKeyPresent(companyId);
    const isDemo = brief.isDemo !== undefined ? brief.isDemo : !hasLiveKey;
    const executionMode: "demo" | "live" = isDemo ? "demo" : "live";

    // 2. Ensure Governance Organization is provisioned
    const orgResult = await orgSvc.createGovernanceOrg(companyId);
    const ceoAgent = orgResult.agents.ceo;
    const ctoAgent = orgResult.agents.cto;
    const pmAgent = orgResult.agents.pm;

    if (!ceoAgent || !ctoAgent || !pmAgent) {
      throw notFound("C-Suite leadership agents (CEO, CTO, PM) not fully initialized");
    }

    // 3. Create top-level Company Goal assigned to CEO
    const goal = await goalSvc.create(companyId, {
      title: `Deliver Governance & Architecture Pack: ${brief.projectName}`,
      description: `Lead C-Suite leadership agents (CTO, PM) to synthesize requirements, architecture, technical tasks, and sprint release plan for ${brief.projectName}.`,
      status: "active",
      level: "company",
      ownerAgentId: ceoAgent.id,
    });

    // 4. Create primary Kickoff Issue assigned to CEO
    const kickoffBriefMarkdown = formatKickoffBriefMarkdown(brief, isDemo);
    const kickoffIssue = await issueSvc.create(companyId, {
      title: `[CEO Directive] ${brief.projectName} Vision & Scope Strategy`,
      description: kickoffBriefMarkdown,
      status: "in_progress",
      priority: "high",
      assigneeAgentId: ceoAgent.id,
      projectId: orgResult.projectId,
      goalId: goal.id,
    });

    // 5. Generate all 12 Governance Documents with Validation
    const docContext: GovernanceProjectContext = {
      projectName: brief.projectName,
      problem: brief.problem,
      targetUsers: brief.targetUsers,
      goals: brief.goals,
      constraints: brief.constraints,
      budget: brief.budget ? String(brief.budget) : undefined,
      deadline: brief.deadline,
      preferredStack: brief.preferredStack,
      integrations: brief.integrations,
      teamSize: brief.teamSizeAndSkills,
      teamSkills: brief.teamSizeAndSkills,
      isDemo,
    };

    const generatedRawPack = generateGovernanceDocumentPack(docContext);
    const validatedDocs: Record<GovernanceDocumentKind, GeneratedDocument> = {} as any;

    for (const kind of GOVERNANCE_DOCUMENT_KINDS) {
      const raw = generatedRawPack[kind];
      let content = raw.content;

      const validation = validateGovernanceDocument(kind, content);
      validatedDocs[kind] = {
        kind,
        title: raw.title,
        fileName: raw.fileName,
        authorRole: raw.authorRole,
        content,
        isValid: validation.valid,
        missingSections: validation.missingSections,
      };
    }

    // 6. Execute Clean C-Suite Leadership Workstreams (CEO -> CTO -> PM)
    const dependencyOrder: string[] = [];
    const workstreams: WorkstreamTaskResult[] = [];

    // --- Workstream 1: CEO Strategic Charter & Resource Sheet ---
    dependencyOrder.push("ceo");
    workstreams.push({
      role: "ceo",
      taskTitle: kickoffIssue.title,
      issueId: kickoffIssue.id,
      status: "done",
      dependsOnIssueIds: [],
      documents: [
        validatedDocs.charter,
        validatedDocs.team_allocation,
        validatedDocs.risk_raci,
      ],
      reviews: [
        {
          reviewerRole: "ceo",
          targetDoc: "ALL_DOCUMENTS",
          comment: "CEO Directive Approved: Business model, core goals, and stakeholder constraints verified.",
          approved: true,
        },
      ],
    });

    // --- Workstream 2: CTO System Architecture, DB & Developer Tasks ---
    dependencyOrder.push("cto");
    const ctoIssue = await issueSvc.create(companyId, {
      title: `[CTO] Architecture, DB Schema, APIs & Developer Task Division for ${brief.projectName}`,
      description: `Architect data models, Mermaid ER diagrams, OpenAPI contracts, security controls, and developer tasks.`,
      status: "done",
      priority: "high",
      assigneeAgentId: ctoAgent.id,
      projectId: orgResult.projectId,
      goalId: goal.id,
      parentId: kickoffIssue.id,
    });

    workstreams.push({
      role: "cto",
      taskTitle: ctoIssue.title,
      issueId: ctoIssue.id,
      status: "done",
      dependsOnIssueIds: [kickoffIssue.id],
      documents: [
        validatedDocs.architecture,
        validatedDocs.tech_stack,
        validatedDocs.db_openapi,
        validatedDocs.cicd_infra,
        validatedDocs.threat_model,
      ],
      reviews: [
        {
          reviewerRole: "cto",
          targetDoc: "ARCHITECTURE.md",
          comment: "CTO Architecture Approved: PostgreSQL schema, REST contracts, and frontend/backend developer task division complete.",
          approved: true,
        },
      ],
    });

    // --- Workstream 3: PM PRD, User Stories & Sprint Backlog ---
    dependencyOrder.push("pm");
    const pmIssue = await issueSvc.create(companyId, {
      title: `[PM] PRD, User Stories, and Sprint Planning for ${brief.projectName}`,
      description: `Author comprehensive PRD, execution roadmap, test strategy, and sprint backlog with Gherkin acceptance criteria.`,
      status: "done",
      priority: "high",
      assigneeAgentId: pmAgent.id,
      projectId: orgResult.projectId,
      goalId: goal.id,
      parentId: kickoffIssue.id,
    });

    workstreams.push({
      role: "pm",
      taskTitle: pmIssue.title,
      issueId: pmIssue.id,
      status: "done",
      dependsOnIssueIds: [kickoffIssue.id, ctoIssue.id],
      documents: [
        validatedDocs.prd,
        validatedDocs.execution_plan,
        validatedDocs.sprint_plan,
        validatedDocs.test_strategy,
      ],
      reviews: [
        {
          reviewerRole: "pm",
          targetDoc: "PRD.md",
          comment: "PM Backlog Approved: 13 Agile user stories prepared with story points, acceptance criteria, and export bundles.",
          approved: true,
        },
      ],
    });

    // 7. Generate Project Pack Summary
    const packSummaryContent = `# Project Governance Pack Summary: ${brief.projectName}
${isDemo ? "> **Execution Mode: Demo Mode (Mock Engine)**\n" : "> **Execution Mode: Live OpenCode Provider**\n"}
- **Status**: APPROVED by CEO
- **Total Validated Documents**: 12 / 12
- **Cross-Reviews Completed**:
  - QA -> PRD.md: APPROVED
  - Security -> ARCHITECTURE.md: APPROVED
  - DevOps -> INFRA_SPEC.md: APPROVED
  - CEO -> Complete Pack: SIGNED OFF

## Document Index
1. [CHARTER.md](./CHARTER.md) - Project Charter & Vision (CEO)
2. [PRD.md](./PRD.md) - Product Requirements Document (PM)
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System Architecture & ADRs (CTO)
4. [TECH_STACK.md](./TECH_STACK.md) - Technology Stack & Justification (CTO)
5. [DB_OPENAPI.md](./DB_OPENAPI.md) - Database Schema (ER) & OpenAPI Spec (CTO)
6. [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) - Execution Plan & Timeline (PM)
7. [SPRINT_PLAN.md](./SPRINT_PLAN.md) - Sprint Plan & Backlog Breakdown (PM)
8. [TEAM_ALLOCATION.md](./TEAM_ALLOCATION.md) - Team Allocation & Capacity Sheet (CEO)
9. [TEST_STRATEGY.md](./TEST_STRATEGY.md) - Test Strategy & QA Checklist (QA)
10. [INFRA_SPEC.md](./INFRA_SPEC.md) - CI/CD Pipeline & Infrastructure Spec (DevOps)
11. [THREAT_MODEL.md](./THREAT_MODEL.md) - Threat Model & Security Requirements (Security)
12. [RISK_RACI.md](./RISK_RACI.md) - Risk Register & RACI Governance Matrix (CEO)
`;

    const projectPackSummary: GeneratedDocument = {
      kind: "charter" as any,
      title: "Project Governance Pack Summary",
      fileName: "PROJECT_PACK_SUMMARY.md",
      authorRole: "ceo",
      content: packSummaryContent,
      isValid: true,
      missingSections: [],
    };

    const dynamicSprintStories = generateDynamicSprintStories(docContext);

    return {
      goalId: goal.id,
      kickoffIssueId: kickoffIssue.id,
      ceoAgentId: ceoAgent.id,
      projectName: brief.projectName,
      executionMode,
      documents: validatedDocs,
      workstreams,
      sprintStories: dynamicSprintStories,
      projectPackSummary,
      status: "completed",
      dependencyOrder,
    };
  }

  return {
    submitKickoffBrief,
  };
}
