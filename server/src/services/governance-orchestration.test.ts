import { describe, it, expect, vi } from "vitest";
import {
  governanceOrchestrationService,
  formatKickoffBriefMarkdown,
  type ProjectKickoffBrief,
} from "./governance-orchestration.js";
import { GOVERNANCE_DOCUMENT_KINDS } from "./governance-documents.js";

function createMockDeps() {
  let issueIdCounter = 1;

  const mockOrgSvc: any = {
    createGovernanceOrg: vi.fn().mockResolvedValue({
      projectId: "proj-gov-1",
      agents: {
        ceo: { id: "agent-ceo", name: "CEO", role: "ceo" },
        cto: { id: "agent-cto", name: "CTO", role: "cto" },
        pm: { id: "agent-pm", name: "PM", role: "pm" },
      },
    }),
  };

  const mockGoalSvc: any = {
    create: vi.fn().mockImplementation(async (_companyId: string, input: any) => ({
      id: "goal-1",
      ...input,
    })),
  };

  const mockIssueSvc: any = {
    create: vi.fn().mockImplementation(async (_companyId: string, input: any) => ({
      id: `issue-${issueIdCounter++}`,
      ...input,
    })),
  };

  const mockDb: any = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  };

  return { mockDb, mockOrgSvc, mockGoalSvc, mockIssueSvc };
}

describe("Governance Orchestration Service", () => {
  const brief: ProjectKickoffBrief = {
    projectName: "Project Auro SuperApp",
    problem: "Manual governance and document authoring slows software releases.",
    targetUsers: "Engineering Managers and Enterprise Tech Leads",
    goals: "Generate full 12-document governance pack autonomously.",
    constraints: "Strict RBAC, token-gated UI, and OpenCode approved models.",
    budget: 75000,
    deadline: "2026-12-15",
    preferredStack: "React, Node.js, TypeScript, PostgreSQL",
    integrations: "GitHub, Slack, Jira",
    teamSizeAndSkills: "6 senior engineers with full-stack and security expertise",
    isDemo: true,
  };

  it("validates required brief fields", async () => {
    const { mockDb, mockOrgSvc, mockGoalSvc, mockIssueSvc } = createMockDeps();
    const service = governanceOrchestrationService(mockDb, {
      orgSvc: mockOrgSvc,
      goalSvc: mockGoalSvc,
      issueSvc: mockIssueSvc,
    });

    await expect(service.submitKickoffBrief("comp-1", { ...brief, projectName: "" })).rejects.toThrow(
      "Project name is required",
    );
    await expect(service.submitKickoffBrief("comp-1", { ...brief, problem: "" })).rejects.toThrow(
      "Problem statement is required",
    );
    await expect(service.submitKickoffBrief("comp-1", { ...brief, targetUsers: "" })).rejects.toThrow(
      "Target users specification is required",
    );
    await expect(service.submitKickoffBrief("comp-1", { ...brief, goals: "" })).rejects.toThrow(
      "Project goals are required",
    );
  });

  it("formats kickoff brief markdown with demo mode notice", () => {
    const markdown = formatKickoffBriefMarkdown(brief, true);
    expect(markdown).toContain("Project Kickoff Brief: Project Auro SuperApp");
    expect(markdown).toContain("Demo Mode");
    expect(markdown).toContain("Engineering Managers and Enterprise Tech Leads");
  });

  it("orchestrates kickoff and generates all 12 valid governance documents", async () => {
    const { mockDb, mockOrgSvc, mockGoalSvc, mockIssueSvc } = createMockDeps();
    const service = governanceOrchestrationService(mockDb, {
      orgSvc: mockOrgSvc,
      goalSvc: mockGoalSvc,
      issueSvc: mockIssueSvc,
    });

    const result = await service.submitKickoffBrief("comp-1", brief);

    expect(result.projectName).toBe("Project Auro SuperApp");
    expect(result.executionMode).toBe("demo");
    expect(result.status).toBe("completed");
    expect(result.goalId).toBe("goal-1");
    expect(result.kickoffIssueId).toBeDefined();

    // Check all 12 documents are generated and valid
    for (const kind of GOVERNANCE_DOCUMENT_KINDS) {
      const doc = result.documents[kind];
      expect(doc).toBeDefined();
      expect(doc.isValid).toBe(true);
      expect(doc.missingSections).toEqual([]);
      expect(doc.content).toContain("Project Auro SuperApp");
      expect(doc.content).toContain("Demo Mode");
    }

    expect(result.projectPackSummary).toBeDefined();
    expect(result.projectPackSummary.content).toContain("APPROVED by CEO");
    expect(result.projectPackSummary.content).toContain("12 / 12");
  });

  it("verifies C-Suite workstream ordering (CEO -> CTO -> PM)", async () => {
    const { mockDb, mockOrgSvc, mockGoalSvc, mockIssueSvc } = createMockDeps();
    const service = governanceOrchestrationService(mockDb, {
      orgSvc: mockOrgSvc,
      goalSvc: mockGoalSvc,
      issueSvc: mockIssueSvc,
    });

    const result = await service.submitKickoffBrief("comp-1", brief);

    expect(result.dependencyOrder).toEqual(["ceo", "cto", "pm"]);

    const ceoWs = result.workstreams.find((w) => w.role === "ceo");
    const ctoWs = result.workstreams.find((w) => w.role === "cto");
    const pmWs = result.workstreams.find((w) => w.role === "pm");

    expect(ceoWs).toBeDefined();
    expect(ctoWs?.dependsOnIssueIds).toContain(result.kickoffIssueId);
    expect(pmWs?.dependsOnIssueIds).toContain(ctoWs?.issueId);
  });
});
