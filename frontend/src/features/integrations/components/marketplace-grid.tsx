'use client';

import { Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, EmptyState, StatusBadge } from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import type { IntegrationCatalogProvider } from '@/features/integrations/api/integration.types';
import { INTEGRATION_CATEGORY_LABELS } from '@/features/integrations/api/integration.types';
import { Can } from '@/lib/rbac';

interface MarketplaceGridProps {
  readonly providers: readonly IntegrationCatalogProvider[];
  readonly onAddConnection: (provider: IntegrationCatalogProvider) => void;
}

export function MarketplaceGrid({ providers, onAddConnection }: MarketplaceGridProps) {
  if (providers.length === 0) {
    return (
      <EmptyState
        icon={Plug}
        title="No providers in catalog"
        description="Integration providers will appear here once the catalog is available."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => (
        <Card key={provider.key} className="flex h-full flex-col">
          <CardHeader className="mb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base">{provider.label}</CardTitle>
              <StatusBadge variant="neutral">
                {INTEGRATION_CATEGORY_LABELS[provider.category]}
              </StatusBadge>
            </div>
            <Caption className="font-mono text-xs">{provider.key}</Caption>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <p className="flex-1 text-sm text-muted-foreground">{provider.description}</p>
            <Can permission="integrations.manage">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  onAddConnection(provider);
                }}
              >
                Add connection
              </Button>
            </Can>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
