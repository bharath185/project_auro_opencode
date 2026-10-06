import { useState, useEffect } from "react";
import {
  governanceApi,
  type GovernanceProjectSummary,
} from "@/api/governance";
import {
  FolderKanban,
  Plus,
  Sparkles,
  BookOpen,
  FolderArchive,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  ShoppingBag,
  Building2,
  Stethoscope,
  CreditCard,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface MultiProjectManagerProps {
  companyId: string;
  activeProjectId?: string;
  onSelectProject: (projectId: string, tabToOpen?: "ceo" | "docs" | "team") => void;
  onProjectCreated?: (projectId: string) => void;
}

const PROJECT_TEMPLATES = [
  {
    name: "Sarees & Apparel E-Commerce Store",
    domain: "E-Commerce",
    icon: ShoppingBag,
    color: "amber",
    problem: "Online direct-to-consumer store for authentic ethnic sarees with blouse customization measurements, video reels preview, and multi-currency checkout.",
    targetUsers: "Ethnic apparel shoppers, bridal clients, international diaspora",
    goals: "Deliver high-converting storefront with catalog filters, tailor measurement forms, and automated logistics tracking.",
    preferredStack: "Next.js 15, Tailwind CSS, Node.js Fastify, PostgreSQL, Razorpay & Stripe",
  },
  {
    name: "B2B Sales CRM & Deal Pipeline",
    domain: "SaaS CRM",
    icon: Building2,
    color: "blue",
    problem: "Sales operations workspace with multi-stage visual deal boards, lead scoring, automated outreach cadence tracking, and revenue forecasting.",
    targetUsers: "Account executives, SDRs, VP of Sales, Revenue Operations",
    goals: "Real-time deal pipeline tracking with SLA alerts, meeting notes, and automated sync.",
    preferredStack: "React 19, Tailwind CSS, Express, PostgreSQL, Redis",
  },
  {
    name: "Telehealth Clinic & Patient EHR Suite",
    domain: "Healthcare",
    icon: Stethoscope,
    color: "emerald",
    problem: "Telemedicine portal with online doctor booking, HIPAA-compliant patient EHR records, digital prescriptions, and WebRTC video consults.",
    targetUsers: "Patients, registered physicians, clinic administrators",
    goals: "Streamlined virtual consultation flow with secure medical records and billing.",
    preferredStack: "Next.js 15, Tailwind CSS, FastAPI / Python, PostgreSQL, WebRTC",
  },
  {
    name: "Micro-Lending & Instant Credit App",
    domain: "FinTech",
    icon: CreditCard,
    color: "purple",
    problem: "Digital lending application with instant KYC verification, double-entry immutable financial ledger, auto-debit repayments, and credit scoring.",
    targetUsers: "Retail borrowers, micro-business owners, credit risk underwriters",
    goals: "Automated underwriting, loan disbursal within 5 minutes, and automated collections.",
    preferredStack: "React Native / Next.js, Go / Node.js, PostgreSQL, Plaid",
  },
];

export function MultiProjectManager({
  companyId,
  activeProjectId,
  onSelectProject,
  onProjectCreated,
}: MultiProjectManagerProps) {
  const [projects, setProjects] = useState<GovernanceProjectSummary[]>([]);
  const [currentActiveId, setCurrentActiveId] = useState<string>(activeProjectId || "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Project Form Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("E-Commerce");
  const [newProjectProblem, setNewProjectProblem] = useState("");
  const [newProjectUsers, setNewProjectUsers] = useState("");
  const [newProjectGoals, setNewProjectGoals] = useState("");
  const [newProjectStack, setNewProjectStack] = useState("");

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await governanceApi.listProjects(companyId);
      setProjects(res.projects || []);
      if (!currentActiveId && res.activeProjectId) {
        setCurrentActiveId(res.activeProjectId);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load projects list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadProjects();
    }
  }, [companyId]);

  useEffect(() => {
    if (activeProjectId) {
      setCurrentActiveId(activeProjectId);
    }
  }, [activeProjectId]);

  const handleSelect = async (projectId: string, tabToOpen: "ceo" | "docs" | "team" = "ceo") => {
    try {
      await governanceApi.selectProject(companyId, projectId);
      setCurrentActiveId(projectId);
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: p.id === projectId,
        }))
      );
      onSelectProject(projectId, tabToOpen);
    } catch (err: any) {
      setError(err?.message || "Failed to switch active project");
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project and all its specifications?")) {
      return;
    }
    try {
      const res = await governanceApi.deleteProject(companyId, projectId);
      if (res.activeProjectId) {
        setCurrentActiveId(res.activeProjectId);
      }
      await loadProjects();
    } catch (err: any) {
      setError(err?.message || "Failed to delete project");
    }
  };

  const handleApplyTemplate = (tpl: typeof PROJECT_TEMPLATES[0]) => {
    setNewProjectName(tpl.name);
    setNewProjectDomain(tpl.domain);
    setNewProjectProblem(tpl.problem);
    setNewProjectUsers(tpl.targetUsers);
    setNewProjectGoals(tpl.goals);
    setNewProjectStack(tpl.preferredStack);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await governanceApi.createProject(companyId, {
        name: newProjectName.trim(),
        domain: newProjectDomain,
        problem: newProjectProblem.trim() || undefined,
        targetUsers: newProjectUsers.trim() || undefined,
        goals: newProjectGoals.trim() || undefined,
        preferredStack: newProjectStack.trim() || undefined,
      });

      setIsCreating(false);
      // Reset form
      setNewProjectName("");
      setNewProjectProblem("");
      setNewProjectUsers("");
      setNewProjectGoals("");
      setNewProjectStack("");

      await loadProjects();
      setCurrentActiveId(res.activeProjectId);
      if (onProjectCreated) {
        onProjectCreated(res.activeProjectId);
      } else {
        onSelectProject(res.activeProjectId, "ceo");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/20 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Client Projects Portfolio
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage multiple customer client builds &bull; Switch active workspace &bull; Generate distinct technical document packs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setIsCreating(true);
              if (!newProjectName) {
                handleApplyTemplate(PROJECT_TEMPLATES[0]);
              }
            }}
            className="text-xs font-semibold shadow-xs"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Client Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* New Project Scaffolding Modal / Card */}
      {isCreating && (
        <Card className="border-2 border-primary/30 shadow-md bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Create New Client Project
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Start from an industry preset or define custom client requirements
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Presets Row */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Quick Industry Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {PROJECT_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = newProjectName === tpl.name;
                  return (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground"
                          : "border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{tpl.name}</div>
                        <div className="text-[10px] text-muted-foreground">{tpl.domain}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Sarees Selling E-Commerce Store"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Domain / Category</label>
                  <input
                    type="text"
                    value={newProjectDomain}
                    onChange={(e) => setNewProjectDomain(e.target.value)}
                    placeholder="e.g. E-Commerce, SaaS CRM"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Client Problem / Business Need
                </label>
                <textarea
                  rows={2}
                  value={newProjectProblem}
                  onChange={(e) => setNewProjectProblem(e.target.value)}
                  placeholder="Describe what the customer wants to build and key functionality..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Audience</label>
                  <input
                    type="text"
                    value={newProjectUsers}
                    onChange={(e) => setNewProjectUsers(e.target.value)}
                    placeholder="e.g. Ethnic wear shoppers, bridal boutiques"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Preferred Tech Stack</label>
                  <input
                    type="text"
                    value={newProjectStack}
                    onChange={(e) => setNewProjectStack(e.target.value)}
                    placeholder="e.g. Next.js 15, Tailwind, PostgreSQL"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newProjectName.trim()}
                  className="text-xs font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating Project...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Initialize &amp; Launch Discovery
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading project workspaces...
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-muted/10">
          <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No Projects Created Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Create your first client project to start autonomous CEO consultation, CTO architecture design, and PM sprint planning.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="mt-4 text-xs font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isActive = proj.id === currentActiveId || proj.isActive;
            return (
              <Card
                key={proj.id}
                className={`relative flex flex-col justify-between transition-all rounded-2xl border ${
                  isActive
                    ? "border-primary bg-gradient-to-b from-card via-card to-primary/5 ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-card hover:border-border/80 hover:shadow-sm"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {proj.domain || "Custom"}
                        </Badge>
                        {isActive && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                            Active Project
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold text-foreground leading-snug line-clamp-1">
                        {proj.name}
                      </CardTitle>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Project"
                      disabled={projects.length <= 1}
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                    {proj.problem || "Custom client project specification pack."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3 space-y-3">
                  {/* Status & Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-foreground">{proj.docCount || 12}</span>
                      <span className="text-muted-foreground text-[11px]">Specs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-semibold text-foreground">{proj.storyCount || 13}</span>
                      <span className="text-muted-foreground text-[11px]">Sprint Stories</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Status: <span className="font-medium text-foreground capitalize">{proj.packStatus.replace("_", " ")}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/50 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelect(proj.id, "ceo")}
                      className="text-xs font-semibold h-8.5 w-full"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                      AI Planning
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(proj.id, "docs")}
                      className="text-xs font-medium h-8.5 w-full"
                    >
                      <Code2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Specs &amp; Tasks
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-full text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    <a href={governanceApi.getZipExportUrl(companyId, proj.id)} download>
                      <FolderArchive className="mr-1.5 h-3.5 w-3.5 text-primary" /> Download 12-Doc Package (.ZIP)
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
