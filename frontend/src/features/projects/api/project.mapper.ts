import type { ProjectRecord } from '@/features/projects/api/project.types';
import type { ProjectListItem } from '@/features/projects/types';

interface MapProjectRecordOptions {
  readonly clientNamesById?: ReadonlyMap<string, string>;
}

/** Maps an API project record to the Project List row shape. */
export function mapProjectRecordToListItem(
  record: ProjectRecord,
  options: MapProjectRecordOptions = {},
): ProjectListItem {
  const clientName = options.clientNamesById?.get(record.clientId) ?? '—';

  return {
    id: record.id,
    name: record.name,
    code: record.code ?? '—',
    clientId: record.clientId,
    clientName,
    status: record.status,
    priority: record.priority,
    projectManager: record.projectManagerUserId ?? '—',
    targetEndDate: record.targetEndDate,
    updatedAt: record.updatedAt,
  };
}
