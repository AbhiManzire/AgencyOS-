export type ProjectServiceType =
  | 'WEBSITE_DEVELOPMENT'
  | 'SEO'
  | 'GOOGLE_ADS'
  | 'META_ADS'
  | 'HOSTING'
  | 'SOFTWARE_DEVELOPMENT'
  | 'AI_AUTOMATION'
  | 'BRANDING'
  | 'CUSTOM';

export const PROJECT_SERVICE_TYPES: readonly ProjectServiceType[] = [
  'WEBSITE_DEVELOPMENT',
  'SEO',
  'GOOGLE_ADS',
  'META_ADS',
  'HOSTING',
  'SOFTWARE_DEVELOPMENT',
  'AI_AUTOMATION',
  'BRANDING',
  'CUSTOM',
] as const;

export const PROJECT_SERVICE_TYPE_LABELS: Record<ProjectServiceType, string> = {
  WEBSITE_DEVELOPMENT: 'Website Development',
  SEO: 'SEO',
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  HOSTING: 'Hosting',
  SOFTWARE_DEVELOPMENT: 'Software Development',
  AI_AUTOMATION: 'AI Automation',
  BRANDING: 'Branding',
  CUSTOM: 'Custom',
};

export interface ProjectTemplateMilestone {
  readonly id?: string;
  readonly name: string;
  readonly description?: string | null;
  readonly offsetDays: number;
  readonly sortOrder: number;
}

export interface ProjectTemplateTask {
  readonly id?: string;
  readonly title: string;
  readonly description?: string | null;
  readonly priority?: string;
  readonly estimatedHours?: number | null;
  readonly offsetDays: number;
  readonly sortOrder: number;
  readonly templateMilestoneId?: string | null;
}

export interface ProjectTemplateDeliverable {
  readonly id?: string;
  readonly title: string;
  readonly description?: string | null;
  readonly sortOrder: number;
}

export interface ProjectTemplateRequiredDocument {
  readonly id?: string;
  readonly title: string;
  readonly folder?: string | null;
  readonly sortOrder: number;
}

export interface ProjectTemplateRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly serviceType: ProjectServiceType;
  readonly defaultDurationDays: number | null;
  readonly defaultEstimatedHours: number | null;
  readonly isActive: boolean;
  readonly milestones: readonly ProjectTemplateMilestone[];
  readonly tasks: readonly ProjectTemplateTask[];
  readonly deliverables: readonly ProjectTemplateDeliverable[];
  readonly requiredDocuments: readonly ProjectTemplateRequiredDocument[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListProjectTemplatesParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly serviceType?: ProjectServiceType;
  readonly isActive?: boolean;
}

export interface ListProjectTemplatesResult {
  readonly items: readonly ProjectTemplateRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateProjectTemplatePayload {
  readonly name: string;
  readonly description?: string;
  readonly serviceType: ProjectServiceType;
  readonly defaultDurationDays?: number;
  readonly defaultEstimatedHours?: number;
  readonly isActive?: boolean;
  readonly milestones?: readonly Omit<ProjectTemplateMilestone, 'id'>[];
  readonly tasks?: readonly Omit<ProjectTemplateTask, 'id'>[];
  readonly deliverables?: readonly Omit<ProjectTemplateDeliverable, 'id'>[];
  readonly requiredDocuments?: readonly Omit<ProjectTemplateRequiredDocument, 'id'>[];
}

export interface UpdateProjectTemplatePayload {
  readonly name?: string;
  readonly description?: string | null;
  readonly serviceType?: ProjectServiceType;
  readonly defaultDurationDays?: number | null;
  readonly defaultEstimatedHours?: number | null;
  readonly isActive?: boolean;
  readonly milestones?: readonly Omit<ProjectTemplateMilestone, 'id'>[];
  readonly tasks?: readonly Omit<ProjectTemplateTask, 'id'>[];
  readonly deliverables?: readonly Omit<ProjectTemplateDeliverable, 'id'>[];
  readonly requiredDocuments?: readonly Omit<ProjectTemplateRequiredDocument, 'id'>[];
}
