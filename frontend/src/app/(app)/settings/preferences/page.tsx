'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import type { PreferencesCategories } from '@/features/settings/api/settings.types';
import { usePreferences, useUpdatePreferences } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

type PreferenceTab =
  'general' | 'invoice' | 'finance' | 'sales' | 'task' | 'project' | 'notification' | 'email';

const TABS: readonly { id: PreferenceTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'finance', label: 'Finance' },
  { id: 'sales', label: 'Sales' },
  { id: 'task', label: 'Task' },
  { id: 'project', label: 'Project' },
  { id: 'notification', label: 'Notification' },
  { id: 'email', label: 'Email' },
];

interface CategoryFormState {
  invoiceDefaultPaymentTermsDays: string;
  invoicePrefix: string;
  financeFiscalYearLabel: string;
  salesDefaultPipelineVisible: boolean;
  taskDefaultPriority: string;
  projectRequireBudget: boolean;
  notificationEmailEnabled: boolean;
  emailFromName: string;
}

const DEFAULT_CATEGORY_STATE: CategoryFormState = {
  invoiceDefaultPaymentTermsDays: '30',
  invoicePrefix: 'INV',
  financeFiscalYearLabel: '',
  salesDefaultPipelineVisible: true,
  taskDefaultPriority: 'MEDIUM',
  projectRequireBudget: false,
  notificationEmailEnabled: true,
  emailFromName: '',
};

