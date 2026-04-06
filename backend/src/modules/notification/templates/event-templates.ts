import { env } from '../../../config/env';
import { baseEmailTemplate } from './base';

const url = env.FRONTEND_URL;

// ── Enrollment Created ──

export function enrollmentCreatedParent(studentName: string, subjectName: string, tutorName: string) {
  const title = 'Enrollment Confirmed';
  const message = `Your child ${studentName} has been enrolled in ${subjectName} with ${tutorName}. Sessions will be generated automatically based on the schedule.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/parent-dashboard/enrolled-classes`, 'View Enrollment') };
}

export function enrollmentCreatedTutor(studentName: string, subjectName: string, parentName: string) {
  const title = 'New Student Enrolled';
  const message = `${studentName} (parent: ${parentName}) has been enrolled in your ${subjectName} class. Check your enrollments for the schedule.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/tutor-dashboard/enrollments`, 'View Enrollments') };
}

// ── Session Reminder (24hr) ──

export function sessionReminderParent(studentName: string, subjectName: string, date: string, time: string) {
  const title = 'Class Reminder — Tomorrow';
  const message = `Reminder: ${studentName}'s ${subjectName} class is scheduled for ${date} at ${time}. Make sure to join on time!`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/parent-dashboard/enrolled-classes`, 'View Schedule') };
}

export function sessionReminderTutor(studentName: string, subjectName: string, date: string, time: string) {
  const title = 'Class Reminder — Tomorrow';
  const message = `Reminder: Your ${subjectName} class with ${studentName} is scheduled for ${date} at ${time}.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/tutor-dashboard/enrollments`, 'View Schedule') };
}

// ── Payment Confirmed ──

export function paymentConfirmedParent(credits: number, amountAed: string) {
  const title = 'Payment Confirmed';
  const message = `Your payment of AED ${amountAed} has been received. ${credits} credits have been added to your wallet.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/parent-dashboard/credits`, 'View Wallet') };
}

// ── Batch Joined ──

export function batchJoinedParent(studentName: string, batchName: string) {
  const title = 'Joined Group Class';
  const message = `${studentName} has successfully joined the group class "${batchName}". You'll be notified when sessions begin.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/parent-dashboard/my-batches`, 'View Group Classes') };
}

export function batchJoinedTutor(studentName: string, batchName: string) {
  const title = 'New Student in Group Class';
  const message = `${studentName} has joined your group class "${batchName}".`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/tutor-dashboard/batches`, 'View Batches') };
}

// ── Payout Recorded ──

export function payoutRecordedTutor(amountInr: string, referenceNo?: string) {
  const title = 'Payout Processed';
  const message = `Your payout of ₹${amountInr} has been processed.${referenceNo ? ` Reference: ${referenceNo}` : ''} Check your earnings for details.`;
  return { title, message, html: baseEmailTemplate(title, message, `${url}/tutor-dashboard/earnings`, 'View Earnings') };
}
