import { describe, it, expect } from "vitest";
import {
  GOVERNANCE_ROLES,
  GOVERNANCE_AGENT_DEFINITIONS,
  readGovernancePromptFile,
  listAllGovernancePrompts,
} from "./governance-org.js";

describe("Governance Org Service & Prompts", () => {
  it("defines the 3 core C-Suite governance roles with reporting lines", () => {
    expect(GOVERNANCE_ROLES).toEqual(["ceo", "cto", "pm"]);

    const ceo = GOVERNANCE_AGENT_DEFINITIONS.ceo;
    expect(ceo.reportsToRole).toBeNull();
    expect(ceo.budgetMonthlyCents).toBeGreaterThan(0);

    const reports = ["cto", "pm"] as const;
    for (const role of reports) {
      const def = GOVERNANCE_AGENT_DEFINITIONS[role];
      expect(def.reportsToRole).toBe("ceo");
      expect(def.budgetMonthlyCents).toBeGreaterThan(0);
      expect(def.permissions).toBeDefined();
    }
  });

  it("reads and lists all core governance prompts", async () => {
    const prompts = await listAllGovernancePrompts();
    expect(Object.keys(prompts)).toEqual(["ceo", "cto", "pm"]);

    for (const role of GOVERNANCE_ROLES) {
      const prompt = prompts[role];
      expect(prompt.role).toBe(role);
      expect(prompt.title).toBeTruthy();
      expect(prompt.content.length).toBeGreaterThan(30);
    }
  });

  it("reads role-specific system prompt contents accurately", async () => {
    const ceoPrompt = await readGovernancePromptFile("ceo");
    expect(ceoPrompt).toContain("Chief Executive Officer");

    const ctoPrompt = await readGovernancePromptFile("cto");
    expect(ctoPrompt).toContain("Chief Technology Officer");

    const pmPrompt = await readGovernancePromptFile("pm");
    expect(pmPrompt).toContain("Product Manager");
  });
});
