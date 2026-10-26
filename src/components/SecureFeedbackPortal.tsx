import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Star, CheckCircle2, Clock, Calendar, Briefcase, Building2, User, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { formatDateTime, cn } from '../lib/utils';
import { getInterviewFeedbackSummary } from '../lib/interviewUtils';

export default function SecureFeedbackPortal() {
  const { token } = useParams<{ token: string }>();
  const { interviews, candidates, jobs, clients, submitIndividualFeedback } = useApp();

  // Find the interview and interviewer invitation matching this token
  let matchingInterview = interviews.find(i => 
    i.interviewers?.some(inv => inv.secureFeedbackToken === token)
  );

  // Fallback for mock/legacy tokens
  let matchingInvitation = matchingInterview?.interviewers?.find(inv => inv.secureFeedbackToken === token);

  if (!matchingInterview && token) {
    // Check if token matches interview id directly (e.g. sft_int3_1)
    matchingInterview = interviews.find(i => token.includes(i.id));
    matchingInvitation = matchingInterview?.interviewers?.[0];
  }

  const candidate = matchingInterview ? candidates.find(c => c.id === matchingInterview?.candidateId) : null;
  const job = matchingInterview ? jobs.find(j => j.id === matchingInterview?.jobId) : null;
  const client = matchingInterview ? clients.find(c => c.id === matchingInterview?.clientId) : null;

  const [rating, setRating] = useState<number>(matchingInvitation?.overallRating || 4);
  const [recommendation, setRecommendation] = useState<'Hire' | 'Hold' | 'Reject'>(matchingInvitation?.recommendation || 'Hire');
  const [overallResult, setOverallResult] = useState<'Strong Hire' | 'Hire' | 'Hold' | 'Reject'>(matchingInvitation?.overallResult || 'Hire');
  const [strengths, setStrengths] = useState(matchingInvitation?.strengths || '');
  const [concerns, setConcerns] = useState(matchingInvitation?.concerns || '');
  const [feedbackNotes, setFeedbackNotes] = useState(matchingInvitation?.feedbackNotes || '');
  
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(matchingInvitation?.feedbackStatus === 'Submitted');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!matchingInterview || !matchingInvitation || !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-slate-600 mb-6">
            This interview feedback link is invalid or may have expired. Please verify with the recruitment coordinator.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadySubmitted = matchingInvitation.feedbackStatus === 'Submitted' || submittedSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNotes.trim()) {
      setError('Please provide detailed feedback notes or observations.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const result = submitIndividualFeedback(matchingInterview!.id, token, {
        overallRating: rating,
        recommendation,
        overallResult,
        strengths: strengths.trim(),
        concerns: concerns.trim(),
        feedbackNotes: feedbackNotes.trim(),
      });

      setIsSubmitting(false);
      if (result.success) {
        setSubmittedSuccess(true);
      } else {
        setError(result.error || 'Failed to submit feedback. Please try again.');
      }
    }, 400);
  };

  const feedbackSummary = getInterviewFeedbackSummary(matchingInterview);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              SPC
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Interviewer Feedback Portal</h1>
              <p className="text-xs text-slate-500">Secure Candidate Evaluation Entry</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {matchingInvitation.role || 'Evaluator'}: {matchingInvitation.name}
          </span>
        </div>

        {/* Interview Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Candidate</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {candidate?.fullName || 'Candidate'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{candidate?.currentRole} • {candidate?.totalExperience} exp</p>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Position & Client</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" />
                {job?.title || 'Open Position'}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {client?.name || 'Client'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDateTime(matchingInterview.scheduledAt)} ({matchingInterview.durationMinutes} mins)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">Round:</span>
              <span className="font-semibold text-slate-800">{matchingInterview.roundName || `Round ${matchingInterview.roundNumber || 1}`} • {matchingInterview.interviewType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">Feedback Status:</span>
              <span className={cn(
                "px-2 py-0.5 rounded font-semibold text-[11px]",
                isAlreadySubmitted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              )}>
                {isAlreadySubmitted ? 'Submitted' : feedbackSummary.status}
              </span>
            </div>
          </div>
        </div>

        {/* Form or Submitted View */}
        {isAlreadySubmitted ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-slate-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Feedback Recorded</h3>
                <p className="text-xs text-slate-500">
                  Your evaluation has been submitted to the recruitment pipeline. Thank you for your review!
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Rating</span>
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("w-4 h-4", s <= (matchingInvitation.overallRating || rating) ? "fill-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Recommendation</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{matchingInvitation.recommendation || recommendation}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Overall Result</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{matchingInvitation.overallResult || overallResult}</p>
                </div>
              </div>

              {(matchingInvitation.strengths || strengths) && (
                <div>
                  <span className="text-xs text-slate-500 font-medium">Strengths</span>
                  <p className="text-xs text-slate-700 mt-0.5 bg-white p-3 rounded border border-slate-200">{matchingInvitation.strengths || strengths}</p>
                </div>
              )}

              {(matchingInvitation.concerns || concerns) && (
                <div>
                  <span className="text-xs text-slate-500 font-medium">Areas for Growth / Concerns</span>
                  <p className="text-xs text-slate-700 mt-0.5 bg-white p-3 rounded border border-slate-200">{matchingInvitation.concerns || concerns}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 font-medium">Detailed Feedback Notes</span>
                <p className="text-xs text-slate-800 mt-0.5 bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">{matchingInvitation.feedbackNotes || feedbackNotes}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Evaluation</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please evaluate the candidate on skills, behavioral fit, and relevant experience.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Overall Rating (1 - 5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                  >
                    <Star className={cn("w-7 h-7", star <= rating ? "fill-amber-400 text-amber-400" : "")} />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-700">{rating} of 5 Stars</span>
              </div>
            </div>

            {/* Recommendation & Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Recommendation</label>
                <div className="flex gap-2">
                  {(['Hire', 'Hold', 'Reject'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRecommendation(opt)}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold rounded-lg border transition-all text-center",
                        recommendation === opt
                          ? (opt === 'Hire' ? "bg-emerald-50 border-emerald-500 text-emerald-800" : opt === 'Reject' ? "bg-rose-50 border-rose-500 text-rose-800" : "bg-amber-50 border-amber-500 text-amber-800")
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Overall Fit Assessment</label>
                <select
                  value={overallResult}
                  onChange={e => setOverallResult(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Strengths</label>
                <textarea
                  rows={3}
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  placeholder="e.g. Communication, technical expertise, initiative..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Concerns / Development Areas</label>
                <textarea
                  rows={3}
                  value={concerns}
                  onChange={e => setConcerns(e.target.value)}
                  placeholder="e.g. Needs deeper system design exposure, salary expectation..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Detailed Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Feedback Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={feedbackNotes}
                onChange={e => setFeedbackNotes(e.target.value)}
                placeholder="Comprehensive interview summary and justification for recommendation..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Note: Submitting feedback logs evaluation and notifies recruitment team.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
