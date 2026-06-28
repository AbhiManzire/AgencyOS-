import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, CardTitle } from '@/design-system/typography';
import type { ClientRecord } from '@/features/clients/api/client.types';
import { formatClientAddress } from '@/features/clients/utils/client-display';

interface ClientDetailAddressCardProps {
  readonly client: ClientRecord;
}

export function ClientDetailAddressCard({ client }: ClientDetailAddressCardProps) {
  const address = formatClientAddress(client);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address</CardTitle>
      </CardHeader>
      <CardContent>
        <Body className="whitespace-pre-line text-muted-foreground">{address}</Body>
      </CardContent>
    </Card>
  );
}
