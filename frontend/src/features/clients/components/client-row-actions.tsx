import { Archive, MoreHorizontal, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientRowActionsProps {
  clientName: string;
}

/** Row actions menu — UI only; handlers wired in a future task. */
export function ClientRowActions({ clientName }: ClientRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Actions for ${clientName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="gap-2">
          <Eye className="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-2">
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-2 text-danger focus:text-danger">
          <Archive className="size-4" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
