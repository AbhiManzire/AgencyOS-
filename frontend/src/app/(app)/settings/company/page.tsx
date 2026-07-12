'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function CompanySettingsPage() {
  const { data, isLoading, isError, error, refetch } = useCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState('');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
    setLegalName(data.legalName ?? '');
    setLogoUrl(data.logoUrl ?? '');
    setAddressLine1(data.addressLine1 ?? '');
    setAddressLine2(data.addressLine2 ?? '');
    setCity(data.city ?? '');
    setStateRegion(data.stateRegion ?? '');
    setPostalCode(data.postalCode ?? '');
    setCountryCode(data.countryCode ?? '');
    setGstin(data.gstin ?? '');
    setPan(data.pan ?? '');
    setBrandPrimaryColor(data.brandPrimaryColor ?? '');
    setBrandSecondaryColor(data.brandSecondaryColor ?? '');
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading company profile..." />;
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
        title="Company Profile"
        description="Agency identity, branding, address, and tax details used across invoices and client records."
      />

      <form
        className="max-w-2xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              name: name.trim(),
              legalName: emptyToNull(legalName),
              logoUrl: emptyToNull(logoUrl),
              addressLine1: emptyToNull(addressLine1),
              addressLine2: emptyToNull(addressLine2),
              city: emptyToNull(city),
              stateRegion: emptyToNull(stateRegion),
              postalCode: emptyToNull(postalCode),
              countryCode: emptyToNull(countryCode)?.toUpperCase() ?? null,
              gstin: emptyToNull(gstin),
              pan: emptyToNull(pan)?.toUpperCase() ?? null,
              brandPrimaryColor: emptyToNull(brandPrimaryColor),
              brandSecondaryColor: emptyToNull(brandSecondaryColor),
            },
            {
              onSuccess: () => {
                setMessage('Company profile saved.');
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
            <label htmlFor="company-name" className="text-sm font-medium">
              Agency name
            </label>
            <Input
              id="company-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-legal-name" className="text-sm font-medium">
              Legal name
            </label>
            <Input
              id="company-legal-name"
              value={legalName}
              onChange={(event) => {
                setLegalName(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <Input value={data.slug} disabled readOnly />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="company-logo" className="text-sm font-medium">
              Logo URL
            </label>
            <Input
              id="company-logo"
              value={logoUrl}
              onChange={(event) => {
                setLogoUrl(event.target.value);
              }}
              placeholder="https://"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="company-address-1" className="text-sm font-medium">
              Address line 1
            </label>
            <Input
              id="company-address-1"
              value={addressLine1}
              onChange={(event) => {
                setAddressLine1(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="company-address-2" className="text-sm font-medium">
              Address line 2
            </label>
            <Input
              id="company-address-2"
              value={addressLine2}
              onChange={(event) => {
                setAddressLine2(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-city" className="text-sm font-medium">
              City
            </label>
            <Input
              id="company-city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-state" className="text-sm font-medium">
              State / region
            </label>
            <Input
              id="company-state"
              value={stateRegion}
              onChange={(event) => {
                setStateRegion(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-postal" className="text-sm font-medium">
              Postal code
            </label>
            <Input
              id="company-postal"
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-country" className="text-sm font-medium">
              Country code
            </label>
            <Input
              id="company-country"
              value={countryCode}
              maxLength={2}
              onChange={(event) => {
                setCountryCode(event.target.value.toUpperCase());
              }}
              placeholder="IN"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-gstin" className="text-sm font-medium">
              GSTIN
            </label>
            <Input
              id="company-gstin"
              value={gstin}
              onChange={(event) => {
                setGstin(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-pan" className="text-sm font-medium">
              PAN
            </label>
            <Input
              id="company-pan"
              value={pan}
              onChange={(event) => {
                setPan(event.target.value.toUpperCase());
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-brand-primary" className="text-sm font-medium">
              Brand primary color
            </label>
            <Input
              id="company-brand-primary"
              value={brandPrimaryColor}
              onChange={(event) => {
                setBrandPrimaryColor(event.target.value);
              }}
              placeholder="#0F172A"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-brand-secondary" className="text-sm font-medium">
              Brand secondary color
            </label>
            <Input
              id="company-brand-secondary"
              value={brandSecondaryColor}
              onChange={(event) => {
                setBrandSecondaryColor(event.target.value);
              }}
              placeholder="#64748B"
            />
          </div>
        </div>

        <Can permission="settings.update">
          <Button type="submit" disabled={updateMutation.isPending || name.trim().length === 0}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </Can>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}
