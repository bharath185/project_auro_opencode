import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { governanceRoutes } from "../routes/governance.js";
import { errorHandler } from "../middleware/index.js";

describe("Authorization Sweep & Cross-Company IDOR Matrix Tests", () => {
  const allowedCompanyId = "company-tenant-alpha";
  const foreignCompanyId = "company-tenant-bravo";

  let authorizedApp: express.Express;
  let unauthenticatedApp: express.Express;
  let crossCompanyAttackerApp: express.Express;

  beforeEach(() => {
    // 1. Authorized App (User has access to allowedCompanyId)
    authorizedApp = express();
    authorizedApp.use(express.json());
    authorizedApp.use((req, _res, next) => {
      (req as any).companyId = allowedCompanyId;
      (req as any).actor = {
        type: "board",
        userId: "user-alpha",
        source: "session",
        companyIds: [allowedCompanyId],
      };
      next();
    });
    authorizedApp.use(governanceRoutes({} as any));
    authorizedApp.use(errorHandler);

    // 2. Unauthenticated App (No actor or session attached)
    unauthenticatedApp = express();
    unauthenticatedApp.use(express.json());
    unauthenticatedApp.use((req, _res, next) => {
      (req as any).actor = { type: "none" };
      next();
    });
    unauthenticatedApp.use(governanceRoutes({} as any));
    unauthenticatedApp.use(errorHandler);

    // 3. Cross-Company Attacker App (User belongs to foreignCompanyId only, trying to access allowedCompanyId)
    crossCompanyAttackerApp = express();
    crossCompanyAttackerApp.use(express.json());
    crossCompanyAttackerApp.use((req, _res, next) => {
      (req as any).companyId = foreignCompanyId;
      (req as any).actor = {
        type: "board",
        userId: "user-attacker",
        source: "session",
        companyIds: [foreignCompanyId], // Has access ONLY to Bravo, not Alpha
      };
      next();
    });
    crossCompanyAttackerApp.use(governanceRoutes({} as any));
    crossCompanyAttackerApp.use(errorHandler);
  });

  describe("1. Unauthenticated Request Rejections", () => {
    it("denies unauthenticated requests to governance status and prompts", async () => {
      const res1 = await request(unauthenticatedApp).get(`/companies/${allowedCompanyId}/governance/status`);
      expect(res1.status).toBe(401);

      const res2 = await request(unauthenticatedApp).get(`/companies/${allowedCompanyId}/governance/prompts`);
      expect(res2.status).toBe(401);
    });
  });

  describe("2. Cross-Company IDOR Defense Matrix (Tenant Isolation)", () => {
    const governanceEndpoints = [
      { method: "get", path: `/companies/${allowedCompanyId}/governance/status` },
      { method: "get", path: `/companies/${allowedCompanyId}/governance/prompts` },
      { method: "get", path: `/companies/${allowedCompanyId}/governance/documents` },
      { method: "post", path: `/companies/${allowedCompanyId}/governance/kickoff`, body: { projectName: "P", problem: "P", targetUsers: "U", goals: "G" } },
    ];

    for (const ep of governanceEndpoints) {
      it(`blocks cross-tenant access to Governance [${ep.method.toUpperCase()}] ${ep.path}`, async () => {
        const reqBuilder = (request(crossCompanyAttackerApp) as any)[ep.method](ep.path);
        if (ep.body) reqBuilder.send(ep.body);
        const res = await reqBuilder;
        expect(res.status).toBe(403);
      });
    }
  });

  describe("3. Authorized Same-Tenant Access", () => {
    it("allows authorized operator to access their own governance resources", async () => {
      const govRes = await request(authorizedApp).get(`/companies/${allowedCompanyId}/governance/prompts`);
      expect(govRes.status).toBe(200);
    });
  });

  describe("4. Public Endpoint Allowlist (No Auth Required)", () => {
    it("permits unauthenticated access to health endpoint", async () => {
      const publicApp = express();
      publicApp.get("/api/health", (_req, res) => res.json({ status: "ok" }));

      const healthRes = await request(publicApp).get("/api/health");
      expect(healthRes.status).toBe(200);
      expect(healthRes.body.status).toBe("ok");
    });
  });
});
