export interface EarningQueryDTO {
  page?: string;
  limit?: string;
  status?: string;
  tutorId?: string;
}

export interface CreatePayoutDTO {
  tutorId: string;
  earningIds: string[];
  paidVia?: string;
  referenceNo?: string;
  notes?: string;
}

export interface PayoutQueryDTO {
  page?: string;
  limit?: string;
  tutorId?: string;
}
