import type { ProjectServiceType } from '@prisma/client';
import type {
  NestedTemplateDeliverableInput,
  NestedTemplateMilestoneInput,
  NestedTemplateRequiredDocumentInput,
  NestedTemplateTaskInput,
} from '../repositories/project-template.repository.interface';

export interface DefaultTemplateDefinition {
  readonly name: string;
  readonly serviceType: ProjectServiceType;
  readonly description: string;
  readonly defaultDurationDays: number;
  readonly defaultEstimatedHours: number;
  readonly milestones: readonly NestedTemplateMilestoneInput[];
  readonly tasks: readonly NestedTemplateTaskInput[];
  readonly deliverables: readonly NestedTemplateDeliverableInput[];
  readonly requiredDocuments: readonly NestedTemplateRequiredDocumentInput[];
}

function ms(
  name: string,
  offsetDays: number,
  sortOrder: number,
  description?: string,
): NestedTemplateMilestoneInput {
  return {
    name,
    offsetDays,
    sortOrder,
    description: description ?? null,
    tempKey: `ms-${String(sortOrder)}`,
  };
}

function task(
  title: string,
  milestoneSortOrder: number,
  sortOrder: number,
  checklist: readonly string[] = [],
  estimatedHours?: number,
): NestedTemplateTaskInput {
  return {
    title,
    milestoneSortOrder,
    sortOrder,
    estimatedHours: estimatedHours ?? null,
    checklistJson: checklist.length > 0 ? checklist.map((c) => ({ title: c })) : null,
  };
}

