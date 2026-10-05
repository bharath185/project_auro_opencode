import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { governanceApi, type GovernancePrompt } from "@/api/governance";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCode,
  Sparkles,
  Cpu,
  Layers,
  Terminal,
  Lock,
} from "lucide-react";

const ROLES = [
  { id: "ceo", label: "CEO (Chief Executive Officer)", icon: Sparkles, color: "text-amber-500", model: "gemini-2.5-flash / opencode-deepseek" },
  { id: "cto", label: "CTO (Chief Technology Officer)", icon: Cpu, color: "text-blue-500", model: "opencode/deepseek-v4-pro" },
  { id: "pm", label: "PM (Product Manager)", icon: Layers, color: "text-purple-500", model: "opencode/deepseek-v4-pro" },
  { id: "qa", label: "QA (Quality Assurance Lead)", icon: CheckCircle2, color: "text-emerald-500", model: "opencode/deepseek-v4-pro" },
  { id: "devops", label: "DevOps (DevOps Engineer)", icon: Terminal, color: "text-cyan-500", model: "opencode/deepseek-v4-pro" },
  { id: "security", label: "Security (Security Officer)", icon: Lock, color: "text-rose-500", model: "opencode/kimi-k2.7-code" },
];

export function GovernancePromptEditor() {
  const [selectedRole, setSelectedRole] = useState("ceo");
  const [prompts, setPrompts] = useState<Record<string, GovernancePrompt>>({});
  const [currentContent, setCurrentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await governanceApi.getPrompts();
      setPrompts(data);
      if (data[selectedRole]) {
        setCurrentContent(data[selectedRole].content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load governance prompts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    setSavedSuccess(false);
    setError(null);
    if (prompts[roleId]) {
      setCurrentContent(prompts[roleId].content);
    } else {
      setCurrentContent("");
    }
  };

  const handleSave = async () => {
    if (!currentContent.trim()) {
      setError("Prompt content cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await governanceApi.updatePrompt(selectedRole, currentContent);
      setPrompts((prev) => ({
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          content: currentContent,
        },
      }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt.");
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleMeta = ROLES.find((r) => r.id === selectedRole);

  return (
    <Card className="w-full max-w-6xl border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Governance System Prompts Editor
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Versioned prompt instructions stored in <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">prompts/governance/*.md</code>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPrompts}
              disabled={loading || saving}
              className="text-xs border-border"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || loading}
              className="text-xs font-semibold shadow-xs"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving Revision..." : "Save Prompt Revision"}
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

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Prompt for <strong>{selectedRoleMeta?.label}</strong> saved successfully!</span>
          </div>
        )}

        {/* Ant Pro Split: Roles on Left, Prompt Editor on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Roles Selector (4 columns) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
              Select C-Suite Role ({ROLES.length})
            </div>

            <div className="rounded-xl border border-border bg-card p-2 space-y-1 shadow-2xs">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                        : "text-foreground hover:bg-muted/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : role.color}`} />
                      <span className="truncate">{role.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Workspace (8 columns) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {selectedRoleMeta?.label} Prompt
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedRoleMeta?.model}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                prompts/governance/{selectedRole}.md
              </span>
            </div>

            <textarea
              rows={20}
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/15 p-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed scrollbar-thin"
              placeholder="System prompt instructions..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
