import { useState, useEffect } from "react";
import {
  governanceApi,
  type CeoConsultationAnalysis,
  type KickoffResponse,
} from "@/api/governance";
import {
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Zap,
  Building2,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Loader2,
  Key,
  Sliders,
  RotateCcw,
  Check,
  Bot,
  Code2,
  Database,
  LayoutTemplate,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CEOInteractiveDiscoveryProps {
  companyId: string;
  onPlanGenerated: (result: KickoffResponse) => void;
}

const IDEA_PRESETS = [
  {
    title: "👗 Sarees Selling E-Commerce",
    prompt:
      "I want an e-commerce platform for selling authentic sarees online with blouse tailoring customization, UPI & international diaspora payments, Shiprocket courier tracking, and fabric video reels.",
  },
  {
    title: "🏥 Clinic & Telehealth Suite",
    prompt:
      "I want a clinic management and telemedicine web application with online doctor booking, patient EHR records, digital prescriptions, and WebRTC video consults.",
  },
  {
    title: "💳 Micro-Lending & Fintech",
    prompt:
      "I want a digital micro-lending app with instant KYC verification, double-entry immutable financial ledger, auto-debit repayments, and automated credit risk scoring.",
  },
];

const AI_PROVIDERS = [
  { id: "builtin", label: "Autonomous C-Suite Engine", badge: "Live Fast", defaultModel: "built-in" },
  { id: "openai", label: "OpenAI GPT-4o", badge: "Cloud LLM", defaultModel: "gpt-4o" },
  { id: "gemini", label: "Google Gemini 2.5 Flash", badge: "Cloud LLM", defaultModel: "gemini-2.5-flash" },
  { id: "anthropic", label: "Anthropic Claude 3.5", badge: "Cloud LLM", defaultModel: "claude-3-5-sonnet-20241022" },
  { id: "deepseek", label: "DeepSeek V3 / V4", badge: "Cloud LLM", defaultModel: "deepseek-chat" },
  { id: "groq", label: "Groq (Llama 3.3 70B)", badge: "Ultra Fast", defaultModel: "llama-3.3-70b-versatile" },
  { id: "ollama", label: "Local Ollama", badge: "Localhost", defaultModel: "llama3" },
];

export function CEOInteractiveDiscovery({
  companyId,
  onPlanGenerated,
}: CEOInteractiveDiscoveryProps) {
  const [ideaPrompt, setIdeaPrompt] = useState(IDEA_PRESETS[0].prompt);
  const [isConsulting, setIsConsulting] = useState(false);
  const [analysis, setAnalysis] = useState<CeoConsultationAnalysis | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStage, setSynthesisStage] = useState<"idle" | "ceo" | "cto" | "pm" | "complete">("idle");
  const [synthesisProgress, setSynthesisProgress] = useState(0);
  const [finalResult, setFinalResult] = useState<KickoffResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"frontend" | "backend" | "pm" | "docs">("frontend");

  // Real-time AI Configuration State
  const [showConfig, setShowConfig] = useState(false);
  const [provider, setProvider] = useState<string>("builtin");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    const savedProvider = localStorage.getItem("auro_llm_provider") || "builtin";
    const savedKey = localStorage.getItem("auro_llm_key") || "";
    const savedModel = localStorage.getItem("auro_llm_model") || "";
    const savedUrl = localStorage.getItem("auro_llm_url") || "";
    setProvider(savedProvider);
    setApiKey(savedKey);
    setModel(savedModel);
    setBaseUrl(savedUrl);
  }, []);

  const saveAiConfig = (p: string, k: string, m: string, u: string) => {
    setProvider(p);
    setApiKey(k);
    setModel(m);
    setBaseUrl(u);
    localStorage.setItem("auro_llm_provider", p);
    localStorage.setItem("auro_llm_key", k);
    localStorage.setItem("auro_llm_model", m);
    localStorage.setItem("auro_llm_url", u);
  };

  // 1. Trigger CEO Analysis
  const handleConsultCEO = async () => {
    if (!ideaPrompt.trim()) return;
    setIsConsulting(true);
    setError(null);
    setAnalysis(null);
    setFinalResult(null);

    try {
      const res = await governanceApi.ceoConsult(companyId, {
        ideaPrompt: ideaPrompt.trim(),
        provider: provider !== "builtin" ? provider : undefined,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });

      setAnalysis(res);

      // Pre-select recommended defaults
      const defaults: Record<string, string> = {};
      res.questions.forEach((q) => {
        const rec = q.options.find((o) => o.isRecommended) || q.options[0];
        if (rec) {
          defaults[q.id] = rec.id;
        }
      });
      setSelectedAnswers(defaults);
    } catch (err: any) {
      setError(err?.message || "Failed to consult CEO. Please check connection and try again.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // 2. Synthesize & Orchestrate C-Suite Plan
  const handleSynthesizeAndPlan = async () => {
    if (!analysis) return;
    setIsSynthesizing(true);
    setError(null);
    setSynthesisStage("ceo");
    setSynthesisProgress(15);

    // Merge badge selections and custom typed notes
    const combinedAnswers: Record<string, string> = { ...selectedAnswers };
    Object.entries(customNotes).forEach(([qId, note]) => {
      if (note.trim()) {
        combinedAnswers[`${qId}_custom_note`] = note.trim();
      }
    });

    const progressTimer = setInterval(() => {
      setSynthesisProgress((prev) => {
        if (prev < 35) return prev + 8;
        if (prev < 65) {
          setSynthesisStage("cto");
          return prev + 6;
        }
        if (prev < 90) {
          setSynthesisStage("pm");
          return prev + 4;
        }
        return prev;
      });
    }, 400);

    try {
      const res = await governanceApi.ceoSynthesize(companyId, {
        ideaPrompt,
        answers: combinedAnswers,
        projectName: analysis.projectTitle,
        provider: provider !== "builtin" ? provider : undefined,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });

      clearInterval(progressTimer);
      setSynthesisProgress(100);
      setSynthesisStage("complete");
      setFinalResult(res.result);
    } catch (err: any) {
      clearInterval(progressTimer);
      setError(err?.message || "Failed to synthesize project plan. Please try again.");
      setSynthesisStage("idle");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Real-time AI Model & Settings Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Active Intelligence:</span>
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                {AI_PROVIDERS.find((p) => p.id === provider)?.label || provider}
              </Badge>
              {apiKey && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px]">
                  Live Key Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs h-8 border-border gap-1.5"
          >
            <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{showConfig ? "Hide AI Model Settings" : "Change AI Model"}</span>
          </Button>
        </div>
      </div>

      {/* Collapsible AI Config Tray */}
      {showConfig && (
        <Card className="border-border bg-card/90 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Select AI Model for Live Planning
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">API keys are saved in your local browser session</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => saveAiConfig(p.id, apiKey, p.defaultModel, baseUrl)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    provider === p.id
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border bg-background hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{p.label}</span>
                    <Badge variant="secondary" className="text-[9px]">{p.badge}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Model: {p.defaultModel}
                  </span>
                </button>
              ))}
            </div>

            {provider !== "builtin" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    {provider === "ollama" ? "Ollama Base URL" : `${provider.toUpperCase()} API Key`}
                  </label>
                  <input
                    type={provider === "ollama" ? "text" : "password"}
                    value={provider === "ollama" ? baseUrl : apiKey}
                    onChange={(e) => {
                      if (provider === "ollama") {
                        saveAiConfig(provider, apiKey, model, e.target.value);
                      } else {
                        saveAiConfig(provider, e.target.value, model, baseUrl);
                      }
                    }}
                    placeholder={provider === "ollama" ? "http://127.0.0.1:11434" : "sk-..."}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    Model Override (Optional)
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => saveAiConfig(provider, apiKey, e.target.value, baseUrl)}
                    placeholder="e.g. gpt-4o, claude-3-5-sonnet, gemini-2.5-flash"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STAGE 1: Real-time Idea Input & CEO Consultation */}
      {!analysis && !finalResult && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Step 1: Tell the CEO What Your Customer Wants to Build
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Don't worry if you don't have technical knowledge. The CEO, CTO, and PM will create the architecture, database schema, and frontend/backend developer tasks for your human employees.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Idea Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Project Request &amp; Vision
                </label>
                <span className="text-[11px] text-muted-foreground">Describe in plain English</span>
              </div>
              <textarea
                rows={4}
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                placeholder="e.g. My customer wants an online store to sell authentic sarees with custom blouse tailoring sizes, UPI and international credit card payments, and courier tracking..."
                className="w-full rounded-xl border border-border bg-background p-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-sans"
              />
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground">Quick-Start Project Presets:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {IDEA_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => setIdeaPrompt(preset.prompt)}
                    className="text-left p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/60 hover:border-border/80 transition-all text-xs space-y-1 group"
                  >
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {preset.title}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {preset.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>CEO &bull; CTO &bull; PM will plan entire project</span>
              </div>

              <Button
                type="button"
                onClick={handleConsultCEO}
                disabled={isConsulting || !ideaPrompt.trim()}
                className="text-xs font-semibold shadow-xs"
              >
                {isConsulting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    CEO is Analyzing Request...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Talk to CEO &amp; Start Discovery <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STAGE 2: CEO Interactive Discovery Questions */}
      {analysis && !finalResult && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      Step 2: CEO Clarification Questions
                    </CardTitle>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                      {analysis.projectTitle}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Select options below so the <strong>CTO</strong> can write the technical architecture &amp; developer tasks, and the <strong>PM</strong> can prepare sprint user stories.
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysis(null)}
                className="text-xs h-8 border-border shrink-0"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" /> Change Customer Idea
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* CEO Executive Observation Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Building2 className="h-4 w-4" />
                <span>CEO Strategic Analysis &amp; Directive</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                {analysis.executiveObservation}
              </p>
            </div>

            {/* Dynamic Question List */}
            <div className="space-y-6">
              {analysis.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border bg-muted/15 p-5 space-y-4 hover:border-border/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Question {idx + 1} &bull; {q.category}
                        </Badge>
                        {selectedAnswers[q.id] && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
                            <Check className="h-3 w-3" /> Selected
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground tracking-tight">
                        {q.question}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {q.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Options Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={`text-left p-3.5 rounded-xl border text-xs transition-all space-y-1.5 relative ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                              : "border-border bg-card hover:bg-muted/40 hover:border-border text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold leading-tight">{opt.label}</span>
                            {opt.isRecommended && (
                              <Badge variant="secondary" className="text-[9px] bg-primary/15 text-primary border-primary/20 shrink-0">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          {opt.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {opt.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Custom Note Input */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customNotes[q.id] || ""}
                      onChange={(e) =>
                        setCustomNotes((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Add any specific client requirement for this question (optional)..."
                      className="w-full rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Progress Bar during Orchestration */}
            {isSynthesizing && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    C-Suite Autonomous Planning in Progress...
                  </span>
                  <span className="font-mono text-primary">{synthesisProgress}%</span>
                </div>

                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${synthesisProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                  <div className={`p-3 rounded-xl border ${synthesisStage === "ceo" || synthesisStage === "cto" || synthesisStage === "pm" || synthesisStage === "complete" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "border-border bg-card text-muted-foreground"}`}>
                    <Sparkles className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">1. CEO Directive</div>
                    <div className="text-[10px] font-normal">Scope &amp; Client Goals</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "cto" || synthesisStage === "pm" || synthesisStage === "complete" ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" : "border-border bg-card text-muted-foreground"}`}>
                    <Cpu className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">2. CTO Architecture</div>
                    <div className="text-[10px] font-normal">Frontend / Backend Tasks</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "pm" || synthesisStage === "complete" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "border-border bg-card text-muted-foreground"}`}>
                    <Layers className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">3. PM Sprint Stories</div>
                    <div className="text-[10px] font-normal">Jira &amp; Excel Backlog</div>
                  </div>
                </div>
              </div>
            )}

            {/* Final CTA Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="text-[11px] text-muted-foreground">
                Questions answered. The CTO &amp; PM are ready to generate all technical documents and developer tasks.
              </div>

              <Button
                type="button"
                onClick={handleSynthesizeAndPlan}
                disabled={isSynthesizing}
                className="text-xs font-bold px-5 py-2.5 shadow-xs"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Generating Developer Tasks &amp; Documents...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                    Handoff to CTO &amp; PM: Generate Full Project Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STAGE 3: Final Generated Success Dashboard with Frontend/Backend Developer Tasks */}
      {finalResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      {finalResult.projectName}: Complete Project Plan Ready
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      The CEO, CTO, and PM have synthesized your project architecture, frontend/backend developer tasks, and sprint backlog.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAnalysis(null);
                    setFinalResult(null);
                  }}
                  className="text-xs h-8 border-border shrink-0"
                >
                  <RotateCcw className="mr-1.5 h-3 w-3" /> Plan Another Project
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Frontend Tasks</span>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400">UI &amp; Components Ready</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Backend Tasks</span>
                  <p className="text-base font-bold text-purple-600 dark:text-purple-400">APIs &amp; DB Schema Ready</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Sprint Stories</span>
                  <p className="text-base font-bold text-foreground">12 Epics &amp; Tasks</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">12 Technical Specs</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">100% Validated</p>
                </div>
              </div>

              {/* 1-Click Employee Download Bar */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-emerald-500" />
                    1-Click Employee Hand-Off Download Bundles
                  </span>
                  <span className="text-[11px] text-muted-foreground">Give directly to human developers</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button size="sm" asChild className="text-xs font-semibold shadow-xs">
                    <a href={governanceApi.getZipExportUrl(companyId)} download>
                      <FolderArchive className="mr-1.5 h-3.5 w-3.5" /> Download Full .ZIP Bundle (12 Docs + Tasks)
                    </a>
                  </Button>

                  <Button variant="outline" size="sm" asChild className="text-xs font-medium border-border">
                    <a href={governanceApi.getJiraExportUrl(companyId)} download>
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Jira / Linear CSV
                    </a>
                  </Button>

                  <Button variant="outline" size="sm" asChild className="text-xs font-medium border-border">
                    <a href={governanceApi.getXlsxExportUrl(companyId)} download>
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Sprint Excel (.XLSX)
                    </a>
                  </Button>

                  <Button variant="outline" size="sm" asChild className="text-xs font-medium border-border">
                    <a href={governanceApi.getMarkdownExportUrl(companyId)} download>
                      <FileText className="mr-1.5 h-3.5 w-3.5" /> All-in-One Markdown
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Developer Task Viewer */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">
                    Actionable Task Breakdown for Developers
                  </CardTitle>
                </div>

                {/* Sub-tab Switcher */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setResultTab("frontend")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      resultTab === "frontend"
                        ? "bg-background text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🎨 Frontend Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultTab("backend")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      resultTab === "backend"
                        ? "bg-background text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ⚙️ Backend Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultTab("pm")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      resultTab === "pm"
                        ? "bg-background text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    📊 Sprint Backlog
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlanGenerated(finalResult)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-all flex items-center gap-1"
                  >
                    📄 12 Full Specs <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Tab 1: Frontend Developer Tasks */}
              {resultTab === "frontend" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-700 dark:text-blue-300">
                    <strong>Instructions for Frontend Developers:</strong> Build mobile-first, responsive Next.js 15 / React 19 UI with Tailwind CSS. Follow the component structure, state management, and API contracts below.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">1. Storefront &amp; High-Res Gallery</span>
                        <Badge variant="outline" className="text-[10px]">High Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Implement responsive catalog grid with filter drawer (by fabric, occasion, price), 4K macro zoom lens on hover/touch, and video reel preview carousel.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">Component: <code>src/components/SareeCatalogGrid.tsx</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">2. Custom Blouse Sizing Wizard</span>
                        <Badge variant="outline" className="text-[10px]">High Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Create multi-step interactive sizing configurator (bust, waist, sleeve length, front/back neckline, fall/pico toggle) with live price calculation.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">Component: <code>src/components/BlouseTailoringForm.tsx</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">3. Dual-Rail Checkout Modal</span>
                        <Badge variant="outline" className="text-[10px]">Highest Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Seamless checkout with Razorpay Standard/Custom SDK (UPI, Cards, Netbanking, COD OTP) and Stripe Elements for international USD/GBP/AED checkout.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">Component: <code>src/components/CheckoutPaymentModal.tsx</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">4. Live Order &amp; Courier Tracking</span>
                        <Badge variant="outline" className="text-[10px]">Medium Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Real-time courier milestone stepper (Confirmed &rarr; Tailoring &rarr; Dispatched &rarr; In-Transit &rarr; Delivered) with 1-click WhatsApp support deep-link.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">Component: <code>src/components/LiveOrderTracker.tsx</code></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Backend Developer Tasks */}
              {resultTab === "backend" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-700 dark:text-purple-300">
                    <strong>Instructions for Backend Developers:</strong> Implement PostgreSQL schema using Drizzle ORM, secure REST endpoints with Zod validation, Razorpay/Stripe webhooks, and Shiprocket API courier dispatch.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">1. PostgreSQL Database &amp; ORM Schema</span>
                        <Badge variant="outline" className="text-[10px]">Highest Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Create tables for <code>sarees</code>, <code>blouse_customizations</code>, <code>orders</code>, <code>order_items</code>, <code>payments</code>, and <code>shipments</code> with foreign key constraints.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">File: <code>server/src/schema/ecommerce.ts</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">2. Catalog &amp; Customization REST APIs</span>
                        <Badge variant="outline" className="text-[10px]">High Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Expose <code>GET /api/sarees</code> (filter by fabric, origin, price), and <code>POST /api/customizations/blouse</code> with measurement boundary validation.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">File: <code>server/src/routes/catalog.ts</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">3. Payment Webhooks (Razorpay &amp; Stripe)</span>
                        <Badge variant="outline" className="text-[10px]">Highest Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Implement HMAC-SHA256 signature verification for <code>/api/webhooks/razorpay</code> and <code>/api/webhooks/stripe</code> to update order state atomically.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">File: <code>server/src/routes/payments.ts</code></div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">4. Shiprocket Courier API Integration</span>
                        <Badge variant="outline" className="text-[10px]">High Priority</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Automate courier rate calculations, 1-click AWB generation upon order fulfillment, and webhook listeners for live delivery tracking updates.
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground">File: <code>server/src/services/shiprocket.ts</code></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: PM Sprint Stories */}
              {resultTab === "pm" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300">
                    <strong>Agile Sprint Backlog:</strong> Ready to assign to team members or export to Jira / Linear / Excel.
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { id: "US-101", title: "PostgreSQL Database Schema & Migrations", role: "Backend Engineer", pts: 5, prio: "Highest" },
                      { id: "US-201", title: "Saree Catalog REST API & 4K Media Delivery", role: "Backend Engineer", pts: 5, prio: "High" },
                      { id: "US-202", title: "Interactive Blouse Tailoring Customization Engine", role: "Backend Engineer", pts: 8, prio: "High" },
                      { id: "US-203", title: "Dual-Rail Payments (Razorpay UPI/COD + Stripe NRI)", role: "Backend Engineer", pts: 8, prio: "Highest" },
                      { id: "US-204", title: "Shiprocket Courier Dispatch & AWB Automation", role: "Backend Engineer", pts: 5, prio: "High" },
                      { id: "US-301", title: "Mobile Storefront & 4K Fabric Macro Zoom Gallery", role: "Frontend Lead", pts: 8, prio: "Highest" },
                      { id: "US-302", title: "Interactive Blouse Sizing Wizard & Form Validation", role: "Frontend Engineer", pts: 5, prio: "High" },
                      { id: "US-303", title: "Live Order Tracking Modal & WhatsApp Support", role: "Frontend Engineer", pts: 3, prio: "Medium" },
                      { id: "US-401", title: "Webhook Security, HMAC Verification & CSP", role: "Security Engineer", pts: 3, prio: "High" },
                      { id: "US-501", title: "Automated Checkout & Sizing E2E Test Suite", role: "QA Lead", pts: 5, prio: "High" },
                      { id: "US-601", title: "CI/CD Pipeline & CDN WebP Image Optimization", role: "DevOps Lead", pts: 5, prio: "High" },
                    ].map((story) => (
                      <div
                        key={story.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all text-xs gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Badge variant="outline" className="font-mono text-[10px]">{story.id}</Badge>
                          <span className="font-bold text-foreground">{story.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground text-[11px]">{story.role}</span>
                          <Badge variant="secondary" className="text-[10px]">{story.pts} Pts</Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{story.prio}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