export const DEFAULT_PROJECT_TEMPLATES: readonly DefaultTemplateDefinition[] = [
  {
    name: 'Website Development',
    serviceType: 'WEBSITE_DEVELOPMENT',
    description: 'End-to-end website design and development engagement.',
    defaultDurationDays: 60,
    defaultEstimatedHours: 160,
    milestones: [
      ms('Discovery & Planning', 7, 0),
      ms('Design', 21, 1),
      ms('Development', 45, 2),
      ms('Launch', 60, 3),
    ],
    tasks: [
      task('Stakeholder kickoff', 0, 0, ['Agenda', 'Requirements notes'], 4),
      task('Sitemap & wireframes', 0, 1, ['Home', 'Inner pages'], 12),
      task('UI design system', 1, 2, ['Colors', 'Typography', 'Components'], 20),
      task('Frontend build', 2, 3, ['Responsive QA'], 40),
      task('CMS / content setup', 2, 4, ['Pages seeded'], 16),
      task('UAT & go-live', 3, 5, ['DNS', 'SSL', 'Analytics'], 12),
    ],
    deliverables: [
      { title: 'Approved designs', sortOrder: 0 },
      { title: 'Production website', sortOrder: 1 },
      { title: 'Admin access & handover', sortOrder: 2 },
    ],
    requiredDocuments: [
      { title: 'Brand assets', folder: 'DESIGN_FILES', sortOrder: 0 },
      { title: 'Content copy', folder: 'OTHER', sortOrder: 1 },
    ],
  },
  {
    name: 'SEO',
    serviceType: 'SEO',
    description: 'Technical and content SEO retainer / project.',
    defaultDurationDays: 90,
    defaultEstimatedHours: 80,
    milestones: [
      ms('Audit', 14, 0),
      ms('On-page optimization', 45, 1),
      ms('Content & links', 75, 2),
      ms('Reporting', 90, 3),
    ],
    tasks: [
      task('Technical SEO audit', 0, 0, ['Crawl', 'Core Web Vitals'], 12),
      task('Keyword research', 0, 1, ['Primary keywords'], 8),
      task('On-page fixes', 1, 2, ['Titles', 'Meta', 'Internal links'], 20),
      task('Content brief pack', 2, 3, [], 16),
      task('Monthly performance report', 3, 4, [], 6),
    ],
    deliverables: [
      { title: 'SEO audit report', sortOrder: 0 },
      { title: 'Optimized pages list', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'Analytics access', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'Google Ads',
    serviceType: 'GOOGLE_ADS',
    description: 'Google Ads campaign setup and optimization.',
    defaultDurationDays: 30,
    defaultEstimatedHours: 40,
    milestones: [
      ms('Account & tracking setup', 5, 0),
      ms('Campaign build', 14, 1),
      ms('Optimization', 30, 2),
    ],
    tasks: [
      task('Conversion tracking', 0, 0, ['GA4', 'Ads tag'], 6),
      task('Campaign structure', 1, 1, ['Search', 'Remarketing'], 12),
      task('Creative & extensions', 1, 2, [], 8),
      task('Bid & budget optimization', 2, 3, [], 10),
    ],
    deliverables: [
      { title: 'Live campaigns', sortOrder: 0 },
      { title: 'Performance dashboard', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'Ads account access', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'Meta Ads',
    serviceType: 'META_ADS',
    description: 'Meta (Facebook/Instagram) ads delivery.',
    defaultDurationDays: 30,
    defaultEstimatedHours: 40,
    milestones: [
      ms('Pixel & audiences', 5, 0),
      ms('Creative & campaigns', 14, 1),
      ms('Scale & report', 30, 2),
    ],
    tasks: [
      task('Pixel / CAPI setup', 0, 0, [], 6),
      task('Audience definition', 0, 1, [], 4),
      task('Ad creatives', 1, 2, ['Static', 'Video'], 12),
      task('Campaign launch & A/B', 1, 3, [], 10),
      task('Optimization report', 2, 4, [], 6),
    ],
    deliverables: [
      { title: 'Active ad sets', sortOrder: 0 },
      { title: 'Results report', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'Business Manager access', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'Hosting',
    serviceType: 'HOSTING',
    description: 'Hosting provisioning, migration, and monitoring.',
    defaultDurationDays: 14,
    defaultEstimatedHours: 24,
    milestones: [ms('Provisioning', 3, 0), ms('Migration', 10, 1), ms('Handover', 14, 2)],
    tasks: [
      task('Environment setup', 0, 0, ['Staging', 'Prod'], 6),
      task('DNS & SSL', 0, 1, [], 4),
      task('Data migration', 1, 2, ['Backup verified'], 8),
      task('Monitoring & docs', 2, 3, [], 4),
    ],
    deliverables: [
      { title: 'Live hosting environment', sortOrder: 0 },
      { title: 'Access credentials', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'Domain registrar access', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'Software Development',
    serviceType: 'SOFTWARE_DEVELOPMENT',
    description: 'Custom software / product delivery.',
    defaultDurationDays: 90,
    defaultEstimatedHours: 320,
    milestones: [
      ms('Requirements', 14, 0),
      ms('MVP build', 60, 1),
      ms('Hardening & release', 90, 2),
    ],
    tasks: [
      task('PRD & backlog', 0, 0, [], 16),
      task('Architecture & setup', 0, 1, [], 20),
      task('Feature sprints', 1, 2, ['Sprint reviews'], 160),
      task('QA & UAT', 2, 3, [], 40),
      task('Production release', 2, 4, [], 16),
    ],
    deliverables: [
      { title: 'Source repository access', sortOrder: 0 },
      { title: 'Deployed application', sortOrder: 1 },
      { title: 'Technical documentation', sortOrder: 2 },
    ],
    requiredDocuments: [{ title: 'Product brief', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'AI Automation',
    serviceType: 'AI_AUTOMATION',
    description: 'AI workflow and automation delivery.',
    defaultDurationDays: 45,
    defaultEstimatedHours: 80,
    milestones: [
      ms('Process discovery', 7, 0),
      ms('Prototype', 21, 1),
      ms('Production automation', 45, 2),
    ],
    tasks: [
      task('Use-case mapping', 0, 0, [], 8),
      task('Data & tool integrations', 1, 1, [], 20),
      task('Prompt / agent design', 1, 2, [], 16),
      task('Pilot with users', 2, 3, [], 12),
      task('Ops runbook', 2, 4, [], 8),
    ],
    deliverables: [
      { title: 'Working automation', sortOrder: 0 },
      { title: 'Runbook & training', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'System access list', folder: 'OTHER', sortOrder: 0 }],
  },
  {
    name: 'Branding',
    serviceType: 'BRANDING',
    description: 'Brand identity and guidelines delivery.',
    defaultDurationDays: 30,
    defaultEstimatedHours: 60,
    milestones: [ms('Discovery', 7, 0), ms('Concepts', 16, 1), ms('Final identity', 30, 2)],
    tasks: [
      task('Brand workshop', 0, 0, [], 6),
      task('Moodboards', 0, 1, [], 8),
      task('Logo concepts', 1, 2, ['3 directions'], 16),
      task('Visual system', 2, 3, [], 16),
      task('Brand guidelines PDF', 2, 4, [], 10),
    ],
    deliverables: [
      { title: 'Logo package', sortOrder: 0 },
      { title: 'Brand guidelines', sortOrder: 1 },
    ],
    requiredDocuments: [{ title: 'Existing assets', folder: 'DESIGN_FILES', sortOrder: 0 }],
  },
];
