import { useState, useEffect } from "react";
import { useCompany } from "@/context/CompanyContext";
import { MultiProjectManager } from "@/components/MultiProjectManager";
import { CEOInteractiveDiscovery } from "@/components/CEOInteractiveDiscovery";
import { DocumentCenter } from "@/components/DocumentCenter";
import { TeamAssignmentView } from "@/components/TeamAssignmentView";
import { GovernanceOrgCard } from "@/components/GovernanceOrgCard";
import {
  governanceApi,
  type GovernanceOrgStatus,
  type KickoffResponse,
  type GovernanceProjectSummary,
} from "@/api/governance";
import {
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Layers,
  FolderKanban,
  Plus,
  ArrowRight,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Governance() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"ceo" | "docs" | "team" | "projects" | "org">("ceo");
  const [projects, setProjects] = useState<GovernanceProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [activeProjectName, setActiveProjectName] = useState<string>("");
  const [activeProjectDomain, setActiveProjectDomain] = useState<string>("");
  const [orgStatus, setOrgStatus] = useState<GovernanceOrgStatus | null>(null);
  const [docSummary, setDocSummary] = useState<{ count: number; packStatus: string }>({
    count: 0,
    packStatus: "draft",
  });

  const loadProjectData = async () => {
    if (!selectedCompany?.id) return;
    try {
      const projRes = await governanceApi.listProjects(selectedCompany.id);
      const projList = projRes.projects || [];
      setProjects(projList);

      const currentActive =
        projList.find((p) => p.id === projRes.activeProjectId) ||
        (projList.length > 0 ? projList[0] : null);

      if (currentActive) {
        setActiveProjectId(currentActive.id);
        setActiveProjectName(currentActive.name);
        setActiveProjectDomain(currentActive.domain);

        const docRes = await governanceApi.listDocuments(selectedCompany.id, currentActive.id);
        setDocSummary({
          count: docRes.documents?.length || 0,
          packStatus: docRes.packStatus || "draft",
        });
      } else {
        setActiveProjectId("");
        setActiveProjectName("");
        setActiveProjectDomain("");
        setDocSummary({
          count: 0,
          packStatus: "draft",
        });
        setActiveTab("ceo");
      }

      const statusRes = await governanceApi.getStatus(selectedCompany.id);
      setOrgStatus(statusRes);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [selectedCompany?.id]);

  const handleSelectProject = (projectId: string, tabToOpen?: "ceo" | "docs" | "team") => {
    setActiveProjectId(projectId);
    const found = projects.find((p) => p.id === projectId);
    if (found) {
      setActiveProjectName(found.name);
      setActiveProjectDomain(found.domain);
    }
    if (tabToOpen) {
      setActiveTab(tabToOpen);
    }
  };

  const handlePlanGenerated = (result: KickoffResponse, newProjId?: string) => {
    if (newProjId) {
      setActiveProjectId(newProjId);
    }
    setActiveProjectName(result.projectName);
    setDocSummary({
      count: Object.keys(result.documents || {}).length || 12,
      packStatus: "in_review",
    });
    loadProjectData();
    setActiveTab("docs");
  };

  if (!selectedCompany) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Select or create an organization to manage Project Governance.
      </div>
    );
  }

  const companyId = selectedCompany.id;
  const hasActiveProject = Boolean(activeProjectId && activeProjectName);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 1. Header & Active Project Showcase Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Project Auro Governance
                  </h1>
                  {hasActiveProject ? (
                    <>
                      <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs font-semibold">
                        {activeProjectName}
                      </Badge>
                      {activeProjectDomain && (
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {activeProjectDomain}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold">
                      New Project Planning Mode
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autonomous C-Suite Leadership (CEO, CTO, PM) &bull; Single-Project Workspace &bull; 12 Technical Specs &bull; Employee Download Packages
                </p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Export Center Toolbar for Active Project */}
          {hasActiveProject ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
              >
                <a href={governanceApi.getZipExportUrl(companyId, activeProjectId)} download>
                  <FolderArchive className="mr-1.5 h-3.5 w-3.5 text-primary" /> Download .ZIP Pack
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
              >
                <a href={governanceApi.getJiraExportUrl(companyId, activeProjectId)} download>
                  <Layers className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Jira CSV
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
              >
                <a href={governanceApi.getXlsxExportUrl(companyId, activeProjectId)} download>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Sprint XLSX
                </a>
              </Button>

              <Button
                variant="default"
                size="sm"
                asChild
                className="text-xs h-9 font-medium shadow-xs"
              >
                <a href={governanceApi.getMarkdownExportUrl(companyId, activeProjectId)} download>
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> All Markdown
                </a>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setActiveTab("ceo")}
              className="text-xs font-semibold shadow-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Start Real Project Discovery
            </Button>
          )}
        </div>

        {/* Executive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight truncate max-w-[140px]">
                {hasActiveProject ? activeProjectName : "No Active Project"}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Active Workspace Scope</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">
                {hasActiveProject ? `${docSummary.count} / 12` : "0 / 12"}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Technical Documents</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">
                {hasActiveProject ? "13 Stories" : "0 Stories"}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Sprint Backlog Epics</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">CEO &bull; CTO &bull; PM</div>
              <div className="text-[11px] text-muted-foreground font-medium">Core Leadership Trio</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border bg-muted/30 max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ceo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "ceo"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          AI Planning Workspace
          <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
            Interactive Q&amp;A
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "docs"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          12 Technical Specs &amp; Developer Tasks
          {docSummary.count > 0 && (
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
              {docSummary.count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "team"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-blue-500" />
          Team Allocation &amp; Sprint Tickets
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "projects"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <FolderKanban className="h-3.5 w-3.5 text-primary" />
          All Client Projects
          {projects.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
              {projects.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("org")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "org"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          C-Suite Hierarchy (CEO, CTO, PM)
        </button>
      </div>

      {/* 3. Tab Content View Stage */}
      <div className="pt-1 flex justify-center">
        {activeTab === "ceo" && (
          <CEOInteractiveDiscovery
            companyId={selectedCompany.id}
            projectId={activeProjectId || undefined}
            onPlanGenerated={handlePlanGenerated}
          />
        )}

        {activeTab === "docs" && (
          <DocumentCenter
            companyId={selectedCompany.id}
            projectId={activeProjectId || undefined}
          />
        )}

        {activeTab === "team" && (
          <TeamAssignmentView companyId={selectedCompany.id} />
        )}

        {activeTab === "projects" && (
          <MultiProjectManager
            companyId={selectedCompany.id}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onProjectCreated={(newId) => {
              loadProjectData();
              handleSelectProject(newId, "ceo");
            }}
          />
        )}

        {activeTab === "org" && (
          <GovernanceOrgCard companyId={selectedCompany.id} />
        )}
      </div>
    </div>
  );
}
