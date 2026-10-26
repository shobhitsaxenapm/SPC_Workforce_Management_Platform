import { Interview, InterviewerInvitation, DerivedFeedbackStatus, RecruiterInterviewOutcome } from '../types';

export interface InterviewFeedbackSummary {
  status: DerivedFeedbackStatus;
  displayCount: string;
  badgeText: string;
  submittedCount: number;
  totalCount: number;
  isPastEndTime: boolean;
  endTime: Date;
  startTime: Date;
}

/**
 * Generate a unique secure token for interviewer feedback access.
 */
export function generateSecureFeedbackToken(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `sft_${rand}_${time}`;
}

/**
 * Normalizes an interview's interviewers array.
 * If none exists, synthesizes one from the legacy interviewerName/interviewerEmail.
 */
export function normalizeInterviewers(interview: Interview): InterviewerInvitation[] {
  if (interview.interviewers && interview.interviewers.length > 0) {
    return interview.interviewers;
  }

  // Synthesize legacy single interviewer invitation
  const isSubmitted = interview.feedbackStatus === 'Submitted';
  return [
    {
      id: `inv-${interview.id}-1`,
      interviewerId: interview.interviewerId,
      name: interview.interviewerName || 'Assigned Interviewer',
      email: interview.interviewerEmail || '',
      role: 'Lead Interviewer',
      secureFeedbackToken: `sft_${interview.id}_1`,
      feedbackStatus: isSubmitted ? 'Submitted' : 'Pending',
      submittedAt: isSubmitted ? (interview.scheduledAt || new Date().toISOString()) : undefined,
      overallRating: interview.overallRating,
      overallResult: interview.overallResult,
      recommendation: interview.recommendation,
      strengths: interview.strengths,
      concerns: interview.concerns,
      feedbackNotes: interview.feedbackNotes,
      invitedAt: interview.scheduledAt
    }
  ];
}

/**
 * Calculates scheduled end time for an interview.
 */
export function getInterviewEndTime(interview: Interview): Date {
  if (interview.scheduledEndAt) {
    return new Date(interview.scheduledEndAt);
  }
  const startTime = new Date(interview.scheduledAt).getTime();
  const durationMs = (interview.durationMinutes || 45) * 60 * 1000;
  return new Date(startTime + durationMs);
}

/**
 * Derives feedback status using actual requested interviewer counts:
 * - Before scheduled interview end time -> 'Not Due'
 * - After interview end time with zero submitted responses -> 'Pending'
 * - Some but not all requested responses received -> 'Partially Received' (X of Y received)
 * - All requested responses received -> 'Received' (Y of Y received)
 * 
 * Never hardcodes counts like 2/2. Calculated from actual invitations.
 */
export function getInterviewFeedbackSummary(
  interview: Interview,
  now: Date = new Date()
): InterviewFeedbackSummary {
  const startTime = new Date(interview.scheduledAt);
  const endTime = getInterviewEndTime(interview);
  const isPastEndTime = now.getTime() >= endTime.getTime();

  const interviewers = normalizeInterviewers(interview);
  const totalCount = interviewers.length > 0 ? interviewers.length : 1;
  const submittedCount = interviewers.filter(i => i.feedbackStatus === 'Submitted').length;

  let status: DerivedFeedbackStatus;
  let displayCount: string;
  let badgeText: string;

  if (!isPastEndTime) {
    // Before scheduled end time
    if (submittedCount >= totalCount && totalCount > 0) {
      status = 'Received';
      displayCount = `${totalCount} of ${totalCount} received`;
      badgeText = `Received (${displayCount})`;
    } else if (submittedCount > 0) {
      status = 'Partially Received';
      displayCount = `${submittedCount} of ${totalCount} received`;
      badgeText = `Partially Received (${displayCount})`;
    } else {
      status = 'Not Due';
      displayCount = 'Not Due';
      badgeText = 'Not Due';
    }
  } else {
    // After scheduled end time
    if (submittedCount === 0) {
      status = 'Pending';
      displayCount = `0 of ${totalCount} received`;
      badgeText = `Pending (${displayCount})`;
    } else if (submittedCount < totalCount) {
      status = 'Partially Received';
      displayCount = `${submittedCount} of ${totalCount} received`;
      badgeText = `Partially Received (${displayCount})`;
    } else {
      status = 'Received';
      displayCount = `${totalCount} of ${totalCount} received`;
      badgeText = `Received (${displayCount})`;
    }
  }

  return {
    status,
    displayCount,
    badgeText,
    submittedCount,
    totalCount,
    isPastEndTime,
    endTime,
    startTime
  };
}

