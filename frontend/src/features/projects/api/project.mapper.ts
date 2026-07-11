import type { ProjectRecord } from '@/features/projects/api/project.types';
import type { ProjectListItem, WorkspaceOwnerOption } from '@/features/projects/types';
import { isProjectArchived } from '@/features/projects/utils/list-projects-query';

interface MapProjectRecordOptions {
  readonly clientNamesById?: ReadonlyMap<string, string>;
  readonly ownersById?: ReadonlyMap<string, WorkspaceOwnerOption>;
}

/** Maps an API project record to the Project List row shape. */
export function mapProjectRecordToListItem(
  record: ProjectRecord,
  options: MapProjectRecordOptions = {},
): ProjectListItem {
  const clientName = options.clientNamesById?.get(record.clientId) ?? '—';
  const ownerOption =
    record.projectManagerUserId !== null
      ? options.ownersById?.get(record.projectManagerUserId)
      : undefined;

  return {
    id: record.id,
    name: record.name,
    code: record.code ?? '—',
    clientId: record.clientId,
    clientName,
    status: record.status,
    priority: record.priority,
    projectManager: ownerOption?.displayName ?? record.projectManagerUserId ?? '—',
    targetEndDate: record.targetEndDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isArchived: isProjectArchived(record),
  };
}
