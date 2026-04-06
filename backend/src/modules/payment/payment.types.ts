export interface CreateCheckoutDTO {
  packageId: string;
}

export interface PaymentQueryDTO {
  page?: string;
  limit?: string;
  status?: string;
}