/**
 * Get all interview rounds for an application sorted in chronological order (Round 1, Round 2, ...).
 */
export function getInterviewRoundsForApplication(
  applicationId: string,
  interviews: Interview[]
): Interview[] {
  return interviews
    .filter(i => i.applicationId === applicationId)
    .sort((a, b) => {
      const roundA = a.roundNumber ?? 1;
      const roundB = b.roundNumber ?? 1;
      if (roundA !== roundB) return roundA - roundB;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
}

/**
 * Get the latest / current interview round for an application.
 */
export function getLatestInterviewForApplication(
  applicationId: string,
  interviews: Interview[]
): Interview | undefined {
  const appInterviews = interviews.filter(i => i.applicationId === applicationId);
  if (appInterviews.length === 0) return undefined;

  return [...appInterviews].sort((a, b) => {
    const roundA = a.roundNumber ?? 1;
    const roundB = b.roundNumber ?? 1;
    if (roundA !== roundB) return roundB - roundA; // descending
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  })[0];
}

/**
 * Formats a compact summary string for candidate pipeline cards.
 * Examples:
 * - "Round 2 Scheduled"
 * - "Round 2 Completed · Feedback Pending"
 * - "Feedback 1 of 2 received"
 * - "Round 1 Completed · Feedback Received (2 of 2)"
 */
export function formatRoundSummaryForCard(
  interview: Interview | undefined,
  now: Date = new Date()
): string | null {
  if (!interview) return null;

  const roundNum = interview.roundNumber || 1;
  const roundPrefix = `Round ${roundNum}`;
  const summary = getInterviewFeedbackSummary(interview, now);

  if (interview.status === 'Cancelled') {
    return `${roundPrefix} Cancelled`;
  }

  if (interview.status === 'No Show') {
    return `${roundPrefix} No Show (${interview.noShowWho || 'Candidate'})`;
  }

  if (interview.status === 'Rescheduled') {
    return `${roundPrefix} Rescheduled`;
  }

  if (interview.status === 'Scheduled') {
    if (summary.isPastEndTime && summary.status === 'Pending') {
      return `${roundPrefix} Completed · Feedback Pending`;
    }
    return `${roundPrefix} Scheduled`;
  }

  if (interview.status === 'Completed') {
    if (interview.recruiterOutcome) {
      return `${roundPrefix} · ${interview.recruiterOutcome}`;
    }
    if (summary.status === 'Pending') {
      return `${roundPrefix} Completed · Feedback Pending`;
    }
    if (summary.status === 'Partially Received') {
      return `Feedback ${summary.submittedCount} of ${summary.totalCount} received`;
    }
    if (summary.status === 'Received') {
      return `${roundPrefix} Completed · Feedback Received (${summary.totalCount} of ${summary.totalCount})`;
    }
    if (summary.status === 'Not Due') {
      return `${roundPrefix} Completed · Feedback Not Due`;
    }
    return `${roundPrefix} Completed`;
  }

  return `${roundPrefix} ${interview.status}`;
}

/**
 * Calculates the next round number for scheduling.
 */
export function getNextRoundNumber(applicationId: string, interviews: Interview[]): number {
  const existing = interviews.filter(i => i.applicationId === applicationId);
  if (existing.length === 0) return 1;
  const maxRound = existing.reduce((max, i) => Math.max(max, i.roundNumber || 1), 1);
  return maxRound + 1;
}
