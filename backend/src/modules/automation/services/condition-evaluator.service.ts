import { Injectable } from '@nestjs/common';
import { WorkflowConditionOperator } from '@prisma/client';
import type { ConditionSpec, ConditionTreeNode } from '../automation.types';

@Injectable()
export class ConditionEvaluatorService {
  evaluateCondition(spec: ConditionSpec, payload: Record<string, unknown>): boolean {
    const fieldValue = this.resolveFieldValue(payload, spec.field);

    switch (spec.operator) {
      case WorkflowConditionOperator.EQUALS:
        return this.areEqual(fieldValue, spec.value);
      case WorkflowConditionOperator.NOT_EQUALS:
        return !this.areEqual(fieldValue, spec.value);
      case WorkflowConditionOperator.CONTAINS:
        return this.contains(fieldValue, spec.value);
      case WorkflowConditionOperator.STARTS_WITH:
        return this.startsWith(fieldValue, spec.value);
      case WorkflowConditionOperator.ENDS_WITH:
        return this.endsWith(fieldValue, spec.value);
      case WorkflowConditionOperator.GREATER_THAN:
        return this.compare(fieldValue, spec.value) > 0;
      case WorkflowConditionOperator.LESS_THAN:
        return this.compare(fieldValue, spec.value) < 0;
      case WorkflowConditionOperator.BETWEEN:
        return this.isBetween(fieldValue, spec.value);
      case WorkflowConditionOperator.EMPTY:
        return this.isEmpty(fieldValue);
      case WorkflowConditionOperator.NOT_EMPTY:
        return !this.isEmpty(fieldValue);
      case WorkflowConditionOperator.IS_SET:
        return this.isSet(fieldValue);
      case WorkflowConditionOperator.IS_NOT_SET:
        return !this.isSet(fieldValue);
      default:
        return false;
    }
  }