function readString(
  map: PreferencesCategories[keyof PreferencesCategories] | undefined,
  key: string,
  fallback: string,
): string {
  const value = map?.[key];
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

function readBoolean(
  map: PreferencesCategories[keyof PreferencesCategories] | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = map?.[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

export default function PreferencesSettingsPage() {
  const { data, isLoading, isError, error, refetch } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const [tab, setTab] = useState<PreferenceTab>('general');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [numberFormat, setNumberFormat] = useState('');
  const [categoryState, setCategoryState] = useState<CategoryFormState>(DEFAULT_CATEGORY_STATE);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setTimezone(data.timezone);
    setCurrency(data.currency);
    setLanguage(data.language);
    setDateFormat(data.dateFormat);
    setNumberFormat(data.numberFormat);
    const prefs = data.preferencesJson;
    setCategoryState({
      invoiceDefaultPaymentTermsDays: readString(
        prefs.invoice,
        'defaultPaymentTermsDays',
        DEFAULT_CATEGORY_STATE.invoiceDefaultPaymentTermsDays,
      ),
      invoicePrefix: readString(prefs.invoice, 'prefix', DEFAULT_CATEGORY_STATE.invoicePrefix),
      financeFiscalYearLabel: readString(
        prefs.finance,
        'fiscalYearLabel',
        DEFAULT_CATEGORY_STATE.financeFiscalYearLabel,
      ),
      salesDefaultPipelineVisible: readBoolean(
        prefs.sales,
        'defaultPipelineVisible',
        DEFAULT_CATEGORY_STATE.salesDefaultPipelineVisible,
      ),
      taskDefaultPriority: readString(
        prefs.task,
        'defaultPriority',
        DEFAULT_CATEGORY_STATE.taskDefaultPriority,
      ),
      projectRequireBudget: readBoolean(
        prefs.project,
        'requireBudget',
        DEFAULT_CATEGORY_STATE.projectRequireBudget,
      ),
      notificationEmailEnabled: readBoolean(
        prefs.notification,
        'emailEnabled',
        DEFAULT_CATEGORY_STATE.notificationEmailEnabled,
      ),
      emailFromName: readString(prefs.email, 'fromName', DEFAULT_CATEGORY_STATE.emailFromName),
    });
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading preferences..." />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Preferences"
        description="General defaults and category preferences for invoice, finance, sales, and operations."
      />

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              tab === item.id
                ? 'rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground'
                : 'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60'
            }
            onClick={() => {
              setTab(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          const paymentTerms = Number(categoryState.invoiceDefaultPaymentTermsDays);
          updateMutation.mutate(
            {
              timezone: timezone.trim(),
              currency: currency.trim().toUpperCase(),
              language: language.trim(),
              dateFormat: dateFormat.trim(),
              numberFormat: numberFormat.trim(),
              preferencesJson: {
                invoice: {
                  defaultPaymentTermsDays: Number.isFinite(paymentTerms) ? paymentTerms : 30,
                  prefix: categoryState.invoicePrefix.trim() || 'INV',
                },
                finance: {
                  fiscalYearLabel: categoryState.financeFiscalYearLabel.trim() || null,
                },
                sales: {
                  defaultPipelineVisible: categoryState.salesDefaultPipelineVisible,
                },
                task: {
                  defaultPriority: categoryState.taskDefaultPriority.trim() || 'MEDIUM',
                },
                project: {
                  requireBudget: categoryState.projectRequireBudget,
                },
                notification: {
                  emailEnabled: categoryState.notificationEmailEnabled,
                },
                email: {
                  fromName: categoryState.emailFromName.trim() || null,
                },
              },
            },
            {
              onSuccess: () => {
                setMessage('Preferences saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        {tab === 'general' ? (
          <>
            <div className="space-y-1">
              <label htmlFor="pref-timezone" className="text-sm font-medium">
                Timezone
              </label>
              <Input
                id="pref-timezone"
                value={timezone}
                onChange={(event) => {
                  setTimezone(event.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pref-currency" className="text-sm font-medium">
                Currency
              </label>
              <Input
                id="pref-currency"
                value={currency}
                maxLength={3}
                onChange={(event) => {
                  setCurrency(event.target.value.toUpperCase());
                }}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pref-language" className="text-sm font-medium">
                Language
              </label>
              <Input
                id="pref-language"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pref-date-format" className="text-sm font-medium">
                Date format
              </label>
              <Input
                id="pref-date-format"
                value={dateFormat}
                onChange={(event) => {
                  setDateFormat(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pref-number-format" className="text-sm font-medium">
                Number format
              </label>
              <Input
                id="pref-number-format"
                value={numberFormat}
                onChange={(event) => {
                  setNumberFormat(event.target.value);
                }}
              />
            </div>
          </>
        ) : null}

        {tab === 'invoice' ? (
          <>
            <div className="space-y-1">
              <label htmlFor="invoice-terms" className="text-sm font-medium">
                Default payment terms (days)
              </label>
              <Input
                id="invoice-terms"
                type="number"
                min={0}
                value={categoryState.invoiceDefaultPaymentTermsDays}
                onChange={(event) => {
                  setCategoryState((prev) => ({
                    ...prev,
                    invoiceDefaultPaymentTermsDays: event.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="invoice-prefix" className="text-sm font-medium">
                Invoice prefix
              </label>
              <Input
                id="invoice-prefix"
                value={categoryState.invoicePrefix}
                onChange={(event) => {
                  setCategoryState((prev) => ({ ...prev, invoicePrefix: event.target.value }));
                }}
              />
            </div>
          </>
        ) : null}

        {tab === 'finance' ? (
          <div className="space-y-1">
            <label htmlFor="finance-fy-label" className="text-sm font-medium">
              Fiscal year label
            </label>
            <Input
              id="finance-fy-label"
              value={categoryState.financeFiscalYearLabel}
              onChange={(event) => {
                setCategoryState((prev) => ({
                  ...prev,
                  financeFiscalYearLabel: event.target.value,
                }));
              }}
              placeholder="FY 2026-27"
            />
          </div>
        ) : null}

        {tab === 'sales' ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryState.salesDefaultPipelineVisible}
              onCheckedChange={(next) => {
                setCategoryState((prev) => ({
                  ...prev,
                  salesDefaultPipelineVisible: next === true,
                }));
              }}
            />
            Show pipeline by default
          </label>
        ) : null}

        {tab === 'task' ? (
          <div className="space-y-1">
            <label htmlFor="task-priority" className="text-sm font-medium">
              Default priority
            </label>
            <Input
              id="task-priority"
              value={categoryState.taskDefaultPriority}
              onChange={(event) => {
                setCategoryState((prev) => ({ ...prev, taskDefaultPriority: event.target.value }));
              }}
              placeholder="MEDIUM"
            />
          </div>
        ) : null}

        {tab === 'project' ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryState.projectRequireBudget}
              onCheckedChange={(next) => {
                setCategoryState((prev) => ({
                  ...prev,
                  projectRequireBudget: next === true,
                }));
              }}
            />
            Require budget on projects
          </label>
        ) : null}

        {tab === 'notification' ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryState.notificationEmailEnabled}
              onCheckedChange={(next) => {
                setCategoryState((prev) => ({
                  ...prev,
                  notificationEmailEnabled: next === true,
                }));
              }}
            />
            Email notifications enabled
          </label>
        ) : null}

        {tab === 'email' ? (
          <div className="space-y-1">
            <label htmlFor="email-from-name" className="text-sm font-medium">
              From name
            </label>
            <Input
              id="email-from-name"
              value={categoryState.emailFromName}
              onChange={(event) => {
                setCategoryState((prev) => ({ ...prev, emailFromName: event.target.value }));
              }}
            />
          </div>
        ) : null}

        <Can permission="settings.update">
          <Button
            type="submit"
            disabled={
              updateMutation.isPending ||
              timezone.trim().length === 0 ||
              currency.trim().length !== 3
            }
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </Can>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}
