export interface ApprovalRequest {
  correlationId: string;
  recipientPhone: string;
  suggestion: string;
}

export interface ApprovalResult {
  status: 'approved' | 'rejected';
  approvedBy: string;
  editedReply?: string;
}

export interface ApprovalRelay {
  requestApproval: (request: ApprovalRequest) => Promise<ApprovalResult>;
}
