export interface CreateCreditPackageDTO {
  name: string;
  credits: number;
  priceInFils: number;
  sortOrder?: number;
}

export interface UpdateCreditPackageDTO {
  name?: string;
  credits?: number;
  priceInFils?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AdjustCreditsDTO {
  amount: number;
  description: string;
}

export interface WalletTransactionQuery {
  page?: string;
  limit?: string;
  type?: string;
}
