import React from 'react';
import { Interview } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, Video, User, MapPin, Link as LinkIcon, FileText, CheckCircle, AlertCircle, CalendarX2 } from 'lucide-react';
import { formatDateTime, cn } from '../lib/utils';

interface ViewInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId?: string;
  applicationId?: string;
  jobId?: string;
  candidateId?: string;
}

export default function ViewInterviewModal({ 
  isOpen, 
  onClose, 
  interviewId,
  jobId,
  candidateId 
}: ViewInterviewModalProps) {
  const { interviews, jobs, candidates, clients } = useApp();

  if (!isOpen) return null;

  // Find the interview based on interviewId or the latest one for the job+candidate combo
  let interview: Interview | undefined;
  if (interviewId) {
    interview = interviews.find(i => i.id === interviewId);
  } else if (jobId && candidateId) {
    // Get all interviews for this application, sort by date descending, pick the latest
    const appInterviews = interviews
      .filter(i => i.jobId === jobId && i.candidateId === candidateId)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    interview = appInterviews[0];
  }

  if (!interview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">No Interview Found</h2>
          <p className="text-sm text-slate-600 mb-6">There are no recorded interviews for this process.</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    );
  }

  const job = jobs.find(j => j.id === interview?.jobId);
  const candidate = candidates.find(c => c.id === interview?.candidateId);
  const client = clients.find(c => c.id === interview?.clientId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'No Show': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return <Calendar className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <CalendarX2 className="w-4 h-4" />;
      case 'No Show': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interview Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-slate-700">{candidate?.fullName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">{job?.title} at {client?.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="space-y-6">
            
            {/* Status & Basic Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{interview.interviewType}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{interview.interviewerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{interview.durationMinutes} min</span>
                  </div>
                </div>
              </div>
              <div className="flex md:flex-col items-center md:items-end justify-between gap-2">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", getStatusColor(interview.status))}>
                  {getStatusIcon(interview.status)}
                  {interview.status}
                </span>
                {interview.status === 'Completed' && (
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", interview.feedbackStatus === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                    Feedback: {interview.feedbackStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Logistics Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Logistics</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                  <p className="text-sm font-medium text-slate-800">{formatDateTime(interview.scheduledAt)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{interview.timezone || 'Local Time'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Format</label>
                  <div className="flex items-center gap-2">
                    {interview.mode === 'Video' ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-medium text-slate-800">{interview.mode}</span>
                    <span className="text-xs text-slate-500">({interview.provider || 'External'})</span>
                  </div>
                </div>
              </div>

              {interview.meetingLink && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Meeting Link / Location</label>
                  <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 transition-colors">
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate flex-1">{interview.meetingLink}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Instructions / History */}
            {interview.candidateInstructions && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Candidate Instructions
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{interview.candidateInstructions}</p>
              </div>
            )}

            {(interview.rescheduleReason || interview.cancellationReason) && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">History</h4>
                {interview.rescheduleReason && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Rescheduled on {interview.rescheduledAt ? formatDateTime(interview.rescheduledAt) : 'Unknown'}</p>
                    <p className="text-sm text-amber-900">{interview.rescheduleReason}</p>
                  </div>
                )}
                {interview.cancellationReason && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-800 mb-1">Cancelled on {interview.cancelledAt ? formatDateTime(interview.cancelledAt) : 'Unknown'}</p>
                    <p className="text-sm text-red-900">{interview.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          {interview.status === 'Completed' && interview.feedbackStatus === 'Submitted' && (
             <button onClick={() => {
                onClose();
                // We'd typically navigate to feedback or open feedback modal, but for now just close
                alert("View Feedback would open here. (Implemented in Interviews list currently)");
             }} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
               View Feedback
             </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
