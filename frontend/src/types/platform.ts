
import { LectureType } from "./lecture-types";

// ─── Child Profile (belongs to a Parent) ───────────────────────────
export interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  learningPreferences?: string[];
  enrolledSubjects?: string[];
  avatar?: string;
}

// ─── Tutor Profile (extends base User) ─────────────────────────────
export interface TutorProfile {
  bio: string;
  subjects: string[];
  qualifications: string[];
  certifications: string[];
  experience: string; // e.g., "5 years"
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  totalStudents: number;
  location?: string;
  languages: string[];
  avatar: string;
  availability: WeeklyAvailability;
  isVerified: boolean;
}

// ─── Availability ──────────────────────────────────────────────────
export interface TimeSlot {
  start: string; // e.g., "09:00"
  end: string;   // e.g., "12:00"
}

export interface WeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

// ─── Demo Request (Parent → Consultant → Tutor) ───────────────────
export type DemoRequestStatus =
  | "pending"           // Parent submitted, consultant hasn't acted
  | "tutor-suggested"   // Consultant suggested tutor(s)
  | "demo-scheduled"    // Demo date set
  | "demo-completed"    // Demo done, awaiting decision
  | "booking-confirmed" // Parent confirmed regular classes
  | "declined"          // Parent or tutor declined
  | "reassign-needed";  // Demo went badly, need new tutor

export interface DemoRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentAvatar: string;
  childId: string;
  childName: string;
  childGrade: string;
  subject: string;
  preferredFormat: LectureType | string;
  preferredSchedule: string;
  budget: string;
  location?: string;
  notes: string;
  urgency: "high" | "medium" | "low";
  status: DemoRequestStatus;
  consultantId?: string;
  suggestedTutorIds?: string[];
  assignedTutorId?: string;
  assignedTutorName?: string;
  demoDate?: string;
  demoOutcome?: "positive" | "negative" | "pending";
  parentRating?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Tutor Allocation (Active tutor-parent-child match) ────────────
export type AllocationStatus =
  | "active"            // Tutor assigned, classes ongoing
  | "demo-scheduled"    // Demo date set
  | "demo-completed"    // Demo done
  | "confirmed"         // Regular booking confirmed
  | "on-hold"           // Temporarily paused
  | "reassign-needed"   // Need different tutor
  | "completed";        // Engagement ended

export interface TutorAllocation {
  id: string;
  parentId: string;
  parentName: string;
  parentAvatar: string;
  childId: string;
  childName: string;
  childGrade: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  format: string;
  schedule: string;
  status: AllocationStatus;
  demoDate?: string;
  demoOutcome?: "positive" | "negative" | "pending";
  parentRating?: number;
  sessionsCompleted?: number;
  allocatedOn: string;
  consultantId?: string;
}

// ─── Credit System ─────────────────────────────────────────────────
export interface CreditTransaction {
  id: string;
  parentId: string;
  type: "purchase" | "spend" | "refund";
  amount: number; // positive for purchase/refund, negative for spend
  description: string;
  date: string;
  balanceAfter: number;
}

export interface CreditBalance {
  parentId: string;
  balance: number;
  transactions: CreditTransaction[];
}

// ─── Assessment ────────────────────────────────────────────────────
export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  classId: string;
  className: string;
  subject: string;
  type: "quiz" | "assignment" | "exam" | "progress-report";
  title: string;
  score?: number;
  maxScore?: number;
  grade?: string;
  remarks?: string;
  date: string;
  status: "pending" | "submitted" | "graded";
}

// ─── Message / Conversation ────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: "parent" | "tutor" | "consultant" | "student";
  content: string;
  timestamp: string;
  date: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: "parent" | "tutor" | "consultant" | "student";
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: Message[];
}

// ─── Review / Feedback ─────────────────────────────────────────────
export interface Review {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  fromRole: "parent" | "student";
  toId: string;
  toName: string;
  toRole: "tutor" | "consultant";
  rating: number;
  comment: string;
  subject?: string;
  date: string;
}
