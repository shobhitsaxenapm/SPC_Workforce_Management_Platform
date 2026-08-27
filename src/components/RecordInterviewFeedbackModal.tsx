import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Star, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Interview } from '../types';
import { cn } from '../lib/utils';

interface RecordInterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  candidateName: string;
}

export default function RecordInterviewFeedbackModal({ isOpen, onClose, interview, candidateName }: RecordInterviewFeedbackModalProps) {
  const { updateApplicationStage, submitInterviewFeedback } = useApp();
  
  const [outcome, setOutcome] = useState<'Proceed to Next Round' | 'Recommend Hire' | 'Keep on Hold' | 'Reject Candidate' | null>(null);
  const [feedback, setFeedback] = useState({
    rating: 0,
    strengths: '',
    concerns: '',
    detailedFeedback: '',
    recommendation: 'Hire',
    internalNote: ''
  });
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [holdReason, setHoldReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!outcome) return;
    setIsSubmitting(true);
    
    // Fake delay
    await new Promise(r => setTimeout(r, 600));

    // Update the interview record itself
    submitInterviewFeedback(interview.id, {
      status: 'Completed',
      feedbackStatus: 'Submitted'
    });

    // Handle Application State transition
    switch (outcome) {
      case 'Proceed to Next Round':
        updateApplicationStage(interview.applicationId, 'Interviewing', 'Next Round To Schedule');
        break;
      case 'Recommend Hire':
        updateApplicationStage(interview.applicationId, 'Interviewing', 'Interview Completed');
        break;
      case 'Keep on Hold':
        updateApplicationStage(interview.applicationId, 'Interviewing', 'On Hold', holdReason);
        break;
      case 'Reject Candidate':
        updateApplicationStage(interview.applicationId, 'Rejected', undefined, rejectionReason);
        break;
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Record Interview Feedback
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Submit feedback for {candidateName} • {interview.roundName || 'Interview'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
            <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Interview Details</p>
              <ul className="space-y-1 text-blue-700/80">
                <li><strong>Interviewer:</strong> {interview.interviewerName}</li>
                <li><strong>Date:</strong> {new Date(interview.scheduledAt).toLocaleDateString()}</li>
                <li><strong>Type:</strong> {interview.interviewType}</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-slate-800 mb-3">Overall Rating</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setFeedback({ ...feedback, rating: star })}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    feedback.rating >= star ? "text-amber-400 hover:text-amber-500" : "text-slate-200 hover:text-slate-300"
                  )}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Key Strengths</label>
              <textarea
                rows={3}
                value={feedback.strengths}
                onChange={e => setFeedback({...feedback, strengths: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What went well?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Areas of Concern</label>
              <textarea
                rows={3}
                value={feedback.concerns}
                onChange={e => setFeedback({...feedback, concerns: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What were the red flags or gaps?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Detailed Feedback</label>
            <textarea
              rows={4}
              value={feedback.detailedFeedback}
              onChange={e => setFeedback({...feedback, detailedFeedback: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide comprehensive interview notes..."
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-medium text-slate-800 mb-4">Outcome Decision</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Proceed to Next Round', 'Recommend Hire', 'Keep on Hold', 'Reject Candidate'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setOutcome(option)}
                  className={cn(
                    "px-4 py-3 border rounded-xl text-sm font-medium text-center transition-all",
                    outcome === option
                      ? option === 'Reject Candidate' 
                        ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500"
                        : "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {outcome === 'Reject Candidate' && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-red-800 mb-1.5">Reason for Rejection *</label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Required rejection reason..."
              />
            </div>
          )}

          {outcome === 'Keep on Hold' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-amber-800 mb-1.5">Hold Reason</label>
              <textarea
                rows={2}
                value={holdReason}
                onChange={e => setHoldReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Why is this candidate on hold?"
              />
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!outcome || isSubmitting || (outcome === 'Reject Candidate' && !rejectionReason.trim())}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <><Clock className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              'Save & Complete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
