import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { governanceApi, type KickoffResponse, type ProjectKickoffBriefPayload } from "@/api/governance";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  FileText,
  Users,
  ShieldCheck,
  Cpu,
  Layers,
  FolderArchive,
  FileSpreadsheet,
} from "lucide-react";

interface ProjectKickoffWizardProps {
  companyId: string;
  onSuccess?: (result: KickoffResponse) => void;
  onCancel?: () => void;
}

const STACK_PRESETS = [
  "TypeScript, React, Node.js, PostgreSQL, Redis, Docker",
  "Next.js 15, Tailwind CSS, Prisma, PostgreSQL, Vercel",
  "Python, FastAPI, Celery, PostgreSQL, Redis, Kubernetes",
  "Go, Gin, gRPC, PostgreSQL, Docker, AWS ECS",
];

export function ProjectKickoffWizard({
  companyId,
  onSuccess,
  onCancel,
}: ProjectKickoffWizardProps) {
  const [formData, setFormData] = useState<ProjectKickoffBriefPayload>({
    projectName: "",
    problem: "",
    targetUsers: "",
    goals: "",
    constraints: "",
    budget: "",
    deadline: "",
    preferredStack: "TypeScript, React, Node.js, PostgreSQL, Redis, Docker",
    integrations: "",
    teamSizeAndSkills: "",
    attachments: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KickoffResponse | null>(null);

  const handleChange = (field: keyof ProjectKickoffBriefPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName.trim()) {
      setError("Project Name is required.");
      return;
    }
    if (!formData.problem.trim()) {
      setError("Problem Statement is required.");
      return;
    }
    if (!formData.targetUsers.trim()) {
      setError("Target Users specification is required.");
      return;
    }
    if (!formData.goals.trim()) {
      setError("Project Goals are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await governanceApi.submitKickoff(companyId, formData);
      setResult(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate project kickoff orchestration.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Card className="w-full max-w-4xl border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Project Kickoff Orchestrated Successfully
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Executive Goal for <strong>{result.projectName}</strong> has been created and assigned to the CEO.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Company Goal ID
              </span>
              <p className="font-mono text-xs text-foreground truncate">{result.goalId}</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Kickoff Issue ID
              </span>
              <p className="font-mono text-xs text-foreground truncate">{result.kickoffIssueId || result.goalId}</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                12 Technical Documents &amp; Sprint Backlog Generated
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                {Object.keys(result.documents || {}).length} Documents Complete
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" asChild className="text-xs font-semibold shadow-xs">
                <a href={governanceApi.getZipExportUrl(companyId)} download>
                  <FolderArchive className="mr-1.5 h-3.5 w-3.5" /> Download Full .ZIP
                </a>
              </Button>

              <Button variant="outline" size="sm" asChild className="text-xs font-medium border-border">
                <a href={governanceApi.getJiraExportUrl(companyId)} download>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Jira CSV
                </a>
              </Button>

              <Button variant="outline" size="sm" asChild className="text-xs font-medium border-border">
                <a href={governanceApi.getXlsxExportUrl(companyId)} download>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Sprint XLSX
                </a>
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResult(null)}
              className="text-xs"
            >
              Start Another Kickoff
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (onSuccess) onSuccess(result);
              }}
              className="text-xs font-semibold"
            >
              Go to Document Center <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Project Kickoff &amp; Document Generation Wizard
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Input project requirements, tech stack, and constraints. C-suite agents will autonomously generate 12 validated technical documents and sprint epics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Project Identity */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary" /> Step 1: Project Core Identity
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Project Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Medical Diagnosis Hub"
                  value={formData.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target Users &amp; Market <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical Radiologists, Hospital Administrators"
                  value={formData.targetUsers}
                  onChange={(e) => handleChange("targetUsers", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Problem Statement &amp; Executive Context <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe the core business problem, user pain points, and current workflow deficiencies..."
                value={formData.problem}
                onChange={(e) => handleChange("problem", e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Project Goals &amp; Success Criteria <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Specific measurable outcomes, delivery milestones, and SLA expectations..."
                value={formData.goals}
                onChange={(e) => handleChange("goals", e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Section 2: Technical Architecture & Stack */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-blue-500" /> Step 2: Architecture &amp; Stack Preferences
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Preferred Technology Stack &amp; Infrastructure
              </label>
              <input
                type="text"
                placeholder="e.g. TypeScript, React, Node.js, PostgreSQL, Redis, Docker"
                value={formData.preferredStack || ""}
                onChange={(e) => handleChange("preferredStack", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground">Presets:</span>
                {STACK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleChange("preferredStack", preset)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-accent text-foreground transition-colors"
                  >
                    {preset.split(",")[0]} + {preset.split(",")[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Constraints (Compliance, Latency, Concurrency)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sub-200ms latency, HIPAA compliance, 10k CCU"
                  value={formData.constraints || ""}
                  onChange={(e) => handleChange("constraints", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Third-Party Integrations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, SendGrid, Algolia, S3"
                  value={formData.integrations || ""}
                  onChange={(e) => handleChange("integrations", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Timeline & Resources */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-emerald-500" /> Step 3: Timeline &amp; Team Capacity
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline || ""}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Budget Allocation ($)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50000"
                  value={formData.budget ? String(formData.budget) : ""}
                  onChange={(e) => handleChange("budget", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Team Size &amp; Skill Mix
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6 Devs, 2 QA, 1 DevOps"
                  value={formData.teamSizeAndSkills || ""}
                  onChange={(e) => handleChange("teamSizeAndSkills", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/10 rounded-b-xl">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="text-xs font-semibold shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Orchestrating C-Suite Kickoff...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate 12 Technical Documents
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