  evaluateAll(conditions: readonly ConditionSpec[], payload: Record<string, unknown>): boolean {
    if (conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) => this.evaluateCondition(condition, payload));
  }

  /**
   * Evaluates a nested condition tree. Root nodes (parentId null) are combined with AND.
   * GROUP nodes combine their children using the group's logic (AND|OR).
   */
  evaluateTree(nodes: readonly ConditionTreeNode[], payload: Record<string, unknown>): boolean {
    if (nodes.length === 0) {
      return true;
    }

    const childrenByParent = new Map<string | null, ConditionTreeNode[]>();
    for (const node of nodes) {
      const parentKey = node.parentId ?? null;
      const siblings = childrenByParent.get(parentKey) ?? [];
      siblings.push(node);
      childrenByParent.set(parentKey, siblings);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    const roots = childrenByParent.get(null) ?? [];
    if (roots.length === 0) {
      return true;
    }

    return roots.every((root) => this.evaluateNode(root, childrenByParent, payload));
  }

  private evaluateNode(
    node: ConditionTreeNode,
    childrenByParent: Map<string | null, ConditionTreeNode[]>,
    payload: Record<string, unknown>,
  ): boolean {
    if (node.nodeType === 'GROUP') {
      const children = childrenByParent.get(node.id) ?? [];
      if (children.length === 0) {
        return true;
      }

      const logic = node.logic;
      if (logic === 'OR') {
        return children.some((child) => this.evaluateNode(child, childrenByParent, payload));
      }

      return children.every((child) => this.evaluateNode(child, childrenByParent, payload));
    }

    if (!node.field || !node.operator) {
      return false;
    }

    return this.evaluateCondition(
      {
        field: node.field,
        operator: node.operator,
        value: node.value,
      },
      payload,
    );
  }

  private resolveFieldValue(payload: Record<string, unknown>, field: string): unknown {
    const segments = field.split('.').filter((segment) => segment.length > 0);
    let current: unknown = payload;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private isSet(value: unknown): boolean {
    return value !== undefined && value !== null;
  }

  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value === '') {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    return false;
  }

  private startsWith(fieldValue: unknown, expected: unknown): boolean {
    if (typeof fieldValue !== 'string') {
      return false;
    }
    const expectedString = this.toPrimitiveString(expected);
    return expectedString !== null && fieldValue.startsWith(expectedString);
  }

  private endsWith(fieldValue: unknown, expected: unknown): boolean {
    if (typeof fieldValue !== 'string') {
      return false;
    }
    const expectedString = this.toPrimitiveString(expected);
    return expectedString !== null && fieldValue.endsWith(expectedString);
  }

  private isBetween(fieldValue: unknown, expected: unknown): boolean {
    const bounds = this.resolveBetweenBounds(expected);
    if (bounds === null) {
      return false;
    }

    const valueNumber = this.toComparableNumber(fieldValue);
    const minNumber = this.toComparableNumber(bounds.min);
    const maxNumber = this.toComparableNumber(bounds.max);

    if (valueNumber !== null && minNumber !== null && maxNumber !== null) {
      return valueNumber >= minNumber && valueNumber <= maxNumber;
    }

    const valueDate = this.toComparableDate(fieldValue);
    const minDate = this.toComparableDate(bounds.min);
    const maxDate = this.toComparableDate(bounds.max);

    if (valueDate !== null && minDate !== null && maxDate !== null) {
      const time = valueDate.getTime();
      return time >= minDate.getTime() && time <= maxDate.getTime();
    }

    return false;
  }

  private resolveBetweenBounds(expected: unknown): { min: unknown; max: unknown } | null {
    if (Array.isArray(expected) && expected.length >= 2) {
      return { min: expected[0], max: expected[1] };
    }

    if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
      const record = expected as Record<string, unknown>;
      if ('min' in record && 'max' in record) {
        return { min: record.min, max: record.max };
      }
    }

    return null;
  }

  private toPrimitiveString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return null;
  }

  private areEqual(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true;
    }

    if (left === null || left === undefined || right === null || right === undefined) {
      return false;
    }

    if (left instanceof Date && this.isDateLike(right)) {
      const rightDate = this.toComparableDate(right);
      return rightDate !== null && left.getTime() === rightDate.getTime();
    }

    if (right instanceof Date && this.isDateLike(left)) {
      const leftDate = this.toComparableDate(left);
      return leftDate !== null && leftDate.getTime() === right.getTime();
    }

    if (typeof left === 'number' && typeof right === 'string' && right.trim() !== '') {
      const parsed = Number(right);
      return !Number.isNaN(parsed) && left === parsed;
    }

    if (typeof right === 'number' && typeof left === 'string' && left.trim() !== '') {
      const parsed = Number(left);
      return !Number.isNaN(parsed) && parsed === right;
    }

    const leftString = this.toPrimitiveString(left);
    const rightString = this.toPrimitiveString(right);
    if (leftString !== null && rightString !== null) {
      return leftString === rightString;
    }

    return false;
  }

  private contains(fieldValue: unknown, expected: unknown): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    if (typeof fieldValue === 'string') {
      const expectedString = this.toPrimitiveString(expected);
      return expectedString !== null && fieldValue.includes(expectedString);
    }

    if (Array.isArray(fieldValue)) {
      return fieldValue.some((item) => this.areEqual(item, expected));
    }

    if (typeof fieldValue === 'object') {
      const key = this.toPrimitiveString(expected);
      return key !== null && Object.prototype.hasOwnProperty.call(fieldValue, key);
    }

    return false;
  }

  private compare(left: unknown, right: unknown): number {
    const leftNumber = this.toComparableNumber(left);
    const rightNumber = this.toComparableNumber(right);

    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber - rightNumber;
    }

    const leftDate = this.toComparableDate(left);
    const rightDate = this.toComparableDate(right);

    if (leftDate !== null && rightDate !== null) {
      return leftDate.getTime() - rightDate.getTime();
    }

    return Number.NaN;
  }

  private toComparableNumber(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private toComparableDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private isDateLike(value: unknown): boolean {
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return !Number.isNaN(new Date(value).getTime());
    }

    return false;
  }
}
