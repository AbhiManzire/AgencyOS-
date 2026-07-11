import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ListExpensesQueryDto } from '../dto/list-expenses-query.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { ExpenseMapper } from '../mappers/expense.mapper';
import type { ExpenseRecord } from '../repositories/expense.repository.interface';
import type {
  ExpenseApplicationContext,
  ExpenseScope,
} from '../services/expense-application.types';
import { ExpenseService } from '../services/expense.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermissions('finance.expenses.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateExpenseDto,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ExpenseMapper.toCreateExpenseCommand(dto);
    const expense = await this.expenseService.createExpense(scope, command, context);
    return successResponse(expense);
  }

  @Get()
  @RequirePermissions('finance.expenses.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListExpensesQueryDto,
  ): Promise<ApiSuccessResponse<readonly ExpenseRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ExpenseMapper.toListExpensesQuery(queryDto);
    const result = await this.expenseService.listExpenses(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('finance.expenses.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const expense = await this.expenseService.getExpense(scope, id);
    return successResponse(expense);
  }

  @Patch(':id')
  @RequirePermissions('finance.expenses.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ExpenseMapper.toUpdateExpenseCommand(dto);
    const expense = await this.expenseService.updateExpense(scope, id, command, context);
    return successResponse(expense);
  }

  @Post(':id/approve')
  @RequirePermissions('finance.expenses.update')
  async approve(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const expense = await this.expenseService.approveExpense(scope, id, context);
    return successResponse(expense);
  }

  @Post(':id/reject')
  @RequirePermissions('finance.expenses.update')
  async reject(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const expense = await this.expenseService.rejectExpense(scope, id, context);
    return successResponse(expense);
  }

  @Delete(':id')
  @RequirePermissions('finance.expenses.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const expense = await this.expenseService.archiveExpense(scope, id, context);
    return successResponse(expense);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ExpenseScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ExpenseApplicationContext {
    return { actorUserId: this.readHeader(headers, USER_HEADER) };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
