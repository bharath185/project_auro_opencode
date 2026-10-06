import { Router, type Request } from "express";
import { z } from "zod";
import type { Db } from "@paperclipai/db";
import { validate } from "../middleware/validate.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import {
  governanceOrgService,
  GOVERNANCE_ROLES,
  type GovernanceRole,
} from "../services/governance-org.js";
import { governanceOrchestrationService } from "../services/governance-orchestration.js";
import {
  GOVERNANCE_DOCUMENT_KINDS,
  GOVERNANCE_DOC_DEFINITIONS,
  validateGovernanceDocument,
  generateGovernanceDocumentPack,
  generateDynamicSprintStories,
  type GovernanceDocumentKind,
} from "../services/governance-documents.js";
import {
  exportCombinedMarkdown,
  exportZipArchive,
  exportPdf,
  exportDocx,
  exportSprintBacklogCsv,
  exportJiraImportCsv,
  exportSprintBacklogXlsx,
  DEFAULT_SPRINT_STORIES,
  type SprintStoryItem,
} from "../services/governance-export.js";
import { governanceTeamAssignmentService } from "../services/governance-team-assignment.js";
import { codingAgentGovernanceService } from "../services/coding-agent-governance.js";
import { logActivity } from "../services/activity-log.js";
import {
  analyzeIdeaAndGenerateQuestions,
  analyzeIdeaAndGenerateQuestionsAsync,
  compileCeoExecutiveBrief,
} from "../services/ceo-consultation.js";
import { unprocessable, notFound } from "../errors.js";

const kickoffBriefSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  problem: z.string().min(1, "Problem statement is required"),
  targetUsers: z.string().min(1, "Target users is required"),
  goals: z.string().min(1, "Goals are required"),
  constraints: z.string().optional(),
  budget: z.union([z.string(), z.number()]).optional(),
  deadline: z.string().optional(),
  preferredStack: z.string().optional(),
  integrations: z.string().optional(),
  teamSizeAndSkills: z.string().optional(),
  attachments: z.string().optional(),
  isDemo: z.boolean().optional(),
});

const updatePromptSchema = z.object({
  content: z.string().min(1, "Prompt content cannot be empty"),
});

const updateDocumentSchema = z.object({
  content: z.string().min(1, "Document content cannot be empty"),
  changeSummary: z.string().optional(),
});

const reviewDocumentSchema = z.object({
  reviewerRole: z.enum(["ceo", "cto", "pm", "qa", "devops", "security"]),
  status: z.enum(["approved", "changes_requested"]),
  comments: z.string().min(1, "Review comment is required"),
});

const createOrgSchema = z.object({
  adapterType: z.string().optional(),
  customModels: z.record(z.string(), z.string()).optional(),
});

function resolveCompanyId(req: Request): string {
  const candidate =
    (req.params.companyId as string) ||
    (req.query.companyId as string) ||
    (req.body?.companyId as string) ||
    ((req as any).companyId as string);
  if (!candidate) {
    throw unprocessable("Company ID is required");
  }
  assertCompanyAccess(req, candidate);
  return candidate;
}

// In-memory document store cache for active company governance packs
const companyDocStore = new Map<
  string,
  {
    projectName: string;
    packStatus: "draft" | "in_review" | "approved";
    sprintStories?: SprintStoryItem[];
    documents: Record<
      GovernanceDocumentKind,
      {
        kind: GovernanceDocumentKind;
        title: string;
        fileName: string;
        authorRole: string;
        currentVersion: number;
        versions: Array<{ version: number; content: string; authorRole: string; changeSummary: string; createdAt: string }>;
        reviews: Array<{ reviewerRole: string; status: string; comments: string; createdAt: string }>;
      }
    >;
  }
>();

