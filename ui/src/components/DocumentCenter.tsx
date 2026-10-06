import { useState, useEffect } from "react";
import {
  governanceApi,
  type GovernanceDocSummary,
  type GovernanceDocDetail,
} from "@/api/governance";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Download,
  ShieldCheck,
  Send,
  GitCompare,
  Save,
  FileCode,
  Layers,
  Sparkles,
  FolderArchive,
  FileSpreadsheet,
  BookOpen,
  Users,
  CheckSquare,
  Copy,
  Check,
  ExternalLink,
  Target,
  Cpu,
  Workflow,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentCenterProps {
  companyId: string;
  projectId?: string;
}

const DOC_GROUPS = [
  {
    title: "Strategic Vision & Goals",
    icon: Target,
    color: "text-amber-500",
    kinds: ["charter", "prd"],
  },
  {
    title: "Architecture & Specifications",
    icon: Cpu,
    color: "text-blue-500",
    kinds: ["architecture", "tech_stack", "db_openapi"],
  },
  {
    title: "Engineering Delivery & Sprints",
    icon: Workflow,
    color: "text-emerald-500",
    kinds: ["execution_plan", "sprint_plan", "team_allocation"],
  },
  {
    title: "Quality & Security Governance",
    icon: Lock,
    color: "text-purple-500",
    kinds: ["test_strategy", "cicd_infra", "threat_model", "risk_raci"],
  },
];

