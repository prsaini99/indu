export interface CreateAssessmentResultDTO {
  studentId: string;
  subjectId: string;
  enrollmentId?: string;
  title: string;
  score: number;
  maxScore?: number;
  remarks?: string;
  assessedAt: string; // ISO date string
}

export interface UpdateAssessmentResultDTO {
  title?: string;
  score?: number;
  maxScore?: number;
  remarks?: string;
  assessedAt?: string;
}

export interface AssessmentQueryDTO {
  page?: string;
  limit?: string;
  studentId?: string;
  subjectId?: string;
}

export interface UploadDocumentDTO {
  title: string;
  fileType: string;
}

export interface ProgressQueryDTO {
  subjectId?: string;
}
