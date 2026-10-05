import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { governanceApi, type GovernanceOrgStatus } from "@/api/governance";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Users,
  Cpu,
  Workflow,
  Lock,
  Code2,
  Terminal,
  Layers,
  ArrowDown,
} from "lucide-react";

interface GovernanceOrgCardProps {
  companyId: string;
  onOrgProvisioned?: () => void;
}

const ROLES_INFO = [
  {
    role: "ceo",
    title: "Chief Executive Officer (CEO)",
    short: "CEO",
    icon: Sparkles,
    color: "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/30",
    responsibilities: "Project Charter, Executive Vision, Scope Boundary & Final Sign-off",
    defaultModel: "gemini-2.5-flash / opencode-deepseek",
    budgetMonthlyCents: 50000,
  },
  {
    role: "cto",
    title: "Chief Technology Officer (CTO)",
    short: "CTO",
    icon: Cpu,
    color: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/30",
    responsibilities: "System Architecture, Tech Stack Selection, DB Schema & OpenAPI Specs",
    defaultModel: "opencode/deepseek-v4-pro",
    budgetMonthlyCents: 30000,
  },
  {
    role: "pm",
    title: "Product Manager (PM)",
    short: "PM",
    icon: Layers,
    color: "from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/30",
    responsibilities: "PRD, User Stories, Epic Breakdown & Acceptance Criteria",
    defaultModel: "opencode/deepseek-v4-pro",
    budgetMonthlyCents: 20000,
  },
  {
    role: "qa",
    title: "Quality Assurance Lead (QA)",
    short: "QA Lead",
    icon: CheckCircle2,
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/30",
    responsibilities: "QA Test Strategy, Coverage Matrix, E2E Acceptance & Bug Tracking",
    defaultModel: "opencode/deepseek-v4-pro",
    budgetMonthlyCents: 15000,
  },
  {
    role: "devops",
    title: "DevOps & Infrastructure Lead",
    short: "DevOps",
    icon: Terminal,
    color: "from-cyan-500/20 to-cyan-500/5 text-cyan-500 border-cyan-500/30",
    responsibilities: "CI/CD Pipelines, Docker/K8s Runbooks & Deployment Infra",
    defaultModel: "opencode/deepseek-v4-pro",
    budgetMonthlyCents: 20000,
  },
  {
    role: "security",
    title: "Chief Information Security Officer (CISO)",
    short: "Security",
    icon: Lock,
    color: "from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/30",
    responsibilities: "STRIDE Threat Modeling, Security Policy & Risk RACI Governance",
    defaultModel: "opencode/kimi-k2.7-code",
    budgetMonthlyCents: 25000,
  },
];

export function GovernanceOrgCard({ companyId, onOrgProvisioned }: GovernanceOrgCardProps) {
  const [status, setStatus] = useState<GovernanceOrgStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await governanceApi.getStatus(companyId);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load governance org status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [companyId]);

  const handleProvision = async () => {
    setProvisioning(true);
    setError(null);
    setSuccess(false);

    try {
      await governanceApi.createOrg(companyId);
      setSuccess(true);
      await fetchStatus();
      if (onOrgProvisioned) {
        onOrgProvisioned();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision governance organization.");
    } finally {
      setProvisioning(false);
    }
  };

  const ceoRole = ROLES_INFO[0];
  const directReports = ROLES_INFO.slice(1);

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  C-Suite Organization Hierarchy
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Autonomous 6-role leadership team with CEO directing CTO, PM, QA, DevOps, and Security agents.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status?.isComplete ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold px-3 py-1">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Org Active (6/6 Agents)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs font-mono">
                  {status ? `${status.count}/6 Agents` : "Unconfigured"}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={loading || provisioning}
                className="text-xs border-border"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>

              <Button
                size="sm"
                onClick={handleProvision}
                disabled={provisioning}
                className="text-xs font-semibold shadow-xs"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {provisioning ? "Provisioning Agents..." : status?.isComplete ? "Re-sync Org" : "1-Click Provision Org"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Governance Organization successfully provisioned and synchronized!</span>
            </div>
          )}

          {/* Org Chart Visualization: CEO at the top */}
          <div className="flex flex-col items-center space-y-4">
            {/* CEO Card */}
            <div className="w-full max-w-md rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 shadow-sm space-y-3 text-center relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Executive Leadership
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">{ceoRole.title}</h3>
                <p className="text-xs text-muted-foreground">{ceoRole.responsibilities}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge variant="outline" className="text-[10px] font-mono bg-background/80">
                  Model: {status?.agents.find((a) => a.role === "ceo")?.adapterConfig?.model || "gemini-2.5-flash"}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  ${(ceoRole.budgetMonthlyCents / 100).toFixed(0)}/mo
                </Badge>
              </div>
            </div>

            {/* Downward Connector Arrow */}
            <div className="flex flex-col items-center text-muted-foreground">
              <div className="h-6 w-0.5 bg-border" />
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <ArrowDown className="h-3 w-3" /> Direct Reports &amp; Engineering Staff
              </div>
              <div className="h-6 w-0.5 bg-border" />
            </div>

            {/* Direct Reports Grid (5 columns / cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
              {directReports.map((role) => {
                const Icon = role.icon;
                const agent = status?.agents.find((a) => a.role === role.role);
                const isProvisioned = !!agent;

                return (
                  <div
                    key={role.role}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 border ${role.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {isProvisioned ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-foreground">{role.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                          {role.responsibilities}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        Model: {agent?.adapterConfig?.model || role.defaultModel}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Reports to: <strong>CEO</strong></span>
                        <span className="font-mono">${(role.budgetMonthlyCents / 100).toFixed(0)}/mo</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