export function DocumentCenter({ companyId, projectId }: DocumentCenterProps) {
  const [docList, setDocList] = useState<GovernanceDocSummary[]>([]);
  const [packStatus, setPackStatus] = useState<"draft" | "in_review" | "approved">("in_review");
  const [projectName, setProjectName] = useState("Project Auro");
  const [selectedKind, setSelectedKind] = useState<string>("charter");
  const [currentDoc, setCurrentDoc] = useState<GovernanceDocDetail | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [activeTab, setActiveTab] = useState<"view" | "edit" | "diff" | "reviews">("view");
  const [diffVersion, setDiffVersion] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHandoffGuide, setShowHandoffGuide] = useState(false);

  // New review form
  const [reviewerRole, setReviewerRole] = useState("cto");
  const [reviewStatus, setReviewStatus] = useState<"approved" | "changes_requested">("approved");
  const [reviewComments, setReviewComments] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.listDocuments(companyId, projectId);
      setDocList(res.documents);
      setPackStatus(res.packStatus);
      setProjectName(res.projectName);
      if (res.documents.length > 0 && !selectedKind) {
        setSelectedKind(res.documents[0].kind);
      }
    } catch {
      setErrorMessage("Failed to load governance documents");
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentDoc = async (kind: string) => {
    try {
      const doc = await governanceApi.getDocument(companyId, kind, projectId);
      setCurrentDoc(doc);
      setEditedContent(doc.content);
      if (doc.versions.length > 1) {
        setDiffVersion(doc.versions.length - 1);
      } else {
        setDiffVersion(1);
      }
    } catch {
      setErrorMessage(`Failed to load document: ${kind}`);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [companyId, projectId]);

  useEffect(() => {
    if (selectedKind) {
      loadCurrentDoc(selectedKind);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [selectedKind, companyId, projectId]);

  const handleSaveDocument = async () => {
    if (!selectedKind || !editedContent.trim()) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await governanceApi.updateDocument(
        companyId,
        selectedKind,
        editedContent,
        changeSummary,
      );
      setSuccessMessage(`Document updated to v${res.version}`);
      setChangeSummary("");
      loadDocuments();
      loadCurrentDoc(selectedKind);
      setActiveTab("view");
    } catch {
      setErrorMessage("Failed to update document");
    } finally {
      setSaving(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKind || !reviewComments.trim()) return;
    try {
      await governanceApi.reviewDocument(companyId, selectedKind, {
        reviewerRole,
        status: reviewStatus,
        comments: reviewComments,
      });
      setReviewComments("");
      setSuccessMessage("Review comment recorded successfully");
      loadCurrentDoc(selectedKind);
    } catch {
      setErrorMessage("Failed to post review comment");
    }
  };

  const handleCeoApprovePack = async () => {
    setApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await governanceApi.approvePack(companyId);
      setPackStatus("approved");
      setSuccessMessage(res.message);
      loadDocuments();
    } catch {
      setErrorMessage("Cannot approve pack: ensure all 12 documents are complete and valid.");
    } finally {
      setApproving(false);
    }
  };

  const handleCopy = () => {
    if (!currentDoc) return;
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comparedVersion =
    currentDoc?.versions.find((v) => v.version === diffVersion) || currentDoc?.versions[0];

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Pack Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Document Center: {projectName}
            </h2>
            <Badge
              variant="secondary"
              className={`text-xs font-semibold ${
                packStatus === "approved"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              {packStatus === "approved" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock className="mr-1 h-3.5 w-3.5" />}
              {packStatus === "approved" ? "Pack Approved by CEO" : "In Review"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Canonical 12-document governance pack, automated section validation, version diffs, and multi-format exports.
          </p>
        </div>

        {/* CEO Approval & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {packStatus !== "approved" ? (
            <Button
              type="button"
              onClick={handleCeoApprovePack}
              disabled={approving}
              size="sm"
              className="text-xs font-semibold shadow-xs"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              {approving ? "Approving..." : "CEO Pack Sign-off"}
            </Button>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-3 py-1">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Formally Approved
            </Badge>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHandoffGuide(!showHandoffGuide)}
            className="text-xs font-semibold border-border"
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {showHandoffGuide ? "Hide Guide" : "Employee Hand-off Guide"}
          </Button>
        </div>
      </div>

      {/* Prominent Employee Project Package Download Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-muted/20 p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FolderArchive className="h-4 w-4 text-primary" />
              Complete Engineering Project Pack for Human Employees
            </h3>
            <p className="text-xs text-muted-foreground">
              Download the entire project package (12 technical docs, Agile sprint backlog, Jira CSV, and developer hand-off guide) for manual execution by your engineers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              asChild
              className="text-xs font-semibold shadow-xs"
            >
              <a href={governanceApi.getZipExportUrl(companyId, projectId)} download>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download Full .ZIP
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium border-border"
            >
              <a href={governanceApi.getJiraExportUrl(companyId, projectId)} download>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Jira CSV
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium border-border"
            >
              <a href={governanceApi.getXlsxExportUrl(companyId, projectId)} download>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Sprint XLSX
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium border-border"
            >
              <a href={governanceApi.getMarkdownExportUrl(companyId, projectId)} download>
                <FileText className="mr-1.5 h-3.5 w-3.5" /> All-in-One MD
              </a>
            </Button>
          </div>
        </div>

        {/* Expandable Employee Hand-off Roadmap */}
        {showHandoffGuide && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-2xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Step 1: Assign Team Roles
              </span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Distribute <strong>TEAM_ALLOCATION.md</strong> and <strong>RISK_RACI.md</strong> to assign Lead Architects, Backend, Frontend, QA, and DevOps engineers.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-2xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-blue-500" /> Step 2: Import Jira Backlog
              </span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Import <strong>JIRA_IMPORT.csv</strong> into your Jira, Linear, or GitHub Project board to populate all Epics, User Stories, and Gherkin Acceptance Criteria.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-2xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-500" /> Step 3: Implement &amp; Verify
              </span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Have developers follow <strong>ARCHITECTURE.md</strong> and <strong>DB_OPENAPI.md</strong>, and enforce test suites outlined in <strong>TEST_STRATEGY.md</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Document List (Left) + Document Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document Sidebar (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs space-y-4">
            <div className="px-2 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>12 Governance Deliverables</span>
                <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded-full">{docList.length} / 12</span>
              </h3>
            </div>

            {DOC_GROUPS.map((group) => {
              const Icon = group.icon;
              const groupDocs = docList.filter((d) => group.kinds.includes(d.kind));
              if (groupDocs.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-muted-foreground">
                    <Icon className={`h-3.5 w-3.5 ${group.color}`} />
                    <span>{group.title}</span>
                  </div>

                  <div className="space-y-1">
                    {groupDocs.map((d) => (
                      <button
                        key={d.kind}
                        type="button"
                        onClick={() => setSelectedKind(d.kind)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                          selectedKind === d.kind
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                            : "text-foreground hover:bg-muted/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`h-3.5 w-3.5 shrink-0 ${selectedKind === d.kind ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="truncate">{d.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-mono">v{d.currentVersion}</span>
                          {d.isValid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Workspace (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {currentDoc ? (
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-sm">
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {currentDoc.title}
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {currentDoc.fileName}
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span>Author: <strong className="uppercase text-foreground">{currentDoc.authorRole}</strong></span>
                    <span>&bull;</span>
                    <span>Version: <strong>v{currentDoc.currentVersion}</strong></span>
                    <span>&bull;</span>
                    <span>
                      {currentDoc.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Valid Structure
                        </span>
                      ) : (
                        <span className="text-destructive font-medium inline-flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Missing Sections
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Tab Switcher & Copy Action */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="text-xs h-8 px-2.5 border-border"
                    title="Copy Markdown"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="ml-1 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                  </Button>

                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("view")}
                      className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                        activeTab === "view" ? "bg-card text-foreground shadow-2xs border border-border/60" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                        activeTab === "edit" ? "bg-card text-foreground shadow-2xs border border-border/60" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("diff")}
                      className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                        activeTab === "diff" ? "bg-card text-foreground shadow-2xs border border-border/60" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Diff ({currentDoc.versions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reviews")}
                      className={`px-3 py-1 rounded-lg transition-all font-semibold inline-flex items-center gap-1 ${
                        activeTab === "reviews" ? "bg-card text-foreground shadow-2xs border border-border/60" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" /> Reviews ({currentDoc.reviews.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 1: Markdown Preview */}
              {activeTab === "view" && (
                <div className="rounded-xl border border-border bg-muted/15 p-5 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap overflow-x-auto max-h-[650px] scrollbar-thin">
                  {currentDoc.content}
                </div>
              )}

              {/* TAB 2: Markdown Editor */}
              {activeTab === "edit" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Markdown Content
                    </label>
                    <textarea
                      rows={16}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Change Summary (Revision notes)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Updated database ER diagram and added rate limiting section"
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("view")}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveDocument}
                      disabled={saving}
                      className="text-xs font-semibold"
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      {saving ? "Saving..." : "Save Revision"}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: Diff Comparison */}
              {activeTab === "diff" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Comparing Current Version (v{currentDoc.currentVersion}) with:
                    </span>
                    <select
                      value={diffVersion}
                      onChange={(e) => setDiffVersion(Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                    >
                      {currentDoc.versions.map((v) => (
                        <option key={v.version} value={v.version}>
                          v{v.version} - {v.authorRole} ({v.changeSummary || "No notes"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-muted/15 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-foreground">
                        Baseline Version v{comparedVersion?.version || 1}
                      </h4>
                      <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground max-h-96 overflow-y-auto">
                        {comparedVersion?.content}
                      </pre>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-foreground">
                        Current Version v{currentDoc.currentVersion}
                      </h4>
                      <pre className="text-[11px] font-mono whitespace-pre-wrap text-foreground max-h-96 overflow-y-auto">
                        {currentDoc.content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Reviews & Sign-offs */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Review History ({currentDoc.reviews.length})
                    </h4>
                    {currentDoc.reviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
                        No reviews recorded yet for this document.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {currentDoc.reviews.map((r, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-border bg-card p-3.5 space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs uppercase text-foreground">
                                {r.reviewerRole}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] font-semibold ${
                                  r.status === "approved"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}
                              >
                                {r.status === "approved" ? "Approved" : "Changes Requested"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">{r.comments}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handlePostReview} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground">
                      Submit Role Sign-off / Review Comment
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Reviewer Role
                        </label>
                        <select
                          value={reviewerRole}
                          onChange={(e) => setReviewerRole(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                        >
                          <option value="ceo">CEO (Chief Executive Officer)</option>
                          <option value="cto">CTO (Chief Technology Officer)</option>
                          <option value="pm">PM (Product Manager)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Disposition Status
                        </label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value as any)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                        >
                          <option value="approved">Approved</option>
                          <option value="changes_requested">Changes Requested</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Review Notes &amp; Verification Checklist
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Verified compliance with OpenAPI spec and sub-200ms latency targets."
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" size="sm" className="text-xs font-semibold">
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Review
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              Select a document from the deliverables list to preview or edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