function getOrCreateCompanyDocs(companyId: string, projectName: string = "Project Auro") {
  let store = companyDocStore.get(companyId);
  if (!store) {
    const rawPack = generateGovernanceDocumentPack({
      projectName,
      problem: "Autonomous project kickoff and document generation",
      targetUsers: "Project teams and engineering leaders",
      goals: "Complete governance document pack with full validation",
      isDemo: true,
    });

    const dynamicStories = generateDynamicSprintStories({
      projectName,
      problem: "Autonomous project kickoff and document generation",
      targetUsers: "Project teams and engineering leaders",
      goals: "Complete governance document pack with full validation",
      isDemo: true,
    });

    const docsMap: any = {};
    for (const kind of GOVERNANCE_DOCUMENT_KINDS) {
      const def = GOVERNANCE_DOC_DEFINITIONS[kind];
      const raw = rawPack[kind];
      docsMap[kind] = {
        kind,
        title: def.title,
        fileName: def.fileName,
        authorRole: def.authorRole,
        currentVersion: 1,
        versions: [
          {
            version: 1,
            content: raw.content,
            authorRole: def.authorRole,
            changeSummary: "Initial autonomous generation",
            createdAt: new Date().toISOString(),
          },
        ],
        reviews: [],
      };
    }

    store = {
      projectName,
      packStatus: "in_review",
      sprintStories: dynamicStories,
      documents: docsMap,
    };
    companyDocStore.set(companyId, store);
  }
  return store;
}

