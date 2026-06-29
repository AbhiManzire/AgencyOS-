import type { CreateTimeEntryDto } from '../dto/create-time-entry.dto';
import type { StartTimeEntryDto } from '../dto/start-time-entry.dto';
import type { StopTimeEntryDto } from '../dto/stop-time-entry.dto';
import type { UpdateTimeEntryDto } from '../dto/update-time-entry.dto';
import type {
  CreateTimeEntryCommand,
  StartTimeEntryCommand,
  StopTimeEntryCommand,
  UpdateTimeEntryCommand,
} from '../services/time-entry-application.types';

export const TimeEntryMapper = {
  toCreateTimeEntryCommand(dto: CreateTimeEntryDto): CreateTimeEntryCommand {
    return {
      userId: dto.userId,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      billable: dto.billable,
      notes: dto.notes,
    };
  },

  toUpdateTimeEntryCommand(dto: UpdateTimeEntryDto): UpdateTimeEntryCommand {
    return {
      ...(dto.userId !== undefined ? { userId: dto.userId } : {}),
      ...(dto.startTime !== undefined ? { startTime: new Date(dto.startTime) } : {}),
      ...(dto.endTime !== undefined ? { endTime: new Date(dto.endTime) } : {}),
      ...(dto.billable !== undefined ? { billable: dto.billable } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };
  },

  toStartTimeEntryCommand(dto: StartTimeEntryDto): StartTimeEntryCommand {
    return {
      billable: dto.billable,
    };
  },

  toStopTimeEntryCommand(dto: StopTimeEntryDto): StopTimeEntryCommand {
    return {
      ...(dto.billable !== undefined ? { billable: dto.billable } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };
  },
};
