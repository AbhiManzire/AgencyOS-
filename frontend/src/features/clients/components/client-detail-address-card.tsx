import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ClientRecord } from '@/features/clients/api/client.types';
import {
  formatClientAddress,
  formatShippingAddress,
} from '@/features/clients/utils/client-display';

interface ClientDetailAddressCardProps {
  readonly client: ClientRecord;
}

export function ClientDetailAddressCard({ client }: ClientDetailAddressCardProps) {
  const billingAddress = formatClientAddress(client);
  const shippingAddress = formatShippingAddress(client);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Caption className="block uppercase tracking-wide">Billing</Caption>
          <Body className="whitespace-pre-line text-muted-foreground">{billingAddress}</Body>
        </div>
        <div className="space-y-2">
          <Caption className="block uppercase tracking-wide">Shipping</Caption>
          <Body className="whitespace-pre-line text-muted-foreground">{shippingAddress}</Body>
        </div>
      </CardContent>
    </Card>
  );
}