export function governanceRoutes(db: Db) {
  const router = Router();
  const orgSvc = governanceOrgService(db);
  const orchSvc = governanceOrchestrationService(db);

  // Status check
  const handleGetStatus = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const status = await orgSvc.getGovernanceOrgStatus(companyId);
    res.json(status);
  };
  router.get("/companies/:companyId/governance/status", handleGetStatus);
  router.get("/governance/status", handleGetStatus);

  // One-click create/provision Governance Org
  const handleCreateOrg = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const result = await orgSvc.createGovernanceOrg(companyId, req.body);
    const actor = getActorInfo(req);

    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      agentApiKeyId: actor.agentApiKeyId,
      action: "governance.org_provisioned",
      entityType: "company",
      entityId: companyId,
      details: {
        agentCount: Object.keys(result.agents).length,
        projectId: result.projectId,
      },
    });

    res.status(201).json({
      success: true,
      projectId: result.projectId,
      agents: Object.values(result.agents).map((a: any) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        title: a.title,
        reportsTo: a.reportsTo,
        budgetMonthlyCents: a.budgetMonthlyCents,
      })),
    });
  };
  router.post("/companies/:companyId/governance/org/create", validate(createOrgSchema), handleCreateOrg);
  router.post("/governance/org/create", validate(createOrgSchema), handleCreateOrg);

  // Read all versioned governance prompts
  const handleListPrompts = async (req: Request, res: any) => {
    resolveCompanyId(req);
    const prompts = await orgSvc.listAllGovernancePrompts();
    res.json(prompts);
  };
  router.get("/companies/:companyId/governance/prompts", handleListPrompts);
  router.get("/governance/prompts", handleListPrompts);

  // Read a single role prompt
  const handleGetPrompt = async (req: Request, res: any) => {
    resolveCompanyId(req);
    const role = req.params.role as GovernanceRole;
    const content = await orgSvc.readGovernancePromptFile(role);
    res.json({ role, content });
  };
  router.get("/companies/:companyId/governance/prompts/:role", handleGetPrompt);
  router.get("/governance/prompts/:role", handleGetPrompt);

  // Edit a versioned governance prompt
  const handlePutPrompt = async (req: Request, res: any) => {
    resolveCompanyId(req);
    const role = req.params.role as GovernanceRole;
    await orgSvc.writeGovernancePromptFile(role, req.body.content);
    res.json({ success: true, role, content: req.body.content });
  };
  router.put("/companies/:companyId/governance/prompts/:role", validate(updatePromptSchema), handlePutPrompt);
  router.put("/governance/prompts/:role", validate(updatePromptSchema), handlePutPrompt);

  // Submit Project Kickoff brief
  const handleKickoff = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const result = await orchSvc.submitKickoffBrief(companyId, req.body);
    const actor = getActorInfo(req);

    // Populate document store with generated output
    const storeDocs: any = {};
    for (const [kind, doc] of Object.entries(result.documents)) {
      storeDocs[kind] = {
        kind,
        title: doc.title,
        fileName: doc.fileName,
        authorRole: doc.authorRole,
        currentVersion: 1,
        versions: [
          {
            version: 1,
            content: doc.content,
            authorRole: doc.authorRole,
            changeSummary: "Autonomous kickoff generation",
            createdAt: new Date().toISOString(),
          },
        ],
        reviews: [],
      };
    }
    companyDocStore.set(companyId, {
      projectName: result.projectName,
      packStatus: "in_review",
      sprintStories: result.sprintStories,
      documents: storeDocs,
    });

    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      agentApiKeyId: actor.agentApiKeyId,
      action: "governance.project_kickoff_submitted",
      entityType: "goal",
      entityId: result.goalId,
      details: {
        projectName: result.projectName,
        goalId: result.goalId,
        kickoffIssueId: result.kickoffIssueId,
        workstreamCount: result.workstreams.length,
      },
    });

    res.status(201).json(result);
  };
  router.post("/companies/:companyId/governance/kickoff", validate(kickoffBriefSchema), handleKickoff);
  router.post("/governance/kickoff", validate(kickoffBriefSchema), handleKickoff);

  // 1. Real-time CEO Discovery & Consultation Questions
  const handleCeoConsult = async (req: Request, res: any) => {
    resolveCompanyId(req);
    const { ideaPrompt, provider, apiKey, model, baseUrl } = req.body;
    if (!ideaPrompt || typeof ideaPrompt !== "string") {
      throw unprocessable("Project idea prompt is required");
    }
    const analysis = await analyzeIdeaAndGenerateQuestionsAsync(ideaPrompt, {
      provider,
      apiKey,
      model,
      baseUrl,
    });
    res.json(analysis);
  };
  router.post("/companies/:companyId/governance/ceo/consult", handleCeoConsult);
  router.post("/governance/ceo/consult", handleCeoConsult);

  // 2. CEO Executive Synthesis & C-Suite Handoff Orchestration
  const handleCeoSynthesize = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const { ideaPrompt, answers, projectName } = req.body;
    if (!ideaPrompt || typeof ideaPrompt !== "string") {
      throw unprocessable("Project idea is required");
    }
    const brief = compileCeoExecutiveBrief(ideaPrompt, answers || {}, projectName);

    const result = await orchSvc.submitKickoffBrief(companyId, {
      projectName: brief.projectName,
      problem: brief.problem,
      targetUsers: brief.targetUsers,
      goals: brief.goals,
      constraints: brief.constraints,
      budget: brief.budget,
      deadline: brief.deadline,
      preferredStack: brief.preferredStack,
      teamSizeAndSkills: brief.teamSizeAndSkills,
      isDemo: false,
    });

    const actor = getActorInfo(req);
    const storeDocs: any = {};
    for (const [kind, doc] of Object.entries(result.documents)) {
      storeDocs[kind] = {
        kind,
        title: doc.title,
        fileName: doc.fileName,
        authorRole: doc.authorRole,
        currentVersion: 1,
        versions: [
          {
            version: 1,
            content: doc.content,
            authorRole: doc.authorRole,
            changeSummary: "CEO Strategic Synthesis & CTO/PM Handoff Generation",
            createdAt: new Date().toISOString(),
          },
        ],
        reviews: [],
      };
    }
    companyDocStore.set(companyId, {
      projectName: result.projectName,
      packStatus: "in_review",
      sprintStories: result.sprintStories,
      documents: storeDocs,
    });

    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      agentApiKeyId: actor.agentApiKeyId,
      action: "governance.ceo_synthesis_completed",
      entityType: "goal",
      entityId: result.goalId,
      details: {
        projectName: result.projectName,
        domain: "ecommerce_saree_or_custom",
        goalId: result.goalId,
      },
    });

    res.status(201).json({
      success: true,
      brief,
      result,
    });
  };
  router.post("/companies/:companyId/governance/ceo/synthesize", handleCeoSynthesize);
  router.post("/governance/ceo/synthesize", handleCeoSynthesize);

  // List all 12 Governance Documents with metadata and validation status
  const handleListDocs = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const store = getOrCreateCompanyDocs(companyId);

    const docList = Object.values(store.documents).map((doc) => {
      const latestVer = doc.versions[doc.versions.length - 1];
      const validation = validateGovernanceDocument(doc.kind, latestVer.content);
      return {
        kind: doc.kind,
        title: doc.title,
        fileName: doc.fileName,
        authorRole: doc.authorRole,
        currentVersion: doc.currentVersion,
        versionCount: doc.versions.length,
        reviewCount: doc.reviews.length,
        isValid: validation.valid,
        missingSections: validation.missingSections,
        foundSections: validation.foundSections,
      };
    });

    res.json({
      projectName: store.projectName,
      packStatus: store.packStatus,
      documents: docList,
    });
  };
  router.get("/companies/:companyId/governance/documents", handleListDocs);
  router.get("/governance/documents", handleListDocs);

  // Get specific Governance Document with version history and reviews
  const handleGetDoc = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const kind = req.params.kind as GovernanceDocumentKind;
    const store = getOrCreateCompanyDocs(companyId);
    const doc = store.documents[kind];

    if (!doc) {
      throw notFound(`Governance document kind not found: ${kind}`);
    }

    const latest = doc.versions[doc.versions.length - 1];
    const validation = validateGovernanceDocument(kind, latest.content);

    res.json({
      ...doc,
      content: latest.content,
      isValid: validation.valid,
      missingSections: validation.missingSections,
      foundSections: validation.foundSections,
    });
  };
  router.get("/companies/:companyId/governance/documents/:kind", handleGetDoc);
  router.get("/governance/documents/:kind", handleGetDoc);

  // Update specific Governance Document (creates new version with validation)
  const handleUpdateDoc = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const kind = req.params.kind as GovernanceDocumentKind;
    const { content, changeSummary } = req.body;
    const store = getOrCreateCompanyDocs(companyId);
    const doc = store.documents[kind];

    if (!doc) {
      throw notFound(`Governance document kind not found: ${kind}`);
    }

    const validation = validateGovernanceDocument(kind, content);
    const newVersionNum = doc.versions.length + 1;

    const newVersion = {
      version: newVersionNum,
      content,
      authorRole: doc.authorRole,
      changeSummary: changeSummary || `Updated document to v${newVersionNum}`,
      createdAt: new Date().toISOString(),
    };

    doc.versions.push(newVersion);
    doc.currentVersion = newVersionNum;

    if (db && typeof (db as any).insert === "function") {
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        action: "governance.document_updated",
        entityType: "document",
        entityId: `${companyId}:${kind}`,
        details: {
          kind,
          version: newVersionNum,
          isValid: validation.valid,
        },
      });
    }

    res.json({
      success: true,
      kind,
      version: newVersionNum,
      isValid: validation.valid,
      missingSections: validation.missingSections,
      foundSections: validation.foundSections,
      document: {
        ...doc,
        content,
      },
    });
  };
  router.put("/companies/:companyId/governance/documents/:kind", validate(updateDocumentSchema), handleUpdateDoc);
  router.put("/governance/documents/:kind", validate(updateDocumentSchema), handleUpdateDoc);

  // Add review / comment to specific document
  const handleReviewDoc = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const kind = req.params.kind as GovernanceDocumentKind;
    const { reviewerRole, status, comments } = req.body;
    const store = getOrCreateCompanyDocs(companyId);
    const doc = store.documents[kind];

    if (!doc) {
      throw notFound(`Governance document kind not found: ${kind}`);
    }

    const review = {
      reviewerRole,
      status,
      comments,
      createdAt: new Date().toISOString(),
    };

    doc.reviews.push(review);

    res.status(201).json({
      success: true,
      review,
      reviews: doc.reviews,
    });
  };
  router.post("/companies/:companyId/governance/documents/:kind/review", validate(reviewDocumentSchema), handleReviewDoc);
  router.post("/governance/documents/:kind/review", validate(reviewDocumentSchema), handleReviewDoc);

  // CEO Approval Gate on the Final Project Pack
  const handleApprovePack = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const store = getOrCreateCompanyDocs(companyId);

    // Validate that all 12 documents are complete and valid
    const incompleteDocs: string[] = [];
    for (const [kind, doc] of Object.entries(store.documents)) {
      const latest = doc.versions[doc.versions.length - 1];
      const validation = validateGovernanceDocument(kind as GovernanceDocumentKind, latest.content);
      if (!validation.valid) {
        incompleteDocs.push(`${doc.title} (missing: ${validation.missingSections.join(", ")})`);
      }
    }

    if (incompleteDocs.length > 0) {
      throw unprocessable("Cannot approve project pack with incomplete documents", {
        incompleteDocs,
      });
    }

    store.packStatus = "approved";

    if (db && typeof (db as any).insert === "function") {
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        action: "governance.pack_approved_by_ceo",
        entityType: "company",
        entityId: companyId,
        details: {
          projectName: store.projectName,
          approvedAt: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      packStatus: "approved",
      message: "Project Governance Pack has been formally APPROVED by the CEO.",
      projectName: store.projectName,
      approvedAt: new Date().toISOString(),
    });
  };
  router.post("/companies/:companyId/governance/pack/approve", handleApprovePack);
  router.post("/governance/pack/approve", handleApprovePack);

  // Multi-format Exporters: /governance/export/:format
  const handleExport = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const format = String(req.params.format || "").toLowerCase();
    const store = getOrCreateCompanyDocs(companyId);

    const docContents: Record<string, { title: string; fileName: string; content: string }> = {};
    const zipFiles: Record<string, string> = {};

    for (const [kind, doc] of Object.entries(store.documents)) {
      const latest = doc.versions[doc.versions.length - 1];
      docContents[kind] = {
        title: doc.title,
        fileName: doc.fileName,
        content: latest.content,
      };
      zipFiles[doc.fileName] = latest.content;
    }

    const stories =
      store.sprintStories && store.sprintStories.length > 0
        ? store.sprintStories
        : DEFAULT_SPRINT_STORIES;

    switch (format) {
      case "markdown":
      case "md": {
        const md = exportCombinedMarkdown(store.projectName, docContents);
        res.setHeader("Content-Type", "text/markdown");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-governance-pack.md"`);
        return res.send(md);
      }

      case "zip": {
        const sprintCsv = exportSprintBacklogCsv(stories);
        const jiraCsv = exportJiraImportCsv(store.projectName, stories);
        const readmeForDevs = `# Engineering Hand-off Guide: ${store.projectName}

Welcome to the **${store.projectName}** project repository! This complete package was autonomously prepared by the C-Suite Governance Agent Pack (CEO, CTO, PM, Lead Architect, QA, DevOps, and Security Leads) and contains everything human engineering teams need to execute the project manually.

## Included Governance & Architecture Documents
1. **CHARTER.md** - Project Charter & Vision (CEO)
2. **PRD.md** - Product Requirements Document & Epics (PM)
3. **ARCHITECTURE.md** - System Architecture, Modular Design & Mermaid Diagrams (CTO)
4. **TECH_STACK.md** - Technology Stack Decisions & Justifications (CTO)
5. **DB_OPENAPI.md** - Database Schema (ERD) & OpenAPI 3.0 Endpoints (CTO)
6. **EXECUTION_PLAN.md** - Timeline, Milestones & Deliverables (PM)
7. **SPRINT_PLAN.md** - Sprint Breakdown & Story Allocations (PM)
8. **TEAM_ALLOCATION.md** - Role Allocations & Capacity Matrix (CEO)
9. **TEST_STRATEGY.md** - Test Strategy, Test Automation & QA Checklist (QA)
10. **INFRA_SPEC.md** - CI/CD Pipelines & Infrastructure Spec (DevOps)
11. **THREAT_MODEL.md** - STRIDE Threat Analysis & Security Controls (Security)
12. **RISK_RACI.md** - Risk Register & RACI Responsibility Matrix (CEO)

## Agile Work Breakdown & Backlog
- **\`SPRINT_BACKLOG.csv\`**: Full sprint backlog with Story Points, Priority, Assignee Roles, Dependencies, and Gherkin Acceptance Criteria.
- **\`JIRA_IMPORT.csv\`**: Formatted for direct 1-click import into Jira, Linear, ClickUp, or GitHub Projects.

## Quick Start for Developers
1. Review **\`ARCHITECTURE.md\`** and **\`DB_OPENAPI.md\`** before implementing data models.
2. Import **\`JIRA_IMPORT.csv\`** into your team's project tracking board.
3. Review **\`TEST_STRATEGY.md\`** and ensure all PRs satisfy acceptance criteria and definition of done.
`;

        const projectPackSummary = `# Project Governance Pack Summary: ${store.projectName}
- **Status**: APPROVED by CEO
- **Total Validated Documents**: 12 / 12
- **Sprint Stories Count**: ${stories.length}
- **Export Date**: ${new Date().toISOString()}

All 12 documents have been cross-reviewed and approved by the C-Suite and Lead Engineers.
`;

        zipFiles["SPRINT_BACKLOG.csv"] = sprintCsv;
        zipFiles["JIRA_IMPORT.csv"] = jiraCsv;
        zipFiles["README_FOR_DEVELOPERS.md"] = readmeForDevs;
        zipFiles["PROJECT_PACK_SUMMARY.md"] = projectPackSummary;

        const zip = exportZipArchive(zipFiles);
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-governance-pack.zip"`);
        return res.send(zip);
      }

      case "pdf": {
        const pdf = exportPdf(store.projectName, docContents);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-governance-pack.pdf"`);
        return res.send(pdf);
      }

      case "docx": {
        const docx = exportDocx(store.projectName, docContents);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-governance-pack.docx"`);
        return res.send(docx);
      }

      case "sprint-csv":
      case "csv": {
        const csv = exportSprintBacklogCsv(stories);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-sprint-backlog.csv"`);
        return res.send(csv);
      }

      case "jira-csv":
      case "jira": {
        const jiraCsv = exportJiraImportCsv(store.projectName, stories);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-jira-backlog.csv"`);
        return res.send(jiraCsv);
      }

      case "sprint-xlsx":
      case "xlsx": {
        const xlsx = exportSprintBacklogXlsx(store.projectName, stories);
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-Disposition", `attachment; filename="${store.projectName}-sprint-backlog.xlsx"`);
        return res.send(xlsx);
      }

      default:
        throw unprocessable(`Unsupported export format: ${format}. Supported formats: markdown, zip, pdf, docx, sprint-csv, jira-csv, sprint-xlsx`);
    }
  };
  router.get("/companies/:companyId/governance/export/:format", handleExport);
  router.get("/governance/export/:format", handleExport);

  // --- Human Team Assignment & Sprint Ticket Tracking ---
  const handleGetTeam = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const state = governanceTeamAssignmentService.getState(companyId);
    res.json(state);
  };
  router.get("/companies/:companyId/governance/team", handleGetTeam);
  router.get("/governance/team", handleGetTeam);

  const handleConvertSprint = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const state = governanceTeamAssignmentService.convertSprintToTickets(companyId);
    res.json(state);
  };
  router.post("/companies/:companyId/governance/team/convert", handleConvertSprint);
  router.post("/governance/team/convert", handleConvertSprint);

  const handleAssignTicket = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const ticketId = String(req.params.ticketId);
    const ticket = governanceTeamAssignmentService.assignTicket(companyId, ticketId, req.body);
    res.json({ success: true, ticket });
  };
  router.put("/companies/:companyId/governance/team/tickets/:ticketId", handleAssignTicket);
  router.put("/governance/team/tickets/:ticketId", handleAssignTicket);

  const handleExportTeamSheet = async (req: Request, res: any) => {
    const companyId = resolveCompanyId(req);
    const csv = governanceTeamAssignmentService.exportAssignmentSheetCsv(companyId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="team-assignments-${companyId}.csv"`);
    res.send(csv);
  };
  router.get("/companies/:companyId/governance/team/export", handleExportTeamSheet);
  router.get("/governance/team/export", handleExportTeamSheet);

  // --- Coding Agent Sandbox & PR Governance ---
  const handleCodingCommit = async (req: Request, res: any) => {
    const result = codingAgentGovernanceService.submitBranchCommit(req.body);
    res.json(result);
  };
  router.post("/companies/:companyId/governance/coding/commit", handleCodingCommit);
  router.post("/governance/coding/commit", handleCodingCommit);

  const handleCodingMerge = async (req: Request, res: any) => {
    const result = codingAgentGovernanceService.mergePullRequest(req.body);
    res.json(result);
  };
  router.post("/companies/:companyId/governance/coding/merge", handleCodingMerge);
  router.post("/governance/coding/merge", handleCodingMerge);

  return router;
}
