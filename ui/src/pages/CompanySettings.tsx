import { ChangeEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { companiesApi } from "../api/companies";
import { assetsApi } from "../api/assets";
import { agentsApi } from "../api/agents";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  Sparkles,
  Save,
  Cpu,
  ShieldCheck,
  FolderKanban,
  FileCode,
  Users,
} from "lucide-react";
import { CompanyPatternIcon } from "../components/CompanyPatternIcon";
import { Field } from "../components/agent-config-primitives";

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Fast & High Intelligence - Recommended)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep Reasoning & Architecture Planning)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Ultra-Low Latency)" },
];

const OPENCODE_MODELS = [
  { id: "opencode/deepseek-v4-pro", label: "OpenCode DeepSeek V4 Pro (Complex Reasoning - Recommended)" },
  { id: "opencode/deepseek-v4-flash", label: "OpenCode DeepSeek V4 Flash (High Speed Execution)" },
  { id: "opencode/kimi-k2.7-code", label: "OpenCode Kimi K2.7 Code (Architecture & OpenAPI)" },
];

export function CompanySettings() {
  const {
    selectedCompany,
    selectedCompanyId,
  } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  // General settings local state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Governance Defaults
  const [leadArchitectName, setLeadArchitectName] = useState(() => localStorage.getItem("auro_lead_architect") || "Senior Principal Architect");
  const [defaultSprintWeeks, setDefaultSprintWeeks] = useState(() => localStorage.getItem("auro_sprint_weeks") || "2");
  const [defaultTestingStrategy, setDefaultTestingStrategy] = useState(() => localStorage.getItem("auro_qa_strategy") || "Automated Unit + E2E + Contract Tests");

  // AI Provider local state
  const [aiProvider, setAiProvider] = useState<"gemini" | "opencode">(() => (localStorage.getItem("auro_ai_provider") as "gemini" | "opencode") || "gemini");
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("auro_gemini_key") || "");
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem("auro_gemini_model") || "gemini-2.5-flash");
  const [openCodeApiKey, setOpenCodeApiKey] = useState(() => localStorage.getItem("auro_opencode_key") || "");
  const [openCodeModel, setOpenCodeModel] = useState(() => localStorage.getItem("auro_opencode_model") || "opencode/deepseek-v4-pro");
  const [applyToAgents, setApplyToAgents] = useState(true);
  const [isUpdatingAgents, setIsUpdatingAgents] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync local state from selected company
  useEffect(() => {
    if (!selectedCompany) return;
    setCompanyName(selectedCompany.name);
    setDescription(selectedCompany.description ?? "");
    setLogoUrl(selectedCompany.logoUrl ?? "");
  }, [selectedCompany]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Governance Hub", href: "/governance" },
      { label: "Settings & AI Configuration" }
    ]);
  }, [setBreadcrumbs]);

  const generalMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string | null;
    }) => companiesApi.update(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });

  const syncLogoState = (nextLogoUrl: string | null) => {
    setLogoUrl(nextLogoUrl ?? "");
    void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  };

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) =>
      assetsApi
        .uploadCompanyLogo(selectedCompanyId!, file)
        .then((asset) => companiesApi.update(selectedCompanyId!, { logoAssetId: asset.assetId })),
    onSuccess: (company) => {
      syncLogoState(company.logoUrl);
    }
  });

  const handleSaveAll = async () => {
    localStorage.setItem("auro_lead_architect", leadArchitectName);
    localStorage.setItem("auro_sprint_weeks", defaultSprintWeeks);
    localStorage.setItem("auro_qa_strategy", defaultTestingStrategy);

    localStorage.setItem("auro_ai_provider", aiProvider);
    localStorage.setItem("auro_gemini_key", geminiApiKey);
    localStorage.setItem("auro_gemini_model", geminiModel);
    localStorage.setItem("auro_opencode_key", openCodeApiKey);
    localStorage.setItem("auro_opencode_model", openCodeModel);

    if (companyName.trim() && selectedCompanyId) {
      generalMutation.mutate({
        name: companyName.trim(),
        description: description.trim() || null,
      });
    }

    if (applyToAgents && selectedCompanyId) {
      setIsUpdatingAgents(true);
      try {
        const agents = await agentsApi.list(selectedCompanyId);
        const activeAgents = agents.filter((a) => a.status !== "terminated");
        const targetAdapter = aiProvider === "gemini" ? "gemini_local" : "opencode_local";
        const targetModel = aiProvider === "gemini" ? geminiModel : openCodeModel;
        const targetKey = aiProvider === "gemini" ? geminiApiKey : openCodeApiKey;

        await Promise.allSettled(
          activeAgents.map((agent) =>
            agentsApi.update(
              agent.id,
              {
                adapterType: targetAdapter,
                runtimeConfig: {
                  ...((agent.runtimeConfig as Record<string, unknown>) || {}),
                  model: targetModel,
                  aiConnection: {
                    provider: aiProvider,
                    apiKey: targetKey ? targetKey : undefined,
                  },
                },
              },
              selectedCompanyId
            )
          )
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(selectedCompanyId) });
      } catch (err) {
        console.error("Failed to propagate AI provider settings to agents:", err);
      } finally {
        setIsUpdatingAgents(false);
      }
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (!selectedCompany) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No organization selected.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Governance &amp; AI Engine Settings</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure organization identity, C-suite AI model routing, and engineering standards.
          </p>
        </div>

        <Button size="sm" onClick={handleSaveAll} disabled={isUpdatingAgents} className="text-xs">
          <Save className="mr-1.5 h-3.5 w-3.5" /> {isUpdatingAgents ? "Applying Settings..." : "Save Changes"}
        </Button>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-foreground font-medium animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          Settings saved successfully. C-suite agent models ({aiProvider === "gemini" ? "Google Gemini" : "OpenCode"}) updated.
        </div>
      )}

      {/* 1. General Organization Profile */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Organization Profile &amp; Control Plane</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs">
              AURO Instance
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Display name and description for this Project Auro governance control plane.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Organization Name" hint="Corporate or workspace title.">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Project Auro Governance"
              />
            </Field>

            <Field label="Description" hint="Scope or executive charter.">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Autonomous C-Suite Engineering Control Plane"
              />
            </Field>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain rounded-lg" />
              ) : (
                <CompanyPatternIcon companyName={selectedCompany.name} logoUrl={logoUrl} className="h-7 w-7" />
              )}
            </div>
            <div>
              <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                Upload Custom Logo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) logoUploadMutation.mutate(file);
                  }}
                />
              </label>
              <p className="text-(length:--text-micro) text-muted-foreground mt-0.5">PNG, JPG, or SVG up to 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. AI Intelligence Engine (Gemini & OpenCode) */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">C-Suite AI Intelligence Engine</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs">
              Gemini &amp; OpenCode Supported
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Configure the underlying foundation model for CEO, CTO, Product Manager, Lead Architect, QA, DevOps, and Security agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gemini Option */}
            <div
              onClick={() => setAiProvider("gemini")}
              className={`cursor-pointer rounded-lg border p-3.5 transition-all flex flex-col justify-between gap-2 ${
                aiProvider === "gemini"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                  <Cpu className="h-4 w-4 text-primary" /> Google Gemini (Official)
                </div>
                {aiProvider === "gemini" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-(length:--text-micro) text-muted-foreground leading-relaxed">
                Native multi-modal intelligence with deep contextual grounding and ultra-fast generation.
              </p>
            </div>

            {/* OpenCode Option */}
            <div
              onClick={() => setAiProvider("opencode")}
              className={`cursor-pointer rounded-lg border p-3.5 transition-all flex flex-col justify-between gap-2 ${
                aiProvider === "opencode"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> OpenCode / DeepSeek
                </div>
                {aiProvider === "opencode" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-(length:--text-micro) text-muted-foreground leading-relaxed">
                Advanced reasoning models optimized for software architecture, OpenAPI specs, and test planning.
              </p>
            </div>
          </div>

          {/* Gemini Config Fields */}
          {aiProvider === "gemini" && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Field label="Gemini API Key" hint="Google AI Studio or Vertex API key.">
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy••••••••••••••••"
                />
              </Field>

              <Field label="Primary Gemini Model" hint="Default model routed to C-suite agents for document generation.">
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* OpenCode Config Fields */}
          {aiProvider === "opencode" && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Field label="OpenCode Gateway API Key (Optional)" hint="Optional bearer key if using private gateway.">
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
                  type="password"
                  value={openCodeApiKey}
                  onChange={(e) => setOpenCodeApiKey(e.target.value)}
                  placeholder="sk-••••••••••••••••"
                />
              </Field>

              <Field label="Primary OpenCode Model" hint="Reasoning model for architectural docs and risk assessment.">
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  value={openCodeModel}
                  onChange={(e) => setOpenCodeModel(e.target.value)}
                >
                  {OPENCODE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="applyAgents"
              checked={applyToAgents}
              onChange={(e) => setApplyToAgents(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="applyAgents" className="text-xs text-foreground font-medium cursor-pointer">
              Automatically synchronize this model across all 6 C-Suite agents (CEO, CTO, PM, QA, DevOps, Security)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 3. Engineering & Governance Standards */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Governance &amp; Sprint Execution Standards</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs">
              Project Defaults
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Baseline parameters injected into generated documents and sprint breakdown artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Lead Architect Title" hint="Sign-off title for architecture specs.">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                type="text"
                value={leadArchitectName}
                onChange={(e) => setLeadArchitectName(e.target.value)}
                placeholder="e.g. Principal Architect"
              />
            </Field>

            <Field label="Default Sprint Cadence" hint="Sprint cycle duration in weeks.">
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                value={defaultSprintWeeks}
                onChange={(e) => setDefaultSprintWeeks(e.target.value)}
              >
                <option value="1">1 Week Sprints</option>
                <option value="2">2 Weeks Sprints (Standard)</option>
                <option value="3">3 Weeks Sprints</option>
                <option value="4">4 Weeks Sprints (Monthly)</option>
              </select>
            </Field>

            <Field label="QA Test Gate Policy" hint="Test coverage baseline requirement.">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                type="text"
                value={defaultTestingStrategy}
                onChange={(e) => setDefaultTestingStrategy(e.target.value)}
                placeholder="e.g. 85%+ Unit & E2E Coverage"
              />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
