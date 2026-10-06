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
  HelpCircle,
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
  Globe,
  Bot,
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
    <div className="space-y-6">
      {/* Real-time AI Model & Settings Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Real-Time AI Provider:</span>
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                {AI_PROVIDERS.find((p) => p.id === provider)?.label || provider}
              </Badge>
              {apiKey && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px]">
                  Live Key Configured
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
            <span>{showConfig ? "Hide AI Settings" : "Configure AI Model"}</span>
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
                Live AI Provider &amp; Model Credentials
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">Credentials stay safe in your local browser session</span>
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
                  CEO Strategic Consultation &amp; Real-Time Discovery
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Describe any software, e-commerce, or mobile app concept. The CEO will think in real-time, ask strategic clarification questions, and coordinate with CTO &amp; PM.
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
                  Your Project Idea &amp; Scope
                </label>
                <span className="text-[11px] text-muted-foreground">e.g. Saree E-Commerce, Clinic Telehealth, Micro-Lending</span>
              </div>
              <textarea
                rows={4}
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                placeholder="e.g. I want an e-commerce platform for selling sarees online with blouse tailoring customization, UPI & international diaspora payments..."
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
                <span>CEO, CTO &amp; PM will evaluate, architect, and plan</span>
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
                    CEO is Analyzing Vision in Real-Time...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Consult CEO &amp; Start Discovery <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                      {analysis.projectTitle}
                    </CardTitle>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                      CEO Strategic Discovery
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Answer these strategic clarification questions so the CEO, CTO, and PM can generate your 12 technical documents and sprint roadmap.
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysis(null)}
                className="text-xs h-8 border-border shrink-0"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" /> Change Prompt
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
                          Q{idx + 1} &bull; {q.category}
                        </Badge>
                        {selectedAnswers[q.id] && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
                            <Check className="h-3 w-3" /> Answered
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
                      placeholder="Add custom specification or requirement for this question (optional)..."
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
                    Real-Time C-Suite Leadership Orchestration
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
                  <div className={`p-3 rounded-xl border ${synthesisStage === "ceo" || synthesisStage === "cto" || synthesisStage === "pm" || synthesisStage === "complete" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border bg-card text-muted-foreground"}`}>
                    <Sparkles className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs font-bold">1. CEO Directive</div>
                    <div className="text-[10px]">Scope &amp; Strategy Charter</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "cto" || synthesisStage === "pm" || synthesisStage === "complete" ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" : "border-border bg-card text-muted-foreground"}`}>
                    <Cpu className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs font-bold">2. CTO Architecture</div>
                    <div className="text-[10px]">DB Schema &amp; OpenAPI Spec</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "pm" || synthesisStage === "complete" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border bg-card text-muted-foreground"}`}>
                    <Layers className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs font-bold">3. PM Sprint Stories</div>
                    <div className="text-[10px]">PRD &amp; Jira Backlog</div>
                  </div>
                </div>
              </div>
            )}

            {/* Final CTA Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="text-[11px] text-muted-foreground">
                All questions answered. Ready to generate 12 validated technical documents.
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
                    Synthesizing &amp; Building Plan...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                    Handoff to CTO &amp; PM: Generate Full Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STAGE 3: Final Generated Success Banner */}
      {finalResult && (
        <Card className="border-border bg-card shadow-sm animate-in fade-in">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Full Project Plan &amp; 12 Technical Documents Ready!
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  The CEO, CTO, and PM have synthesized your <strong>{finalResult.projectName}</strong> specifications and sprint backlog.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">12 Technical Specs</span>
                <p className="text-base font-bold text-foreground">100% Validated</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Sprint User Stories</span>
                <p className="text-base font-bold text-foreground">13 Epics &amp; Tasks</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-0.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Hand-off Ready</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Download for Employees</p>
              </div>
            </div>

            {/* Quick 1-Click Download Buttons */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-emerald-500" />
                  1-Click Project Package Downloads for Human Employees
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" asChild className="text-xs font-semibold shadow-xs">
                  <a href={governanceApi.getZipExportUrl(companyId)} download>
                    <FolderArchive className="mr-1.5 h-3.5 w-3.5" /> Download Full .ZIP Bundle
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

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAnalysis(null);
                  setFinalResult(null);
                }}
                className="text-xs"
              >
                Plan Another Project
              </Button>

              <Button
                size="sm"
                onClick={() => onPlanGenerated(finalResult)}
                className="text-xs font-semibold"
              >
                View 12 Documents in Document Center <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
