'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createScheduledReport,
  deleteScheduledReport,
  listScheduledReports,
  runScheduledReport,
  updateScheduledReport,
} from '@/features/reports/api/reports.api';
import type {
  CreateScheduledReportInput,
  ScheduledReport,
  UpdateScheduledReportInput,
} from '@/features/reports/api/reports.types';
import { reportsQueryKeys } from '@/features/reports/hooks/reports-query-keys';

export function useScheduledReports() {
  const query = useQuery({
    queryKey: reportsQueryKeys.schedules(),
    queryFn: () => listScheduledReports({ take: 100 }),
    staleTime: 60_000,
  });

  return {
    schedules: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScheduledReportInput) => createScheduledReport(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.schedules() });
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateScheduledReportInput }) =>
      updateScheduledReport(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.schedules() });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScheduledReport(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.schedules() });
    },
  });
}

export function useRunScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runScheduledReport(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.schedules() });
    },
  });
}

export type { ScheduledReport };
