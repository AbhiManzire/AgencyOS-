'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import {
  useArchiveWorkspace,
  useRestoreWorkspace,
  useUpdateWorkspaceSettings,
  useWorkspaceSettings,
} from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const WEEKDAY_LABELS: readonly { day: number; label: string }[] = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 7, label: 'Sun' },
];

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function WorkspaceSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useWorkspaceSettings();
  const updateMutation = useUpdateWorkspaceSettings();
  const archiveMutation = useArchiveWorkspace();
  const restoreMutation = useRestoreWorkspace();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [financialYearStartMonth, setFinancialYearStartMonth] = useState(4);
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<readonly number[]>([1, 2, 3, 4, 5]);
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [numberFormat, setNumberFormat] = useState('en-US');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
    setLogoUrl(data.logoUrl ?? '');
    setAddressLine1(data.addressLine1 ?? '');
    setAddressLine2(data.addressLine2 ?? '');
    setCity(data.city ?? '');
    setStateRegion(data.stateRegion ?? '');
    setPostalCode(data.postalCode ?? '');
    setCountryCode(data.countryCode ?? '');
    setGstin(data.gstin ?? '');
    setPan(data.pan ?? '');
    setTimezone(data.timezone);
    setCurrency(data.currency);
    setFinancialYearStartMonth(data.financialYearStartMonth);
    setBusinessHoursStart(data.businessHoursStart);
    setBusinessHoursEnd(data.businessHoursEnd);
    setWorkingDays(data.workingDays);
    setLanguage(data.language);
    setDateFormat(data.dateFormat);
    setNumberFormat(data.numberFormat);
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading workspace settings..." />;
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

  const isArchived = Boolean(data.deletedAt) || !data.isActive;

  return (
    <>
      <PageHeader
        title="Workspace Settings"
        description="Operational workspace profile, business hours, formats, and archive status."
      />

      <form
        className="max-w-2xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              name: name.trim(),
              logoUrl: emptyToNull(logoUrl),
              addressLine1: emptyToNull(addressLine1),
              addressLine2: emptyToNull(addressLine2),
              city: emptyToNull(city),
              stateRegion: emptyToNull(stateRegion),
              postalCode: emptyToNull(postalCode),
              countryCode: emptyToNull(countryCode)?.toUpperCase() ?? null,
              gstin: emptyToNull(gstin),
              pan: emptyToNull(pan)?.toUpperCase() ?? null,
              timezone: timezone.trim(),
              currency: currency.trim().toUpperCase(),
              financialYearStartMonth,
              businessHoursStart,
              businessHoursEnd,
              workingDays,
              language: language.trim(),
              dateFormat: dateFormat.trim(),
              numberFormat: numberFormat.trim(),
            },
            {
              onSuccess: () => {
                setMessage('Workspace settings saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace name
            </label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <Input value={data.slug} disabled readOnly />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Input value={isArchived ? 'Archived' : 'Active'} disabled readOnly />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="workspace-logo" className="text-sm font-medium">
              Logo URL
            </label>
            <Input
              id="workspace-logo"
              value={logoUrl}
              onChange={(event) => {
                setLogoUrl(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="workspace-address-1" className="text-sm font-medium">
              Address line 1
            </label>
            <Input
              id="workspace-address-1"
              value={addressLine1}
              onChange={(event) => {
                setAddressLine1(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="workspace-address-2" className="text-sm font-medium">
              Address line 2
            </label>
            <Input
              id="workspace-address-2"
              value={addressLine2}
              onChange={(event) => {
                setAddressLine2(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-city" className="text-sm font-medium">
              City
            </label>
            <Input
              id="workspace-city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-state" className="text-sm font-medium">
              State / region
            </label>
            <Input
              id="workspace-state"
              value={stateRegion}
              onChange={(event) => {
                setStateRegion(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-postal" className="text-sm font-medium">
              Postal code
            </label>
            <Input
              id="workspace-postal"
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-country" className="text-sm font-medium">
              Country code
            </label>
            <Input
              id="workspace-country"
              value={countryCode}
              maxLength={2}
              onChange={(event) => {
                setCountryCode(event.target.value.toUpperCase());
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-gstin" className="text-sm font-medium">
              GSTIN
            </label>
            <Input
              id="workspace-gstin"
              value={gstin}
              onChange={(event) => {
                setGstin(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-pan" className="text-sm font-medium">
              PAN
            </label>
            <Input
              id="workspace-pan"
              value={pan}
              onChange={(event) => {
                setPan(event.target.value.toUpperCase());
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-timezone" className="text-sm font-medium">
              Timezone
            </label>
            <Input
              id="workspace-timezone"
              value={timezone}
              onChange={(event) => {
                setTimezone(event.target.value);
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-currency" className="text-sm font-medium">
              Currency
            </label>
            <Input
              id="workspace-currency"
              value={currency}
              maxLength={3}
              onChange={(event) => {
                setCurrency(event.target.value.toUpperCase());
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-fy" className="text-sm font-medium">
              FY start month (1–12)
            </label>
            <Input
              id="workspace-fy"
              type="number"
              min={1}
              max={12}
              value={financialYearStartMonth}
              onChange={(event) => {
                setFinancialYearStartMonth(Number(event.target.value));
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-language" className="text-sm font-medium">
              Language
            </label>
            <Input
              id="workspace-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-hours-start" className="text-sm font-medium">
              Business hours start
            </label>
            <Input
              id="workspace-hours-start"
              type="time"
              value={businessHoursStart}
              onChange={(event) => {
                setBusinessHoursStart(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-hours-end" className="text-sm font-medium">
              Business hours end
            </label>
            <Input
              id="workspace-hours-end"
              type="time"
              value={businessHoursEnd}
              onChange={(event) => {
                setBusinessHoursEnd(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-date-format" className="text-sm font-medium">
              Date format
            </label>
            <Input
              id="workspace-date-format"
              value={dateFormat}
              onChange={(event) => {
                setDateFormat(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="workspace-number-format" className="text-sm font-medium">
              Number format
            </label>
            <Input
              id="workspace-number-format"
              value={numberFormat}
              onChange={(event) => {
                setNumberFormat(event.target.value);
              }}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Working days</p>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_LABELS.map(({ day, label }) => {
                const checked = workingDays.includes(day);
                return (
                  <label key={day} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        const isChecked = next === true;
                        setWorkingDays((prev) => {
                          if (isChecked) {
                            return [...prev, day].sort((a, b) => a - b);
                          }
                          return prev.filter((value) => value !== day);
                        });
                      }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Can permission="settings.update">
            <Button type="submit" disabled={updateMutation.isPending || name.trim().length === 0}>
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </Can>

          <Can permission="settings.update">
            {isArchived ? (
              <Button
                type="button"
                variant="outline"
                disabled={restoreMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  restoreMutation.mutate(undefined, {
                    onSuccess: () => {
                      setMessage('Workspace restored.');
                    },
                    onError: (err) => {
                      setMessage(extractApiErrorMessage(err));
                    },
                  });
                }}
              >
                {restoreMutation.isPending ? 'Restoring…' : 'Restore'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={archiveMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  archiveMutation.mutate(undefined, {
                    onSuccess: () => {
                      setMessage('Workspace archived.');
                    },
                    onError: (err) => {
                      setMessage(extractApiErrorMessage(err));
                    },
                  });
                }}
              >
                {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            )}
          </Can>
        </div>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}
