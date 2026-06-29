import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from '../../activities/services/activity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TASK_REPOSITORY } from '../../tasks/repositories/task.repository.interface';
import { TimeEntryDomainService } from '../domain/time-entry-domain.service';
import {
  TIME_ENTRY_DOMAIN_ERROR_CODES,
  TimeEntryDomainError,
} from '../domain/time-entry-domain.errors';
import { TIME_ENTRY_REPOSITORY } from '../repositories/time-entry.repository.interface';
import { TimeEntryService } from './time-entry.service';

describe('TimeEntryService', () => {
  let service: TimeEntryService;

  const scope = {
    tenantId: '00000000-0000-4000-8000-000000000001',
    workspaceId: '00000000-0000-4000-8000-000000000002',
  };

  const taskId = '00000000-0000-4000-8000-000000000020';
  const actorUserId = '00000000-0000-4000-8000-000000000030';

  const timeEntryRepository = {
    listByTask: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const taskRepository = {
    findById: jest.fn(),
  };

  const activityService = {
    createActivity: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn(async (work: () => Promise<unknown>) => work()),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntryService,
        TimeEntryDomainService,
        { provide: TIME_ENTRY_REPOSITORY, useValue: timeEntryRepository },
        { provide: TASK_REPOSITORY, useValue: taskRepository },
        { provide: ActivityService, useValue: activityService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TimeEntryService);
  });

  it('lists entries for an existing task', async () => {
    taskRepository.findById.mockResolvedValue({ id: taskId });
    timeEntryRepository.listByTask.mockResolvedValue([]);

    const entries = await service.listByTask(scope, taskId);

    expect(entries).toEqual([]);
    expect(timeEntryRepository.listByTask).toHaveBeenCalledWith({
      ...scope,
      taskId,
    });
  });

  it('throws when listing entries for a missing task', async () => {
    taskRepository.findById.mockResolvedValue(null);

    await expect(service.listByTask(scope, taskId)).rejects.toMatchObject({
      code: TIME_ENTRY_DOMAIN_ERROR_CODES.TASK_NOT_FOUND,
    } satisfies Partial<TimeEntryDomainError>);
  });

  it('creates a time entry and logs activity', async () => {
    taskRepository.findById.mockResolvedValue({ id: taskId });

    const createdEntry = {
      id: '00000000-0000-4000-8000-000000000040',
      notes: 'Implementation',
      billable: true,
    };

    timeEntryRepository.create.mockResolvedValue(createdEntry);

    const startTime = new Date('2026-06-28T09:00:00.000Z');
    const endTime = new Date('2026-06-28T10:00:00.000Z');

    const entry = await service.createTimeEntry(
      scope,
      taskId,
      {
        startTime,
        endTime,
        notes: 'Implementation',
      },
      { actorUserId },
    );

    expect(entry).toBe(createdEntry);
    expect(timeEntryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId,
        userId: actorUserId,
        durationMinutes: 60,
        billable: true,
        notes: 'Implementation',
      }),
    );
    expect(activityService.createActivity).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        entityType: 'task',
        entityId: taskId,
        type: 'time.logged',
      }),
      { actorUserId },
    );
  });
});
