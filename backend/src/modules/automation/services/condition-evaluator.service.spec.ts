import { WorkflowConditionOperator } from '@prisma/client';
import { ConditionEvaluatorService } from './condition-evaluator.service';

describe('ConditionEvaluatorService', () => {
  const service = new ConditionEvaluatorService();

  describe('evaluateCondition', () => {
    it('evaluates EQUALS for matching primitives', () => {
      expect(
        service.evaluateCondition(
          { field: 'status', operator: WorkflowConditionOperator.EQUALS, value: 'active' },
          { status: 'active' },
        ),
      ).toBe(true);
    });

    it('evaluates NOT_EQUALS', () => {
      expect(
        service.evaluateCondition(
          { field: 'count', operator: WorkflowConditionOperator.NOT_EQUALS, value: 5 },
          { count: 3 },
        ),
      ).toBe(true);
    });

    it('evaluates CONTAINS for strings', () => {
      expect(
        service.evaluateCondition(
          { field: 'title', operator: WorkflowConditionOperator.CONTAINS, value: 'urgent' },
          { title: 'urgent task update' },
        ),
      ).toBe(true);
    });

    it('evaluates CONTAINS for arrays', () => {
      expect(
        service.evaluateCondition(
          { field: 'tags', operator: WorkflowConditionOperator.CONTAINS, value: 'billing' },
          { tags: ['sales', 'billing'] },
        ),
      ).toBe(true);
    });

    it('evaluates STARTS_WITH', () => {
      expect(
        service.evaluateCondition(
          { field: 'email', operator: WorkflowConditionOperator.STARTS_WITH, value: 'sales@' },
          { email: 'sales@agency.com' },
        ),
      ).toBe(true);
    });

    it('evaluates ENDS_WITH', () => {
      expect(
        service.evaluateCondition(
          { field: 'email', operator: WorkflowConditionOperator.ENDS_WITH, value: '.com' },
          { email: 'sales@agency.com' },
        ),
      ).toBe(true);
    });

    it('evaluates BETWEEN with array bounds', () => {
      expect(
        service.evaluateCondition(
          { field: 'amount', operator: WorkflowConditionOperator.BETWEEN, value: [100, 200] },
          { amount: 150 },
        ),
      ).toBe(true);
    });

    it('evaluates BETWEEN with object bounds', () => {
      expect(
        service.evaluateCondition(
          {
            field: 'amount',
            operator: WorkflowConditionOperator.BETWEEN,
            value: { min: 100, max: 200 },
          },
          { amount: 100 },
        ),
      ).toBe(true);
    });

    it('evaluates EMPTY for null, empty string, and empty array', () => {
      expect(
        service.evaluateCondition(
          { field: 'notes', operator: WorkflowConditionOperator.EMPTY },
          { notes: null },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { field: 'notes', operator: WorkflowConditionOperator.EMPTY },
          { notes: '' },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { field: 'tags', operator: WorkflowConditionOperator.EMPTY },
          { tags: [] },
        ),
      ).toBe(true);
    });

    it('evaluates NOT_EMPTY', () => {
      expect(
        service.evaluateCondition(
          { field: 'notes', operator: WorkflowConditionOperator.NOT_EMPTY },
          { notes: 'hello' },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { field: 'notes', operator: WorkflowConditionOperator.NOT_EMPTY },
          { notes: '' },
        ),
      ).toBe(false);
    });

    it('evaluates GREATER_THAN for numbers', () => {
      expect(
        service.evaluateCondition(
          { field: 'amount', operator: WorkflowConditionOperator.GREATER_THAN, value: 100 },
          { amount: 150 },
        ),
      ).toBe(true);
    });

    it('evaluates LESS_THAN for numbers', () => {
      expect(
        service.evaluateCondition(
          { field: 'amount', operator: WorkflowConditionOperator.LESS_THAN, value: 100 },
          { amount: 50 },
        ),
      ).toBe(true);
    });

    it('evaluates IS_SET', () => {
      expect(
        service.evaluateCondition(
          { field: 'assigneeId', operator: WorkflowConditionOperator.IS_SET },
          { assigneeId: 'user-1' },
        ),
      ).toBe(true);
    });

    it('evaluates IS_NOT_SET', () => {
      expect(
        service.evaluateCondition(
          { field: 'assigneeId', operator: WorkflowConditionOperator.IS_NOT_SET },
          { assigneeId: null },
        ),
      ).toBe(true);
    });

    it('resolves nested field paths', () => {
      expect(
        service.evaluateCondition(
          { field: 'task.status', operator: WorkflowConditionOperator.EQUALS, value: 'DONE' },
          { task: { status: 'DONE' } },
        ),
      ).toBe(true);
    });
  });

  describe('evaluateAll', () => {
    it('returns true when all conditions pass', () => {
      const payload = { status: 'active', amount: 200 };

      expect(
        service.evaluateAll(
          [
            { field: 'status', operator: WorkflowConditionOperator.EQUALS, value: 'active' },
            { field: 'amount', operator: WorkflowConditionOperator.GREATER_THAN, value: 100 },
          ],
          payload,
        ),
      ).toBe(true);
    });

    it('returns false when any condition fails', () => {
      const payload = { status: 'active', amount: 50 };

      expect(
        service.evaluateAll(
          [
            { field: 'status', operator: WorkflowConditionOperator.EQUALS, value: 'active' },
            { field: 'amount', operator: WorkflowConditionOperator.GREATER_THAN, value: 100 },
          ],
          payload,
        ),
      ).toBe(false);
    });

    it('returns true for an empty condition list', () => {
      expect(service.evaluateAll([], { status: 'active' })).toBe(true);
    });
  });

  describe('evaluateTree', () => {
    it('returns true for empty tree', () => {
      expect(service.evaluateTree([], { status: 'active' })).toBe(true);
    });

    it('ANDs root condition nodes by default', () => {
      expect(
        service.evaluateTree(
          [
            {
              id: 'c1',
              parentId: null,
              nodeType: 'CONDITION',
              logic: 'AND',
              field: 'status',
              operator: WorkflowConditionOperator.EQUALS,
              value: 'active',
            },
            {
              id: 'c2',
              parentId: null,
              nodeType: 'CONDITION',
              logic: 'AND',
              field: 'amount',
              operator: WorkflowConditionOperator.GREATER_THAN,
              value: 100,
            },
          ],
          { status: 'active', amount: 50 },
        ),
      ).toBe(false);
    });

    it('evaluates nested OR groups', () => {
      expect(
        service.evaluateTree(
          [
            {
              id: 'g1',
              parentId: null,
              nodeType: 'GROUP',
              logic: 'OR',
            },
            {
              id: 'c1',
              parentId: 'g1',
              nodeType: 'CONDITION',
              logic: 'AND',
              field: 'status',
              operator: WorkflowConditionOperator.EQUALS,
              value: 'active',
            },
            {
              id: 'c2',
              parentId: 'g1',
              nodeType: 'CONDITION',
              logic: 'AND',
              field: 'status',
              operator: WorkflowConditionOperator.EQUALS,
              value: 'pending',
            },
          ],
          { status: 'pending' },
        ),
      ).toBe(true);
    });
  });
});
