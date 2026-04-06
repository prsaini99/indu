export interface CreateReviewDTO {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface ReviewQueryDTO {
  page?: string;
  limit?: string;
  tutorId?: string;
  rating?: string;
  isVisible?: string;
}

export interface UpdateVisibilityDTO {
  isVisible: boolean;
}
