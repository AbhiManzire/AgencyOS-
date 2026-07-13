'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  addChildConditionNode,
  createEmptyConditionNode,
  removeConditionNode,
  updateConditionNode,
} from '@/features/workflows/forms/workflow-form.validation';
import type {
  WorkflowConditionFormNode,
  WorkflowConditionLogic,
  WorkflowConditionOperator,
} from '@/features/workflows/types';
import {
  OPERATORS_WITHOUT_VALUE,
  WORKFLOW_CONDITION_LOGIC_LABELS,
  WORKFLOW_CONDITION_OPERATOR_OPTIONS,
} from '@/features/workflows/types';

interface WorkflowConditionsEditorProps {
  readonly nodes: readonly WorkflowConditionFormNode[];
  readonly rootLogic: WorkflowConditionLogic;
  readonly disabled?: boolean;
  readonly onRootLogicChange: (logic: WorkflowConditionLogic) => void;
  readonly onChange: (nodes: readonly WorkflowConditionFormNode[]) => void;
}

/** Conditions tree editor with AND/OR groups and nested children. */
export function WorkflowConditionsEditor({
  nodes,
  rootLogic,
  disabled = false,
  onRootLogicChange,
  onChange,
}: WorkflowConditionsEditorProps) {
  const patchNode = (
    key: string,
    updater: (node: WorkflowConditionFormNode) => WorkflowConditionFormNode,
  ): void => {
    onChange(updateConditionNode(nodes, key, updater));
  };

  const renderNode = (node: WorkflowConditionFormNode, depth: number): React.ReactNode => {
    const hideValue = OPERATORS_WITHOUT_VALUE.has(node.operator);

    return (
      <div
        key={node.key}
        className="space-y-2 rounded-md border border-border bg-background p-3"
        style={{ marginLeft: depth > 0 ? 12 : 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {node.nodeType === 'GROUP' ? 'Group' : 'Condition'}
          </span>
          <div className="flex flex-wrap gap-2">
            {node.nodeType === 'GROUP' ? (
              <NativeSelect
                value={node.logic}
                disabled={disabled}
                aria-label="Group logic"
                onChange={(event) => {
                  patchNode(node.key, (current) => ({
                    ...current,
                    logic: event.target.value as WorkflowConditionLogic,
                  }));
                }}
              >
                {(Object.keys(WORKFLOW_CONDITION_LOGIC_LABELS) as WorkflowConditionLogic[]).map(
                  (logic) => (
                    <option key={logic} value={logic}>
                      {WORKFLOW_CONDITION_LOGIC_LABELS[logic]}
                    </option>
                  ),
                )}
              </NativeSelect>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-1"
              onClick={() => {
                onChange(
                  addChildConditionNode(nodes, node.key, createEmptyConditionNode('CONDITION')),
                );
              }}
            >
              <Plus className="size-3.5" />
              Nested
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onChange(removeConditionNode(nodes, node.key));
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {node.nodeType === 'CONDITION' ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Field (e.g. status)"
              value={node.field}
              disabled={disabled}
              aria-label="Condition field"
              onChange={(event) => {
                patchNode(node.key, (current) => ({ ...current, field: event.target.value }));
              }}
            />
            <NativeSelect
              value={node.operator}
              disabled={disabled}
              aria-label="Condition operator"
              onChange={(event) => {
                patchNode(node.key, (current) => ({
                  ...current,
                  operator: event.target.value as WorkflowConditionOperator,
                }));
              }}
            >
              {WORKFLOW_CONDITION_OPERATOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            {!hideValue ? (
              <Input
                placeholder={node.operator === 'BETWEEN' ? 'min,max or JSON' : 'Value'}
                value={node.value}
                disabled={disabled}
                aria-label="Condition value"
                onChange={(event) => {
                  patchNode(node.key, (current) => ({ ...current, value: event.target.value }));
                }}
              />
            ) : (
              <p className="self-center text-xs text-muted-foreground">No value needed</p>
            )}
          </div>
        ) : null}

        {node.children.length > 0 ? (
          <div className="space-y-2 border-l border-border pl-3">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Match logic</span>
          <NativeSelect
            value={rootLogic}
            disabled={disabled}
            aria-label="Root condition logic"
            onChange={(event) => {
              onRootLogicChange(event.target.value as WorkflowConditionLogic);
            }}
          >
            {(Object.keys(WORKFLOW_CONDITION_LOGIC_LABELS) as WorkflowConditionLogic[]).map(
              (logic) => (
                <option key={logic} value={logic}>
                  {WORKFLOW_CONDITION_LOGIC_LABELS[logic]}
                </option>
              ),
            )}
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1"
            onClick={() => {
              onChange([...nodes, createEmptyConditionNode('CONDITION')]);
            }}
          >
            <Plus className="size-3.5" />
            Condition
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1"
            onClick={() => {
              onChange([...nodes, createEmptyConditionNode('GROUP')]);
            }}
          >
            <Plus className="size-3.5" />
            Group
          </Button>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No conditions — workflow runs for every matching trigger.
        </p>
      ) : (
        <div className="space-y-2">{nodes.map((node) => renderNode(node, 0))}</div>
      )}
    </div>
  );
}
