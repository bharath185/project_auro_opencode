import { api } from "./client";

export interface GovernanceAgentSummary {
  id: string;
  name: string;
  role: string;
  title: string | null;
  reportsTo: string | null;
  budgetMonthlyCents: number;
  adapterType?: string;
  adapterConfig?: any;
}

export interface GovernanceOrgStatus {
  isComplete: boolean;
  count: number;
  agents: GovernanceAgentSummary[];
}

export interface CeoQuestionOption {
  id: string;
  label: string;
  description?: string;
  isRecommended?: boolean;
}

export interface CeoDiscoveryQuestion {
  id: string;
  category: string;
  question: string;
  explanation: string;
  options: CeoQuestionOption[];
}

export interface CeoConsultationAnalysis {
  projectTitle: string;
  domain: string;
  executiveObservation: string;
  questions: CeoDiscoveryQuestion[];
}

export interface GovernancePrompt {
  role: string;
  title: string;
  content: string;
}

export interface ProjectKickoffBriefPayload {
  companyId?: string;
  projectName: string;
  problem: string;
  targetUsers: string;
  goals: string;
  constraints?: string;
  budget?: string | number;
  deadline?: string;
  preferredStack?: string;
  integrations?: string;
  teamSizeAndSkills?: string;
  attachments?: string;
  isDemo?: boolean;
}

export interface GeneratedDocumentResult {
  kind: string;
  title: string;
  fileName: string;
  authorRole: string;
  content: string;
  isValid: boolean;
  missingSections: string[];
}

export interface WorkstreamResult {
  role: string;
  taskTitle: string;
  issueId: string;
  status: string;
  dependsOnIssueIds?: string[];
  documents: GeneratedDocumentResult[];
  reviews: any[];
}

export interface KickoffResponse {
  goalId: string;
  kickoffIssueId: string;
  ceoAgentId: string;
  projectName: string;
  executionMode: "demo" | "live";
  documents: Record<string, GeneratedDocumentResult>;
  workstreams: WorkstreamResult[];
  projectPackSummary: GeneratedDocumentResult;
  status: "completed" | "in_review" | "in_progress";
}

export interface GovernanceDocSummary {
  kind: string;
  title: string;
  fileName: string;
  authorRole: string;
  currentVersion: number;
  versionCount: number;
  reviewCount: number;
  isValid: boolean;
  missingSections: string[];
  foundSections: string[];
}

export interface GovernanceDocDetail {
  kind: string;
  title: string;
  fileName: string;
  authorRole: string;
  currentVersion: number;
  content: string;
  isValid: boolean;
  missingSections: string[];
  foundSections: string[];
  versions: Array<{
    version: number;
    content: string;
    authorRole: string;
    changeSummary: string;
    createdAt: string;
  }>;
  reviews: Array<{
    reviewerRole: string;
    status: string;
    comments: string;
    createdAt: string;
  }>;
}

