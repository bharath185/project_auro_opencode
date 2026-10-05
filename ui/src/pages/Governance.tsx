import { useState, useEffect } from "react";
import { useCompany } from "@/context/CompanyContext";
import { CEOInteractiveDiscovery } from "@/components/CEOInteractiveDiscovery";
import { ProjectKickoffWizard } from "@/components/ProjectKickoffWizard";
import { GovernanceOrgCard } from "@/components/GovernanceOrgCard";
import { GovernancePromptEditor } from "@/components/GovernancePromptEditor";
import { DocumentCenter } from "@/components/DocumentCenter";
import { TeamAssignmentView } from "@/components/TeamAssignmentView";
import { governanceApi, type GovernanceOrgStatus, type KickoffResponse } from "@/api/governance";
import {
  Sparkles,
  ShieldCheck,
  FileCode,
  BookOpen,
  Users,
  Download,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  MessageSquareCode,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Governance() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"ceo" | "docs" | "team" | "org" | "kickoff" | "prompts">("ceo");
  const [orgStatus, setOrgStatus] = useState<GovernanceOrgStatus | null>(null);
  const [docSummary, setDocSummary] = useState<{ count: number; packStatus: string; projectName: string }>({
    count: 12,
    packStatus: "in_review",
    projectName: "Sarees Selling E-Commerce Platform",
  });

  const refreshSummary = () => {
    if (!selectedCompany?.id) return;
    governanceApi.getStatus(selectedCompany.id)
      .then((data) => setOrgStatus(data))
      .catch(() => {});

    governanceApi.listDocuments(selectedCompany.id)
      .then((data) => {
        setDocSummary({
          count: data.documents.length,
          packStatus: data.packStatus,
          projectName: data.projectName,
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshSummary();
  }, [selectedCompany?.id]);

  const handlePlanGenerated = (result: KickoffResponse) => {
    setDocSummary({
      count: Object.keys(result.documents || {}).length,
      packStatus: "in_review",
      projectName: result.projectName,
    });
    setActiveTab("docs");
  };

  if (!selectedCompany) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Select or create a company to manage Project Governance.
      </div>
    );
  }

  const companyId = selectedCompany.id;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 1. Ant-Design Pro Executive Header & Metric Cards */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Project Auro Governance
                  </h1>
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs font-semibold">
                    {docSummary.projectName}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autonomous C-Suite Leadership (CEO, CTO, PM) &bull; Interactive Q&amp;A Discovery &bull; 12 Technical Specs &bull; Employee Download Packages
                </p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Export Center Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
            >
              <a href={governanceApi.getZipExportUrl(companyId)} download>
                <FolderArchive className="mr-1.5 h-3.5 w-3.5 text-primary" /> Download .ZIP Pack
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
            >
              <a href={governanceApi.getJiraExportUrl(companyId)} download>
                <Layers className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Jira CSV
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-9 font-medium shadow-xs border-border hover:bg-accent"
            >
              <a href={governanceApi.getXlsxExportUrl(companyId)} download>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Sprint XLSX
              </a>
            </Button>

            <Button
              variant="default"
              size="sm"
              asChild
              className="text-xs h-9 font-medium shadow-xs"
            >
              <a href={governanceApi.getMarkdownExportUrl(companyId)} download>
                <FileText className="mr-1.5 h-3.5 w-3.5" /> All Markdown
              </a>
            </Button>
          </div>
        </div>

        {/* Executive KPI Stats Bar (Ant Pro Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">
                CEO &bull; CTO &bull; PM
              </div>
              <div className="text-(length:--text-micro) text-muted-foreground font-medium">Core C-Suite Trio</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">{docSummary.count} / 12</div>
              <div className="text-(length:--text-micro) text-muted-foreground font-medium">Technical Documents</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">13 Stories</div>
              <div className="text-(length:--text-micro) text-muted-foreground font-medium">Sprint Backlog Epics</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-2xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">100% Ready</div>
              <div className="text-(length:--text-micro) text-muted-foreground font-medium">Employee Hand-off</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ant-Design Segmented Navigation Tabs */}
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
          CEO Discovery &amp; Planning
          <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">Interactive</span>
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
          12 Technical Documents
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">12</span>
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

        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === "prompts"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <FileCode className="h-3.5 w-3.5 text-purple-500" />
          Governance Prompts
        </button>
      </div>

      {/* 3. Tab Content Stage */}
      <div className="pt-1 flex justify-center">
        {activeTab === "ceo" && (
          <CEOInteractiveDiscovery
            companyId={selectedCompany.id}
            onPlanGenerated={handlePlanGenerated}
          />
        )}

        {activeTab === "docs" && (
          <DocumentCenter companyId={selectedCompany.id} />
        )}

        {activeTab === "team" && (
          <TeamAssignmentView companyId={selectedCompany.id} />
        )}

        {activeTab === "org" && (
          <GovernanceOrgCard companyId={selectedCompany.id} />
        )}

        {activeTab === "kickoff" && (
          <ProjectKickoffWizard
            companyId={selectedCompany.id}
            onSuccess={handlePlanGenerated}
          />
        )}

        {activeTab === "prompts" && (
          <GovernancePromptEditor />
        )}
      </div>
    </div>
  );
}
