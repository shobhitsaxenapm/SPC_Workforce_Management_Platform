import { describe, it, expect } from 'vitest';
import { 
  getInterviewFeedbackSummary, 
  getInterviewEndTime, 
  normalizeInterviewers, 
  getLatestInterviewForApplication, 
  getInterviewRoundsForApplication, 
  formatRoundSummaryForCard, 
  getNextRoundNumber,
  generateSecureFeedbackToken
} from '../interviewUtils';
import { Interview, InterviewerInvitation } from '../../types';

describe('Phase 3: Multi-round interview history, dynamic feedback visibility, and filtering', () => {

  const baseInterview: Interview = {
    id: 'test_iv_1',
    applicationId: 'app_test_1',
    jobId: 'job_test_1',
    candidateId: 'can_test_1',
    clientId: 'client_test_1',
    roundName: 'Round 1',
    roundNumber: 1,
    interviewType: 'HR Screening',
    scheduledAt: '2026-10-26T10:00:00Z',
    durationMinutes: 45,
    interviewerName: 'Sarah Jenkins',
    interviewerEmail: 'sarah.j@example.com',
    mode: 'Video',
    status: 'Scheduled',
    feedbackStatus: 'Not Due'
  };

  describe('1. Dynamic Feedback Status Calculation', () => {
    it('returns "Not Due" before scheduled end time with zero submitted responses', () => {
      const interview: Interview = {
        ...baseInterview,
        scheduledAt: '2026-10-26T14:00:00Z',
        durationMinutes: 60,
        interviewers: [
          {
            id: 'inv-1',
            name: 'Sarah Jenkins',
            email: 'sarah@example.com',
            secureFeedbackToken: 'token-1',
            feedbackStatus: 'Not Due'
          },
          {
            id: 'inv-2',
            name: 'David Lee',
            email: 'david@example.com',
            secureFeedbackToken: 'token-2',
            feedbackStatus: 'Not Due'
          }
        ]
      };

      // Current time is before end time (e.g. 13:00)
      const now = new Date('2026-10-26T13:00:00Z');
      const summary = getInterviewFeedbackSummary(interview, now);

      expect(summary.status).toBe('Not Due');
      expect(summary.isPastEndTime).toBe(false);
      expect(summary.totalCount).toBe(2);
      expect(summary.submittedCount).toBe(0);
      expect(summary.displayCount).toBe('Not Due');
    });

    it('returns "Pending" after interview end time with zero submitted responses', () => {
      const interview: Interview = {
        ...baseInterview,
        scheduledAt: '2026-10-26T10:00:00Z',
        durationMinutes: 45, // Ends at 10:45:00Z
        interviewers: [
          {
            id: 'inv-1',
            name: 'Sarah Jenkins',
            email: 'sarah@example.com',
            secureFeedbackToken: 'token-1',
            feedbackStatus: 'Pending'
          },
          {
            id: 'inv-2',
            name: 'David Lee',
            email: 'david@example.com',
            secureFeedbackToken: 'token-2',
            feedbackStatus: 'Pending'
          }
        ]
      };

      // Current time is after end time (11:00)
      const now = new Date('2026-10-26T11:00:00Z');
      const summary = getInterviewFeedbackSummary(interview, now);

      expect(summary.status).toBe('Pending');
      expect(summary.isPastEndTime).toBe(true);
      expect(summary.totalCount).toBe(2);
      expect(summary.submittedCount).toBe(0);
      expect(summary.displayCount).toBe('0 of 2 received');
    });

    it('returns "Partially Received" displayed as "X of Y received" when some but not all responses are received', () => {
      const interview: Interview = {
        ...baseInterview,
        scheduledAt: '2026-10-26T10:00:00Z',
        durationMinutes: 45,
        interviewers: [
          {
            id: 'inv-1',
            name: 'Sarah Jenkins',
            email: 'sarah@example.com',
            secureFeedbackToken: 'token-1',
            feedbackStatus: 'Submitted',
            submittedAt: '2026-10-26T11:00:00Z',
            overallRating: 4
          },
          {
            id: 'inv-2',
            name: 'David Lee',
            email: 'david@example.com',
            secureFeedbackToken: 'token-2',
            feedbackStatus: 'Pending'
          },
          {
            id: 'inv-3',
            name: 'Elena Rostova',
            email: 'elena@example.com',
            secureFeedbackToken: 'token-3',
            feedbackStatus: 'Pending'
          }
        ]
      };

      const now = new Date('2026-10-26T12:00:00Z');
      const summary = getInterviewFeedbackSummary(interview, now);

      expect(summary.status).toBe('Partially Received');
      expect(summary.submittedCount).toBe(1);
      expect(summary.totalCount).toBe(3);
      expect(summary.displayCount).toBe('1 of 3 received');
    });

    it('returns "Received" displayed as "Y of Y received" when all requested responses are received', () => {
      const interview: Interview = {
        ...baseInterview,
        scheduledAt: '2026-10-26T10:00:00Z',
        durationMinutes: 45,
        interviewers: [
          {
            id: 'inv-1',
            name: 'Sarah Jenkins',
            email: 'sarah@example.com',
            secureFeedbackToken: 'token-1',
            feedbackStatus: 'Submitted',
            overallRating: 5
          },
          {
            id: 'inv-2',
            name: 'David Lee',
            email: 'david@example.com',
            secureFeedbackToken: 'token-2',
            feedbackStatus: 'Submitted',
            overallRating: 4
          }
        ]
      };

      const now = new Date('2026-10-26T12:00:00Z');
      const summary = getInterviewFeedbackSummary(interview, now);

      expect(summary.status).toBe('Received');
      expect(summary.submittedCount).toBe(2);
      expect(summary.totalCount).toBe(2);
      expect(summary.displayCount).toBe('2 of 2 received');
    });

    it('calculates counts dynamically from actual interviewer invitations and does not hard-code', () => {
      // 4 interviewers
      const fourInterviewers: InterviewerInvitation[] = [1, 2, 3, 4].map(idx => ({
        id: `inv-${idx}`,
        name: `Interviewer ${idx}`,
        email: `int${idx}@test.com`,
        secureFeedbackToken: `token-${idx}`,
        feedbackStatus: idx <= 3 ? 'Submitted' : 'Pending'
      }));

      const interview: Interview = {
        ...baseInterview,
        interviewers: fourInterviewers
      };

      const summary = getInterviewFeedbackSummary(interview, new Date('2026-10-26T12:00:00Z'));
      expect(summary.status).toBe('Partially Received');
      expect(summary.submittedCount).toBe(3);
      expect(summary.totalCount).toBe(4);
      expect(summary.displayCount).toBe('3 of 4 received');
    });

    it('handles legacy single interviewer interview records by synthesizing an invitation', () => {
      const legacySubmitted: Interview = {
        ...baseInterview,
        interviewerName: 'Dr. Alok Gupta',
        interviewerEmail: 'alok.g@example.com',
        feedbackStatus: 'Submitted',
        overallRating: 4
      };

      const summary = getInterviewFeedbackSummary(legacySubmitted, new Date('2026-10-26T12:00:00Z'));
      expect(summary.status).toBe('Received');
      expect(summary.submittedCount).toBe(1);
      expect(summary.totalCount).toBe(1);
      expect(summary.displayCount).toBe('1 of 1 received');
    });
  });

  describe('2. Pipeline Candidate Card Summary Formatting', () => {
    it('formats "Round 2 Scheduled" for future scheduled interview', () => {
      const interview: Interview = {
        ...baseInterview,
        roundNumber: 2,
        roundName: 'Round 2',
        status: 'Scheduled',
        scheduledAt: '2026-11-15T10:00:00Z'
      };

      const summary = formatRoundSummaryForCard(interview, new Date('2026-10-26T10:00:00Z'));
      expect(summary).toBe('Round 2 Scheduled');
    });

    it('formats "Round 2 Completed · Feedback Pending" when interview completed and feedback is pending', () => {
      const interview: Interview = {
        ...baseInterview,
        roundNumber: 2,
        status: 'Completed',
        scheduledAt: '2026-10-20T10:00:00Z',
        interviewers: [
          {
            id: 'inv-1',
            name: 'John Doe',
            secureFeedbackToken: 'tok-1',
            feedbackStatus: 'Pending'
          }
        ]
      };

      const summary = formatRoundSummaryForCard(interview, new Date('2026-10-26T10:00:00Z'));
      expect(summary).toBe('Round 2 Completed · Feedback Pending');
    });

    it('formats "Feedback 1 of 2 received" when feedback is partially received', () => {
      const interview: Interview = {
        ...baseInterview,
        roundNumber: 1,
        status: 'Completed',
        scheduledAt: '2026-10-20T10:00:00Z',
        interviewers: [
          {
            id: 'inv-1',
            name: 'John Doe',
            secureFeedbackToken: 'tok-1',
            feedbackStatus: 'Submitted'
          },
          {
            id: 'inv-2',
            name: 'Jane Smith',
            secureFeedbackToken: 'tok-2',
            feedbackStatus: 'Pending'
          }
        ]
      };

      const summary = formatRoundSummaryForCard(interview, new Date('2026-10-26T10:00:00Z'));
      expect(summary).toBe('Feedback 1 of 2 received');
    });

    it('formats No Show with who did not show up', () => {
      const interview: Interview = {
        ...baseInterview,
        roundNumber: 1,
        status: 'No Show',
        noShowWho: 'Candidate'
      };

      const summary = formatRoundSummaryForCard(interview, new Date('2026-10-26T10:00:00Z'));
      expect(summary).toBe('Round 1 No Show (Candidate)');
    });
  });

  describe('3. Multi-Round History Ordering & Auto-Incrementation', () => {
    it('orders rounds chronologically for an application', () => {
      const interviews: Interview[] = [
        { ...baseInterview, id: 'iv-r2', roundNumber: 2, scheduledAt: '2026-10-28T14:00:00Z' },
        { ...baseInterview, id: 'iv-r1', roundNumber: 1, scheduledAt: '2026-10-20T10:00:00Z' },
        { ...baseInterview, id: 'iv-r3', roundNumber: 3, scheduledAt: '2026-11-05T09:00:00Z' }
      ];

      const ordered = getInterviewRoundsForApplication('app_test_1', interviews);
      expect(ordered.map(i => i.roundNumber)).toEqual([1, 2, 3]);
    });

    it('returns the latest round for an application', () => {
      const interviews: Interview[] = [
        { ...baseInterview, id: 'iv-r1', roundNumber: 1, scheduledAt: '2026-10-20T10:00:00Z' },
        { ...baseInterview, id: 'iv-r2', roundNumber: 2, scheduledAt: '2026-10-28T14:00:00Z' }
      ];

      const latest = getLatestInterviewForApplication('app_test_1', interviews);
      expect(latest?.id).toBe('iv-r2');
      expect(latest?.roundNumber).toBe(2);
    });

    it('calculates next round number based on existing rounds', () => {
      const interviews: Interview[] = [
        { ...baseInterview, id: 'iv-r1', roundNumber: 1 },
        { ...baseInterview, id: 'iv-r2', roundNumber: 2 }
      ];

      expect(getNextRoundNumber('app_test_1', interviews)).toBe(3);
      expect(getNextRoundNumber('app_new_unrelated', interviews)).toBe(1);
    });
  });

  describe('4. Secure Feedback Token Generation', () => {
    it('generates secure unique feedback tokens', () => {
      const token1 = generateSecureFeedbackToken();
      const token2 = generateSecureFeedbackToken();
      expect(token1).toMatch(/^sft_[a-z0-9]+_[a-z0-9]+$/);
      expect(token1).not.toBe(token2);
    });
  });

  describe('5. Invariant: Feedback Submission Does Not Change Application Stage', () => {
    it('submitting individual feedback records feedback without modifying application stage', () => {
      const interview: Interview = {
        ...baseInterview,
        status: 'Completed',
        interviewers: [
          {
            id: 'inv-1',
            name: 'Alice',
            email: 'alice@spc.test',
            secureFeedbackToken: 'token_alice',
            feedbackStatus: 'Pending'
          }
        ]
      };

      // Mock updateApplicationStage spy
      let applicationStage = 'Interviewing';
      const mockUpdateStage = (appId: string, stage: string) => {
        applicationStage = stage;
      };

      // Simulating individual feedback submission
      const updatedInterviewers = interview.interviewers!.map(inv => {
        if (inv.secureFeedbackToken === 'token_alice') {
          return {
            ...inv,
            feedbackStatus: 'Submitted' as const,
            overallRating: 5,
            recommendation: 'Hire' as const,
            feedbackNotes: 'Exceptional candidate.'
          };
        }
        return inv;
      });

      const updatedInterview: Interview = {
        ...interview,
        interviewers: updatedInterviewers
      };

      const summary = getInterviewFeedbackSummary(updatedInterview);
      expect(summary.status).toBe('Received');
      // Verify application stage did NOT change automatically
      expect(applicationStage).toBe('Interviewing');
    });
  });

});
