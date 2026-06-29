import { TimeEntryDomainService } from './time-entry-domain.service';
import { TIME_ENTRY_DOMAIN_ERROR_CODES, TimeEntryDomainError } from './time-entry-domain.errors';
import type {
  TimeEntryRecord,
  TimeEntryScope,
} from '../repositories/time-entry.repository.interface';

describe('TimeEntryDomainService', () => {
  const service = new TimeEntryDomainService();

  const scope: TimeEntryScope = {
    tenantId: '00000000-0000-4000-8000-000000000001',
    workspaceId: '00000000-0000-4000-8000-000000000002',
  };

  const baseEntry: TimeEntryRecord = {
    id: '00000000-0000-4000-8000-000000000010',
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    taskId: '00000000-0000-4000-8000-000000000020',
    userId: '00000000-0000-4000-8000-000000000030',
    userDisplayName: 'Test User',
    userEmail: 'test@example.com',
    startTime: new Date('2026-06-28T09:00:00.000Z'),
    endTime: new Date('2026-06-28T10:30:00.000Z'),
    durationMinutes: 90,
    isRunning: false,
    billable: true,
    notes: null,
    createdAt: new Date('2026-06-28T09:00:00.000Z'),
    updatedAt: new Date('2026-06-28T09:00:00.000Z'),
    createdByUserId: null,
    updatedByUserId: null,
    deletedAt: null,
    deletedByUserId: null,
  };

  it('accepts a valid time range on create', () => {
    expect(() => {
      service.validateCreate({
        startTime: new Date('2026-06-28T09:00:00.000Z'),
        endTime: new Date('2026-06-28T10:00:00.000Z'),
      });
    }).not.toThrow();
  });

  it('rejects end time before start time', () => {
    try {
      service.validateCreate({
        startTime: new Date('2026-06-28T10:00:00.000Z'),
        endTime: new Date('2026-06-28T09:00:00.000Z'),
      });
      fail('Expected TimeEntryDomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeEntryDomainError);
      expect((error as TimeEntryDomainError).code).toBe(
        TIME_ENTRY_DOMAIN_ERROR_CODES.INVALID_TIME_RANGE,
      );
    }
  });

  it('computes duration in minutes', () => {
    const duration = service.computeDurationMinutes(
      new Date('2026-06-28T09:00:00.000Z'),
      new Date('2026-06-28T10:30:00.000Z'),
    );

    expect(duration).toBe(90);
  });

  it('normalizes blank notes to null', () => {
    expect(service.normalizeNotes('   ')).toBeNull();
    expect(service.normalizeNotes('Worked on design')).toBe('Worked on design');
  });

  it('rejects updates on archived entries', () => {
    try {
      service.validateUpdate({ ...baseEntry, deletedAt: new Date('2026-06-28T11:00:00.000Z') }, {});
      fail('Expected TimeEntryDomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeEntryDomainError);
      expect((error as TimeEntryDomainError).code).toBe(
        TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_ARCHIVED,
      );
    }
  });

  it('rejects workspace ownership mismatch', () => {
    try {
      service.ensureWorkspaceOwnership(
        {
          tenantId: '00000000-0000-4000-8000-000000000099',
          workspaceId: scope.workspaceId,
        },
        baseEntry,
      );
      fail('Expected TimeEntryDomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeEntryDomainError);
      expect((error as TimeEntryDomainError).code).toBe(
        TIME_ENTRY_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
      );
    }
  });
});