export interface GovernanceProjectSummary {
  id: string;
  name: string;
  domain: string;
  problem: string;
  packStatus: "draft" | "in_review" | "approved";
  docCount: number;
  storyCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export const governanceApi = {
  // Multi-Project API
  listProjects: (companyId: string) =>
    api.get<{
      activeProjectId: string;
      projects: GovernanceProjectSummary[];
    }>(`/companies/${companyId}/governance/projects`),

  getProject: (companyId: string, projectId: string) =>
    api.get<any>(`/companies/${companyId}/governance/projects/${projectId}`),

  createProject: (
    companyId: string,
    payload: {
      name: string;
      domain?: string;
      problem?: string;
      targetUsers?: string;
      goals?: string;
      preferredStack?: string;
    },
  ) =>
    api.post<{
      success: boolean;
      project: any;
      activeProjectId: string;
    }>(`/companies/${companyId}/governance/projects`, payload),

  selectProject: (companyId: string, projectId: string) =>
    api.post<{
      success: boolean;
      activeProjectId: string;
      project: any;
    }>(`/companies/${companyId}/governance/projects/${projectId}/select`, {}),

  deleteProject: (companyId: string, projectId: string) =>
    api.delete<{
      success: boolean;
      deletedProjectId: string;
      activeProjectId: string;
    }>(`/companies/${companyId}/governance/projects/${projectId}`),

  getStatus: (companyId: string) =>
    api.get<GovernanceOrgStatus>(`/companies/${companyId}/governance/status`),

  createOrg: (
    companyId: string,
    data?: {
      adapterType?: string;
      customModels?: Record<string, string>;
    },
  ) =>
    api.post<{
      success: boolean;
      projectId: string;
      agents: GovernanceAgentSummary[];
    }>(`/companies/${companyId}/governance/org/create`, data || {}),

  getPrompts: () =>
    api.get<Record<string, GovernancePrompt>>("/governance/prompts"),

  getPrompt: (role: string) =>
    api.get<{ role: string; content: string }>(`/governance/prompts/${role}`),

  updatePrompt: (role: string, content: string) =>
    api.put<{ success: boolean; role: string; content: string }>(
      `/governance/prompts/${role}`,
      { content },
    ),

  submitKickoff: (companyId: string, brief: ProjectKickoffBriefPayload) =>
    api.post<KickoffResponse>(`/companies/${companyId}/governance/kickoff`, brief),

  ceoConsult: (
    companyId: string,
    payload: {
      ideaPrompt: string;
      projectId?: string;
      provider?: string;
      apiKey?: string;
      model?: string;
      baseUrl?: string;
    },
  ) =>
    api.post<CeoConsultationAnalysis>(`/companies/${companyId}/governance/ceo/consult`, payload),

  ceoSynthesize: (
    companyId: string,
    payload: {
      ideaPrompt: string;
      answers: Record<string, string>;
      projectName?: string;
      projectId?: string;
      provider?: string;
      apiKey?: string;
      model?: string;
      baseUrl?: string;
    },
  ) =>
    api.post<{
      success: boolean;
      projectId: string;
      brief: any;
      result: KickoffResponse;
    }>(`/companies/${companyId}/governance/ceo/synthesize`, payload),

  listDocuments: (companyId: string, projectId?: string) =>
    api.get<{
      projectId: string;
      projectName: string;
      domain: string;
      packStatus: "draft" | "in_review" | "approved";
      documents: GovernanceDocSummary[];
    }>(`/companies/${companyId}/governance/documents${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`),

  getDocument: (companyId: string, kind: string, projectId?: string) =>
    api.get<GovernanceDocDetail>(
      `/companies/${companyId}/governance/documents/${kind}${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`
    ),

  updateDocument: (companyId: string, kind: string, content: string, changeSummary?: string, projectId?: string) =>
    api.put<{
      success: boolean;
      kind: string;
      version: number;
      isValid: boolean;
      missingSections: string[];
      document: GovernanceDocDetail;
    }>(`/companies/${companyId}/governance/documents/${kind}${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`, { content, changeSummary }),

  reviewDocument: (
    companyId: string,
    kind: string,
    data: {
      reviewerRole: string;
      status: "approved" | "changes_requested";
      comments: string;
    },
    projectId?: string,
  ) =>
    api.post<{
      success: boolean;
      review: any;
      reviews: any[];
    }>(`/companies/${companyId}/governance/documents/${kind}/review${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`, data),

  approvePack: (companyId: string, projectId?: string) =>
    api.post<{
      success: boolean;
      packStatus: "approved";
      message: string;
      projectId: string;
      projectName: string;
      approvedAt: string;
    }>(`/companies/${companyId}/governance/pack/approve`, { projectId }),

  getExportUrl: (companyId: string, format: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/${format}`
      : `/api/companies/${companyId}/governance/export/${format}`,

  getZipExportUrl: (companyId: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/zip`
      : `/api/companies/${companyId}/governance/export/zip`,

  getJiraExportUrl: (companyId: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/jira`
      : `/api/companies/${companyId}/governance/export/jira`,

  getXlsxExportUrl: (companyId: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/xlsx`
      : `/api/companies/${companyId}/governance/export/xlsx`,

  getMarkdownExportUrl: (companyId: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/markdown`
      : `/api/companies/${companyId}/governance/export/markdown`,

  getPdfExportUrl: (companyId: string, projectId?: string) =>
    projectId
      ? `/api/companies/${companyId}/governance/projects/${projectId}/export/pdf`
      : `/api/companies/${companyId}/governance/export/pdf`,

  getTeamState: (companyId: string) =>
    api.get<{
      companyId: string;
      members: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        primarySkills: string[];
        weeklyCapacityHours: number;
        assignedHours: number;
      }>;
      tickets: Array<{
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
      }>;
      updatedAt: string;
    }>(`/companies/${companyId}/governance/team`),

  convertSprintToTickets: (companyId: string) =>
    api.post<any>(`/companies/${companyId}/governance/team/convert`, {}),

  assignTicket: (
    companyId: string,
    ticketId: string,
    patch: { assigneeMemberId?: string | null; status?: string },
  ) =>
    api.put<{ success: boolean; ticket: any }>(
      `/companies/${companyId}/governance/team/tickets/${ticketId}`,
      patch,
    ),

  getTeamExportUrl: (companyId: string) =>
    `/api/companies/${companyId}/governance/team/export`,
};
