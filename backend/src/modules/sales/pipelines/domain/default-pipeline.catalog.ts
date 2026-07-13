import type { DealStage } from '@prisma/client';

export interface DefaultPipelineStageDefinition {
  readonly stageKey: DealStage;
  readonly name: string;
  readonly sortOrder: number;
  readonly probability: number;
  readonly colorToken: string;
  readonly isWonStage: boolean;
  readonly isLostStage: boolean;
}

export const DEFAULT_PIPELINE_NAME = 'Default Pipeline';

export const DEFAULT_PIPELINE_STAGES: readonly DefaultPipelineStageDefinition[] = [
  {
    stageKey: 'QUALIFICATION',
    name: 'Qualification',
    sortOrder: 1,
    probability: 10,
    colorToken: '#3B82F6',
    isWonStage: false,
    isLostStage: false,
  },
  {
    stageKey: 'DISCOVERY',
    name: 'Discovery',
    sortOrder: 2,
    probability: 25,
    colorToken: '#6366F1',
    isWonStage: false,
    isLostStage: false,
  },
  {
    stageKey: 'PROPOSAL',
    name: 'Proposal',
    sortOrder: 3,
    probability: 50,
    colorToken: '#8B5CF6',
    isWonStage: false,
    isLostStage: false,
  },
  {
    stageKey: 'NEGOTIATION',
    name: 'Negotiation',
    sortOrder: 4,
    probability: 75,
    colorToken: '#F59E0B',
    isWonStage: false,
    isLostStage: false,
  },
  {
    stageKey: 'VERBAL_COMMIT',
    name: 'Verbal Commit',
    sortOrder: 5,
    probability: 90,
    colorToken: '#10B981',
    isWonStage: false,
    isLostStage: false,
  },
  {
    stageKey: 'WON',
    name: 'Won',
    sortOrder: 6,
    probability: 100,
    colorToken: '#059669',
    isWonStage: true,
    isLostStage: false,
  },
  {
    stageKey: 'LOST',
    name: 'Lost',
    sortOrder: 7,
    probability: 0,
    colorToken: '#EF4444',
    isWonStage: false,
    isLostStage: true,
  },
] as const;

export const DEAL_STAGE_DEFAULT_PROBABILITY: Readonly<Record<DealStage, number>> = {
  QUALIFICATION: 10,
  DISCOVERY: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  VERBAL_COMMIT: 90,
  WON: 100,
  LOST: 0,
  ARCHIVED: 0,
};
