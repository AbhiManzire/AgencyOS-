import {
  CreateRecurringDto,
  ListRecurringQueryDto,
  UpdateRecurringDto,
} from '../dto/create-recurring.dto';
import type {
  CreateRecurringCommand,
  ListRecurringQuery,
  UpdateRecurringCommand,
} from '../services/recurring-application.types';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const RecurringMapper = {
  toCreateCommand(dto: CreateRecurringDto): CreateRecurringCommand {
    return {
      frequency: dto.frequency,
      nextRunAt: dto.nextRunAt,
      isActive: dto.isActive,
      template: dto.template,
      reminderDaysBefore: dto.reminderDaysBefore,
    };
  },

  toUpdateCommand(dto: UpdateRecurringDto): UpdateRecurringCommand {
    return {
      frequency: dto.frequency,
      nextRunAt: dto.nextRunAt,
      isActive: dto.isActive,
      template: dto.template,
      reminderDaysBefore: dto.reminderDaysBefore,
    };
  },

  toListQuery(dto: ListRecurringQueryDto): ListRecurringQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      isActive: dto.isActive,
      includeArchived: dto.includeArchived,
    };
  },
};
