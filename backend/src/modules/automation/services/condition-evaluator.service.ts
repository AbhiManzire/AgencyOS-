import { Injectable } from '@nestjs/common';
import { WorkflowConditionOperator } from '@prisma/client';
import type { ConditionSpec } from '../automation.types';

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
      case WorkflowConditionOperator.GREATER_THAN:
        return this.compare(fieldValue, spec.value) > 0;
      case WorkflowConditionOperator.LESS_THAN:
        return this.compare(fieldValue, spec.value) < 0;
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
