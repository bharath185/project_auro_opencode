import { useEffect, useState, useCallback } from "react";
import { governanceApi } from "@/api/governance";
import {
  Users,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FolderArchive,
  Layers,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  primarySkills: string[];
  weeklyCapacityHours: number;
  assignedHours: number;
}

interface SprintTicket {
  id: string;
  storyId: string;
  summary: string;
  epic: string;
  storyPoints: number;
  estimatedHours: number;
  assigneeMemberId: string | null;
  assigneeName: string | null;
  status: "backlog" | "in_progress" | "in_review" | "done";
  requiredSkills: string[];
}

interface TeamAssignmentViewProps {
  companyId: string;
}

export function TeamAssignmentView({ companyId }: TeamAssignmentViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tickets, setTickets] = useState<SprintTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadTeamState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await governanceApi.getTeamState(companyId);
      setMembers(res.members || []);
      setTickets(res.tickets || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load team assignment data.");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadTeamState();
  }, [loadTeamState]);

  const handleConvertSprint = async () => {
    try {
      setIsConverting(true);
      setError(null);
      await governanceApi.convertSprintToTickets(companyId);
      setStatusMessage("Sprint plan converted to dynamic tickets successfully!");
      await loadTeamState();
    } catch (err: any) {
      setError(err?.message || "Failed to convert sprint stories to tickets.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, memberId: string | null) => {
    try {
      setError(null);
      await governanceApi.assignTicket(companyId, ticketId, {
        assigneeMemberId: memberId || null,
      });
      await loadTeamState();
    } catch (err: any) {
      setError(err?.message || "Failed to update ticket assignment.");
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      setError(null);
      await governanceApi.assignTicket(companyId, ticketId, {
        status: newStatus,
      });
      await loadTeamState();
    } catch (err: any) {
      setError(err?.message || "Failed to update ticket status.");
    }
  };

  const totalPoints = tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const assignedTickets = tickets.filter((t) => t.assigneeMemberId !== null).length;

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Top Banner & Hand-off Actions */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Team Allocation &amp; Sprint Execution Backlog
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Assign user stories to human engineers and download export bundles for Jira, Linear, or Excel.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTeamState}
                disabled={isLoading}
                className="text-xs border-border"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>

              <Button
                size="sm"
                onClick={handleConvertSprint}
                disabled={isConverting}
                className="text-xs font-semibold shadow-xs"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {isConverting ? "Converting..." : "Auto-Populate from Sprint Plan"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Team Capacity</span>
              <p className="text-lg font-bold text-foreground">{members.length} Engineers</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sprint Stories</span>
              <p className="text-lg font-bold text-foreground">{tickets.length} Items</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Story Points</span>
              <p className="text-lg font-bold text-foreground">{totalPoints} pts</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Assignment Rate</span>
              <p className="text-lg font-bold text-foreground">{tickets.length ? `${Math.round((assignedTickets / tickets.length) * 100)}%` : "0%"}</p>
            </div>
          </div>

          {/* Section 1: Team Members Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Engineering Team Capacity Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {members.map((m) => {
                const util = m.weeklyCapacityHours ? Math.min(100, Math.round((m.assignedHours / m.weeklyCapacityHours) * 100)) : 0;
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground truncate">{m.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{m.role}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.assignedHours}h / {m.weeklyCapacityHours}h allocated ({util}%)
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${util > 90 ? "bg-red-500" : util > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${util}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.primarySkills?.slice(0, 3).map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Sprint Ticket Table */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sprint Stories &amp; Epic Breakdown ({tickets.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild className="text-xs h-7 border-border">
                  <a href={governanceApi.getJiraExportUrl(companyId)} download>
                    <Layers className="mr-1 h-3 w-3 text-blue-500" /> Export Jira CSV
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild className="text-xs h-7 border-border">
                  <a href={governanceApi.getXlsxExportUrl(companyId)} download>
                    <FileSpreadsheet className="mr-1 h-3 w-3 text-emerald-500" /> Export Excel
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Epic &amp; Summary</th>
                    <th className="p-3">Points</th>
                    <th className="p-3">Required Skills</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-semibold text-foreground whitespace-nowrap">
                        {t.storyId}
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="font-semibold text-foreground leading-snug">{t.summary}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{t.epic}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {t.storyPoints} pts ({t.estimatedHours}h)
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.requiredSkills?.map((s) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={t.assigneeMemberId || ""}
                          onChange={(e) => handleAssignTicket(t.id, e.target.value || null)}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
