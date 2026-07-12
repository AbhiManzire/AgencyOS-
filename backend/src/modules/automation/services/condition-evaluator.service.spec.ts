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
});
