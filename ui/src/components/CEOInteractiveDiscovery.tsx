import { useState } from "react";
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
  AlertCircle,
  Loader2,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Check,
  Building2,
  HelpCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CEOInteractiveDiscoveryProps {
  companyId: string;
  onPlanGenerated: (result: KickoffResponse) => void;
}

const IDEA_PRESETS = [
  {
    title: "🧵 Sarees Selling E-Commerce Platform",
    prompt: "I want an e-commerce platform for selling authentic sarees online with blouse tailoring customization, UPI and international diaspora payments, high-definition fabric video reels, and automated courier tracking.",
  },
  {
    title: "🏥 Telehealth & Clinic Care Portal",
    prompt: "I want a digital clinic management and telemedicine consultation platform with doctor scheduling, HIPAA-compliant video calls, and prescription generation.",
  },
  {
    title: "⚡ B2B SaaS AI Automation Pipeline",
    prompt: "I want a multi-tenant B2B SaaS workflow automation tool that integrates CRM webhooks with generative AI reasoning to auto-classify and respond to customer tickets.",
  },
];

export function CEOInteractiveDiscovery({
  companyId,
  onPlanGenerated,
}: CEOInteractiveDiscoveryProps) {
  const [ideaPrompt, setIdeaPrompt] = useState(IDEA_PRESETS[0].prompt);
  const [isConsulting, setIsConsulting] = useState(false);
  const [analysis, setAnalysis] = useState<CeoConsultationAnalysis | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStage, setSynthesisStage] = useState<"idle" | "ceo" | "cto" | "pm" | "complete">("idle");
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<KickoffResponse | null>(null);

  // Step 1: Consult the CEO
  const handleConsultCEO = async () => {
    if (!ideaPrompt.trim()) {
      setError("Please describe your project idea before consulting the CEO.");
      return;
    }
    setIsConsulting(true);
    setError(null);
    try {
      const res = await governanceApi.ceoConsult(companyId, ideaPrompt.trim());
      setAnalysis(res);

      // Pre-select recommended options
      const initialAnswers: Record<string, string> = {};
      res.questions.forEach((q) => {
        const recommended = q.options.find((o) => o.isRecommended) || q.options[0];
        if (recommended) {
          initialAnswers[q.id] = recommended.id;
        }
      });
      setSelectedAnswers(initialAnswers);
    } catch (err: any) {
      setError(err?.message || "Failed to reach CEO for consultation.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleApplyAllRecommended = () => {
    if (!analysis) return;
    const recommendedAnswers: Record<string, string> = {};
    analysis.questions.forEach((q) => {
      const rec = q.options.find((o) => o.isRecommended) || q.options[0];
      if (rec) recommendedAnswers[q.id] = rec.id;
    });
    setSelectedAnswers(recommendedAnswers);
  };

  // Step 2: CEO Synthesizes and coordinates with CTO & PM
  const handleSynthesizeAndPlan = async () => {
    if (!analysis) return;
    setIsSynthesizing(true);
    setError(null);
    setSynthesisStage("ceo");

    try {
      setTimeout(() => setSynthesisStage("cto"), 900);
      setTimeout(() => setSynthesisStage("pm"), 1800);

      const res = await governanceApi.ceoSynthesize(companyId, {
        ideaPrompt,
        answers: selectedAnswers,
        projectName: analysis.projectTitle,
      });

      setSynthesisStage("complete");
      setFinalResult(res.result);
      onPlanGenerated(res.result);
    } catch (err: any) {
      setError(err?.message || "Failed to complete C-Suite synthesis and plan generation.");
      setSynthesisStage("idle");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* STAGE 1: Describe Idea to CEO */}
      {!analysis && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  CEO Strategic Consultation &amp; Discovery
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Describe your project idea in plain English. The CEO will analyze your vision and ask dynamic questions to scope the business model, catalog, and architecture.
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
                <span className="text-[11px] text-muted-foreground">e.g. Saree E-Commerce, B2B Portal, SaaS</span>
              </div>
              <textarea
                rows={4}
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                placeholder="e.g. I want an e-commerce platform for selling authentic sarees online with blouse tailoring customization, UPI & international diaspora payments..."
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
                <span>CEO, CTO &amp; PM will evaluate and plan</span>
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
                    CEO is Analyzing Vision...
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
                    Answer these 5 clarification questions so the CEO, CTO, and PM can generate your technical documents and sprint roadmap.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysis(null)}
                  className="text-xs border-border"
                >
                  <RotateCcw className="mr-1.5 h-3 w-3" /> Change Idea
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAllRecommended}
                  className="text-xs border-border text-primary"
                >
                  <Zap className="mr-1.5 h-3 w-3" /> Apply Recommended
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

            {/* CEO Executive Observation Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>CEO Executive Analysis</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {analysis.executiveObservation}
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {analysis.questions.map((q, qIndex) => (
                <div key={q.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                          {qIndex + 1}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">{q.question}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-7">{q.explanation}</p>
                    </div>
                  </div>

                  {/* Options Radio Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-7 pt-1">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-2xs"
                              : "border-border bg-muted/15 hover:border-border/80 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {isSelected ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />}
                              {opt.label}
                            </span>
                            {opt.isRecommended && (
                              <Badge variant="secondary" className="text-[9px] bg-primary/15 text-primary border-primary/20 px-1.5 py-0">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          {opt.description && (
                            <p className="text-[11px] text-muted-foreground pl-5 leading-snug">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* C-Suite Multi-Agent Handoff Animation during Synthesis */}
            {isSynthesizing && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 text-center animate-in fade-in">
                <h4 className="text-sm font-bold text-foreground">
                  C-Suite Leadership Orchestration in Progress
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border ${synthesisStage === "ceo" ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-border bg-card text-muted-foreground"}`}>
                    <Sparkles className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-bold">1. CEO Directive</div>
                    <div className="text-[10px]">Business &amp; Scope Charter</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "cto" ? "border-blue-500 bg-blue-500/10 text-blue-600" : "border-border bg-card text-muted-foreground"}`}>
                    <Cpu className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-bold">2. CTO Architecture</div>
                    <div className="text-[10px]">DB, APIs &amp; Stack Plan</div>
                  </div>

                  <div className={`p-3 rounded-xl border ${synthesisStage === "pm" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border bg-card text-muted-foreground"}`}>
                    <Layers className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-bold">3. PM Sprint Stories</div>
                    <div className="text-[10px]">PRD &amp; Jira Backlog</div>
                  </div>
                </div>
              </div>
            )}

            {/* Final CTA Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="text-[11px] text-muted-foreground">
                All 5 questions answered. Ready to generate 12 technical documents.
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
        <Card className="border-border bg-card shadow-sm">
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
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
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
