import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ListExpensesQueryDto } from '../dto/list-expenses-query.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import type {
  CreateExpenseCommand,
  ListExpensesQuery,
  UpdateExpenseCommand,
} from '../services/expense-application.types';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const ExpenseMapper = {
  toCreateExpenseCommand(dto: CreateExpenseDto): CreateExpenseCommand {
    return {
      vendorId: dto.vendorId,
      category: dto.category,
      departmentId: dto.departmentId,
      employeeUserId: dto.employeeUserId,
      amount: dto.amount,
      taxAmount: dto.taxAmount,
      currency: dto.currency,
      expenseDate: dto.expenseDate,
      description: dto.description,
      approvalStatus: dto.approvalStatus,
      attachmentFileId: dto.attachmentFileId,
    };
  },

  toUpdateExpenseCommand(dto: UpdateExpenseDto): UpdateExpenseCommand {
    return {
      vendorId: dto.vendorId,
      category: dto.category,
      departmentId: dto.departmentId,
      employeeUserId: dto.employeeUserId,
      amount: dto.amount,
      taxAmount: dto.taxAmount,
      currency: dto.currency,
      expenseDate: dto.expenseDate,
      description: dto.description,
      attachmentFileId: dto.attachmentFileId,
    };
  },

  toListExpensesQuery(dto: ListExpensesQueryDto): ListExpensesQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      vendorId: dto.vendorId,
      category: dto.category,
      approvalStatus: dto.approvalStatus,
      employeeUserId: dto.employeeUserId,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },
};
