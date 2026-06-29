import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateProposalPayload,
  ProposalRecord,
  UpdateProposalPayload,
} from '@/features/sales/proposals/api/proposal.types';

export async function getProposal(proposalId: string): Promise<ProposalRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ProposalRecord>>(
    `/proposals/${proposalId}`,
  );
  return response.data.data;
}

export async function createProposal(payload: CreateProposalPayload): Promise<ProposalRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProposalRecord>>('/proposals', payload);
  return response.data.data;
}

export async function updateProposal(
  proposalId: string,
  payload: UpdateProposalPayload,
): Promise<ProposalRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ProposalRecord>>(
    `/proposals/${proposalId}`,
    payload,
  );
  return response.data.data;
}
