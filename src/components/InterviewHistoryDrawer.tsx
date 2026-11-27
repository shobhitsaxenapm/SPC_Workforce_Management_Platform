import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Interview, InterviewerInvitation } from '../types';
import { 
  X, Calendar, Clock, Video, Phone, Users, Star, 
  CheckCircle2, AlertCircle, Copy, Send, ArrowRight, 
  ExternalLink, ChevronDown, ChevronUp, FileText, UserCheck, UserX, ShieldAlert, Plus
} from 'lucide-react';
import { cn, formatDateTime, formatDate } from '../lib/utils';
import { getInterviewRoundsForApplication, getInterviewFeedbackSummary, getInterviewEndTime, normalizeInterviewers, getNextRoundNumber } from '../lib/interviewUtils';
import RecruiterOutcomeModal from './RecruiterOutcomeModal';

interface InterviewHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  selectedInterviewId?: string | null;
  onScheduleNextRound?: (candidateId: string, jobId: string, nextRoundNum: number) => void;
  onSubmitFeedback?: (interview: Interview) => void;
}

export default function InterviewHistoryDrawer({
  isOpen,
  onClose,
  applicationId,
  selectedInterviewId,
  onScheduleNextRound,
  onSubmitFeedback
}: InterviewHistoryDrawerProps) {
  const { 
    applications, 
    candidates, 
    jobs, 
    clients, 
    interviews, 
    sendFeedbackReminder,
    submitIndividualFeedback
  } = useApp();

  const [selectedInterviewForOutcome, setSelectedInterviewForOutcome] = useState<Interview | null>(null);
  const [expandedRoundIds, setExpandedRoundIds] = useState<Record<string, boolean>>({});
  const [expandedFeedbackIds, setExpandedFeedbackIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && selectedInterviewId) {
      setExpandedRoundIds({ [selectedInterviewId]: true });
    }
  }, [isOpen, selectedInterviewId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);
  const client = clients.find(c => c.id === job?.clientId);

  const rounds = getInterviewRoundsForApplication(applicationId, interviews);
  const nextRoundNumber = getNextRoundNumber(applicationId, interviews);

  const toggleFeedbackExpand = (id: string) => {
    setExpandedFeedbackIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/interview-feedback/${token}`;
    navigator.clipboard.writeText(link);
    showToast('Secure feedback link copied to clipboard!');
  };

  const handleSendReminder = (interviewId: string, interviewer: InterviewerInvitation) => {
    const res = sendFeedbackReminder(interviewId, interviewer.id || interviewer.email || interviewer.secureFeedbackToken);
    showToast(res.message);
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-label="Interview History Drawer"
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Interview History
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {rounds.length} {rounds.length === 1 ? 'Round' : 'Rounds'} Total
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {candidate?.fullName || 'Candidate'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {job?.title} • {client?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Close interview history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-6 py-2.5 font-medium flex items-center justify-between shadow-inner">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drawer Body - Timeline of Rounds */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {rounds.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Interview Rounds Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No interview sessions have been scheduled for this candidate and job application.
              </p>
              {onScheduleNextRound && candidate && job && (
                <button
                  onClick={() => {
                    onClose();
                    onScheduleNextRound(candidate.id, job.id, 1);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Round 1
                </button>
              )}
            </div>
          ) : (
            <div className="relative border-l-2 border-blue-100 ml-4 pl-6 space-y-8">
              {rounds.map((round, idx) => {
                const roundNum = round.roundNumber ?? (idx + 1);
                const rawFbSummary = getInterviewFeedbackSummary(round);
                const isCompleted = round.status === 'Completed';
                const isScheduledOrRescheduled = round.status === 'Scheduled' || round.status === 'Rescheduled';
                const isOverdue = isScheduledOrRescheduled && getInterviewEndTime(round) < new Date();
                const fbSummary = isCompleted || rawFbSummary.submittedCount > 0
                  ? rawFbSummary
                  : {
                      ...rawFbSummary,
                      status: 'Not Due' as const,
                      displayCount: isOverdue ? 'Not Due until completed' : 'Not Due',
                      badgeText: isOverdue ? 'Not Due until completed' : 'Not Due'
                    };
                const interviewers = normalizeInterviewers(round);
                const isSelectedRound = Boolean(selectedInterviewId && round.id === selectedInterviewId);
                const isRoundExpanded = expandedRoundIds[round.id] ?? (selectedInterviewId ? isSelectedRound : true);

                return (
                  <div
                    key={round.id}
                    data-testid={`history-round-${round.id}`}
                    className="relative group"
                  >
                    {/* Timeline Node */}
                    <div className={cn(
                      "absolute -left-[35px] top-1.5 w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center ring-4 ring-white shadow-sm",
                      isSelectedRound ? "bg-blue-700 ring-blue-100" : "bg-blue-600"
                    )}>
                      {roundNum}
                    </div>

                    <div className={cn(
                      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                      isSelectedRound
                        ? "border-blue-400 ring-2 ring-blue-500/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                    )}>
                      
                      {/* Round Header */}
                      <div
                        onClick={() => setExpandedRoundIds(prev => ({ ...prev, [round.id]: !isRoundExpanded }))}
                        className={cn(
                          "p-5 border-b border-slate-100 cursor-pointer select-none transition-colors",
                          isSelectedRound ? "bg-blue-50/40" : "bg-slate-50/60 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">
                                {round.roundName || `Round ${roundNum}`}
                              </span>
                              <span className="text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {round.interviewType || 'Interview'}
                              </span>
                              {isSelectedRound && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                  Selected Round
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateTime(round.scheduledAt)}</span>
                              <span>•</span>
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{round.durationMinutes} min ({round.timezone || 'Local'})</span>
                              <span>•</span>
                              <span>{round.mode}</span>
                            </div>
                          </div>

                          {/* Status Badges & Expand Toggle */}
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col items-end gap-1.5">
                              {isOverdue ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                  Overdue
                                </span>
                              ) : (
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                  round.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  round.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  round.status === 'Rescheduled' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                  round.status === 'No Show' ? "bg-rose-50 text-rose-800 border-rose-200" :
                                  "bg-slate-100 text-slate-600 border-slate-200"
                                )}>
                                  {round.status === 'No Show' 
                                    ? `No Show (${round.noShowWho || 'Candidate'})` 
                                    : round.status}
                                </span>
                              )}

                              {round.status === 'Completed' && round.recruiterOutcome && (
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                  round.recruiterOutcome === 'Selected' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                  round.recruiterOutcome === 'Rejected' ? "bg-rose-50 text-rose-800 border-rose-200" :
                                  round.recruiterOutcome === 'Next Round' ? "bg-blue-50 text-blue-800 border-blue-200" :
                                  "bg-amber-50 text-amber-800 border-amber-300"
                                )}>
                                  Outcome: {round.recruiterOutcome}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRoundIds(prev => ({ ...prev, [round.id]: !isRoundExpanded }));
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                              aria-label={isRoundExpanded ? 'Collapse round' : 'Expand round'}
                            >
                              {isRoundExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Feedback Status Summary Bar (Hidden for Cancelled / No Show) */}
                        {round.status !== 'Cancelled' && round.status !== 'No Show' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">
                              Feedback Status: <span className="font-bold text-slate-800">{fbSummary.displayCount}</span>
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              fbSummary.status === 'Received' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              fbSummary.status === 'Partially Received' ? "bg-amber-50 text-amber-800 border-amber-300" :
                              fbSummary.status === 'Not Due' ? "bg-slate-100 text-slate-600 border-slate-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {fbSummary.badgeText}
                            </span>
                          </div>
                        )}
                      </div>

                      {isRoundExpanded && (
                        <>
                          {/* Round Schedule & Status Details */}
                          {(round.meetingLink || round.rescheduleReason || round.cancellationReason || round.noShowNote) && (
                            <div className="px-5 pt-4 space-y-2 text-xs">
                              {round.meetingLink && (
                                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                  <span className="text-slate-500 font-medium">Meeting Link:</span>
                                  <a
                                    href={round.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                                  >
                                    {round.meetingLink}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {round.rescheduleReason && (
                                <div className="bg-purple-50/60 px-3 py-2 rounded-lg border border-purple-200 text-purple-900">
                                  <span className="font-bold">Rescheduled: </span>{round.rescheduleReason}
                                </div>
                              )}
                              {round.cancellationReason && (
                                <div className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
                                  <span className="font-bold">Cancellation Reason: </span>{round.cancellationReason}
                                </div>
                              )}
                              {round.noShowNote && (
                                <div className="bg-rose-50/70 px-3 py-2 rounded-lg border border-rose-200 text-rose-900">
                                  <span className="font-bold">No-Show Note ({round.noShowWho || 'Candidate'}): </span>{round.noShowNote}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Interviewers & Feedback List */}
                          <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Interviewers ({interviewers.length})
                              </span>
                              {round.status === 'Completed' && onSubmitFeedback && (
                                <button
                                  type="button"
                                  onClick={() => onSubmitFeedback(round)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  {round.feedbackStatus === 'Submitted' ? 'Edit Feedback' : '+ Submit Feedback'}
                                </button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {interviewers.map((inv) => {
                                const isSubmitted = inv.feedbackStatus === 'Submitted';
                                const isExpanded = expandedFeedbackIds[inv.id] ?? true;
                                const isCancelledOrNoShow = round.status === 'No Show' || round.status === 'Cancelled';

                                return (
                                  <div key={inv.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-900">{inv.name}</span>
                                          {inv.role && (
                                            <span className="text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                              {inv.role}
                                            </span>
                                          )}
                                        </div>
                                        {inv.email && (
                                          <p className="text-[11px] text-slate-500">{inv.email}</p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                          isCancelledOrNoShow ? "bg-slate-100 text-slate-500 border-slate-200" :
                                          isSubmitted ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                          fbSummary.status === 'Not Due' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                          "bg-rose-50 text-rose-700 border-rose-200"
                                        )}>
                                          {isCancelledOrNoShow
                                            ? `${round.status} — N/A`
                                            : isSubmitted
                                            ? 'Submitted'
                                            : (fbSummary.status === 'Not Due' ? 'Not Due' : 'Pending')}
                                        </span>

                                        {/* Action buttons for pending links (only when interview is Completed) */}
                                        {!isSubmitted && round.status === 'Completed' && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleCopyLink(inv.secureFeedbackToken)}
                                              className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-200 transition-colors"
                                              title="Copy secure feedback link"
                                            >
                                              <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleSendReminder(round.id, inv)}
                                              className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-200 transition-colors"
                                              title="Send feedback reminder"
                                            >
                                              <Send className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Submitted Feedback Detail */}
                                    {isSubmitted && (
                                      <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between text-xs mb-2">
                                          <div className="flex items-center gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map(s => (
                                              <Star key={s} className={cn("w-3.5 h-3.5", s <= (inv.overallRating || 4) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                                            ))}
                                            <span className="text-[11px] font-bold text-slate-700 ml-1">
                                              {inv.overallRating || 4}/5
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {inv.recommendation && (
                                              <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded",
                                                inv.recommendation === 'Hire' || inv.recommendation === 'Proceed to Offer' || inv.recommendation === 'Advance to Next Round' ? "bg-emerald-100 text-emerald-800" :
                                                inv.recommendation === 'Reject' || inv.recommendation === 'Reject Application' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                                              )}>
                                                Rec: {inv.recommendation}
                                              </span>
                                            )}
                                            <button
                                              onClick={() => toggleFeedbackExpand(inv.id)}
                                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                                            >
                                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>
                                          </div>
                                        </div>

                                        {isExpanded && (
                                          <div className="space-y-2 text-xs">
                                            {inv.strengths && (
                                              <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Strengths:</span>
                                                <p className="text-slate-700 mt-0.5">{inv.strengths}</p>
                                              </div>
                                            )}
                                            {inv.concerns && (
                                              <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Concerns:</span>
                                                <p className="text-slate-700 mt-0.5">{inv.concerns}</p>
                                              </div>
                                            )}
                                            {inv.feedbackNotes && (
                                              <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Notes:</span>
                                                <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap">
                                                  {inv.feedbackNotes}
                                                </p>
                                              </div>
                                            )}
                                            {inv.submittedAt && (
                                              <div className="text-[10px] text-slate-400 mt-1">
                                                Submitted: {formatDateTime(inv.submittedAt)}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Recruiter Outcome Notes if exists (only when Completed) */}
                            {round.status === 'Completed' && round.recruiterOutcomeNotes && (
                              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs">
                                <span className="text-[10px] uppercase font-bold text-amber-800">
                                  Recruiter Outcome Notes ({round.recruiterOutcome})
                                </span>
                                <p className="text-amber-950 mt-1">{round.recruiterOutcomeNotes}</p>
                                {round.recruiterOutcomeConfirmedAt && (
                                  <p className="text-[10px] text-amber-700 mt-1">
                                    Confirmed: {formatDateTime(round.recruiterOutcomeConfirmedAt)}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Round Actions (Outcome & Schedule Next Round only for Completed rounds) */}
                            {round.status === 'Completed' && (
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                <button
                                  onClick={() => setSelectedInterviewForOutcome(round)}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  {round.recruiterOutcome ? 'Update Outcome' : 'Review Feedback & Confirm Outcome'}
                                </button>

                                {onScheduleNextRound && candidate && job && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onScheduleNextRound(candidate.id, job.id, nextRoundNumber);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Schedule Next Round
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {candidate?.fullName} • {application?.currentStage} ({application?.currentSubstate || 'In Progress'})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Recruiter Outcome Modal */}
      {selectedInterviewForOutcome && (
        <RecruiterOutcomeModal
          isOpen={!!selectedInterviewForOutcome}
          onClose={() => setSelectedInterviewForOutcome(null)}
          interview={selectedInterviewForOutcome}
          candidateName={candidate?.fullName || 'Candidate'}
          onNextRoundSelected={(nextRound) => {
            setSelectedInterviewForOutcome(null);
            if (onScheduleNextRound && candidate && job) {
              onClose();
              onScheduleNextRound(candidate.id, job.id, nextRound);
            }
          }}
        />
      )}
    </div>
  );
}
