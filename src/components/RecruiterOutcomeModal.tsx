import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Interview, RecruiterInterviewOutcome } from '../types';
import { X, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, UserX, Clock, MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { getInterviewFeedbackSummary } from '../lib/interviewUtils';

interface RecruiterOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  candidateName: string;
  onNextRoundSelected?: (nextRoundNum: number) => void;
}

export default function RecruiterOutcomeModal({
  isOpen,
  onClose,
  interview,
  candidateName,
  onNextRoundSelected
}: RecruiterOutcomeModalProps) {
  const { confirmRecruiterOutcome } = useApp();

  const [outcome, setOutcome] = useState<RecruiterInterviewOutcome>(
    interview.recruiterOutcome || 'Next Round'
  );
  const [notes, setNotes] = useState(interview.recruiterOutcomeNotes || '');
  const [isConfirmingStateChange, setIsConfirmingStateChange] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentRoundNum = interview.roundNumber || 1;
  const nextRoundNum = currentRoundNum + 1;
  const fbSummary = getInterviewFeedbackSummary(interview);

  const isStateChanging = outcome === 'Selected' || outcome === 'Rejected';

  const handleConfirm = () => {
    if (outcome === 'Rejected' && !notes.trim()) {
      setError('Please provide a reason or note when rejecting a candidate.');
      return;
    }

    if (isStateChanging && !isConfirmingStateChange) {
      setIsConfirmingStateChange(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const result = confirmRecruiterOutcome(interview.id, outcome, notes.trim(), true);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || 'Failed to update recruiter outcome.');
        return;
      }

      onClose();

      if (outcome === 'Next Round' && onNextRoundSelected) {
        onNextRoundSelected(nextRoundNum);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Review Feedback & Confirm Outcome</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate: <span className="font-semibold text-slate-700">{candidateName}</span> • Round {currentRoundNum} ({interview.interviewType})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Summary Pill */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="text-blue-900 font-medium">
            Evaluation Progress: <span className="font-bold">{fbSummary.displayCount}</span>
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full font-semibold text-[10px]",
            fbSummary.status === 'Received' ? "bg-emerald-100 text-emerald-800" :
            fbSummary.status === 'Partially Received' ? "bg-amber-100 text-amber-800" :
            fbSummary.status === 'Not Due' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
          )}>
            {fbSummary.badgeText}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recruiter Decision / Next Step
            </label>
            <div className="space-y-2.5">
              
              {/* Option: Next Round */}
              <label className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                outcome === 'Next Round' 
                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500" 
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="radio"
                  name="outcome"
                  checked={outcome === 'Next Round'}
                  onChange={() => { setOutcome('Next Round'); setIsConfirmingStateChange(false); }}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Next Round</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      Opens Scheduler (Round {nextRoundNum})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Advances candidate to next round while preserving Round {currentRoundNum} and all submitted evaluations in history.
                  </p>
                </div>
              </label>

              {/* Option: Selected */}
              <label className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                outcome === 'Selected' 
                  ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500" 
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="radio"
                  name="outcome"
                  checked={outcome === 'Selected'}
                  onChange={() => { setOutcome('Selected'); setIsConfirmingStateChange(false); }}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-900">Selected</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      State-Changing Outcome
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Candidate has completed interview evaluations and is selected. Moves candidate to the "Selected" pipeline stage.
                  </p>
                </div>
              </label>

              {/* Option: On Hold */}
              <label className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                outcome === 'On Hold' 
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500" 
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="radio"
                  name="outcome"
                  checked={outcome === 'On Hold'}
                  onChange={() => { setOutcome('On Hold'); setIsConfirmingStateChange(false); }}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-900">On Hold</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Places candidate on hold in the Interviewing stage pending comparison with other candidates.
                  </p>
                </div>
              </label>

              {/* Option: Additional Discussion Required */}
              <label className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                outcome === 'Additional Discussion Required' 
                  ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-500" 
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="radio"
                  name="outcome"
                  checked={outcome === 'Additional Discussion Required'}
                  onChange={() => { setOutcome('Additional Discussion Required'); setIsConfirmingStateChange(false); }}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-900">Additional Discussion Required</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Requires sync between panelists and hiring coordinator before finalizing decision. Candidate remains in current stage.
                  </p>
                </div>
              </label>

              {/* Option: Rejected */}
              <label className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                outcome === 'Rejected' 
                  ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500" 
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="radio"
                  name="outcome"
                  checked={outcome === 'Rejected'}
                  onChange={() => { setOutcome('Rejected'); setIsConfirmingStateChange(false); }}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-900">Rejected</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                      State-Changing Outcome
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Candidate did not pass evaluation. Explicit confirmation required to move candidate to "Rejected".
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Recruiter Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recruiter Outcome Notes / Justification {outcome === 'Rejected' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add rationale, consensus notes, or instructions for next steps..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* State-changing confirmation alert */}
          {isStateChanging && isConfirmingStateChange && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Explicit Confirmation Required
              </div>
              <p className="text-xs text-amber-700">
                You have selected <strong>{outcome}</strong>. This is a state-changing outcome that will advance or reject the candidate in the Job Pipeline. Please verify that this decision has been vetted.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={cn(
              "px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50",
              outcome === 'Selected' ? "bg-emerald-600 hover:bg-emerald-700" :
              outcome === 'Rejected' ? "bg-rose-600 hover:bg-rose-700" :
              outcome === 'Next Round' ? "bg-blue-600 hover:bg-blue-700" :
              "bg-slate-800 hover:bg-slate-900"
            )}
          >
            {isSubmitting ? 'Processing...' : (
              isStateChanging && isConfirmingStateChange 
                ? `Confirm & Move to ${outcome}` 
                : outcome === 'Next Round' 
                  ? `Confirm & Schedule Round ${nextRoundNum}` 
                  : 'Confirm Outcome'
            )}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
