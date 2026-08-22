import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Briefcase } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { mockUsers } from '../data/mockData';

interface CandidateProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onAction: (action: string) => void;
  actionConfig: {
    primary?: string;
    secondary: string[];
    moreActions: string[];
  };
}

const STAGES = [
  'Sourced', 'Screening', 'Interview Scheduled', 'Interviewing', 
  'Offered', 'Offer Accepted', 'Ready for Onboarding'
];
const TERMINAL_STAGES = ['Rejected', 'Withdrawn', 'Offer Declined'];

export default function CandidateProcessModal({ isOpen, onClose, applicationId, onAction, actionConfig }: CandidateProcessModalProps) {
  const { applications, candidates, jobs, clients, matchRuns, interviews, offers, onboardings } = useApp();

  if (!isOpen) return null;

  const app = applications.find(a => a.id === applicationId);
  if (!app) return null;

  const candidate = candidates.find(c => c.id === app.candidateId);
  const job = jobs.find(j => j.id === app.jobId);
  const client = clients.find(c => c.id === job?.clientId);
  const recruiter = mockUsers.find(u => u.id === app.assignedRecruiterId);
  
  const run = matchRuns.find(r => r.jobId === job?.id);
  const match = run?.matches.find(m => m.candidateId === candidate?.id);

  const appInterviews = interviews.filter(i => i.applicationId === applicationId);
  const appOffers = offers.filter(o => o.applicationId === applicationId);
  const appOnboardings = onboardings.filter(o => o.applicationId === applicationId);

  if (!candidate || !job) return null;

  const currentStage = app.currentStage;
  const isTerminal = TERMINAL_STAGES.includes(currentStage);

  // Derive a synthetic activity history since a central one doesn't exist
  const activities: Array<{date: string, action: string, user: string, note: string, isFeedback?: boolean}> = [];
  if (app.appliedDate) {
    activities.push({ 
      date: app.appliedDate, 
      action: 'Added to Job pipeline', 
      user: recruiter?.name || 'System', 
      note: `Origin: ${app.associationOrigin || 'Applied directly'}`
    });
  }

  if (app.screeningData?.updatedAt) {
    activities.push({ 
      date: app.screeningData.updatedAt, 
      action: 'Screening updated', 
      user: 'Recruiter', 
      note: `Status: ${app.screeningData.status}`
    });
  }

  appInterviews.forEach(i => {
    if (i.scheduledAt) {
      activities.push({
        date: i.scheduledAt,
        action: 'Interview scheduled',
        user: 'System',
        note: `${i.type} - Round ${i.round}`
      });
    }
    if (i.feedbackStatus === 'Completed' && i.scheduledAt) {
      activities.push({
        date: i.scheduledAt, 
        action: 'Feedback submitted',
        user: 'Interviewer',
        note: `Interview Completed`,
        isFeedback: true
      });
    }
  });

  appOffers.forEach(o => {
    if (o.createdAt) {
      activities.push({
        date: o.createdAt,
        action: 'Offer created',
        user: 'System',
        note: `Version ${o.version}`
      });
    }
    if (o.issuedAt) {
      activities.push({
        date: o.issuedAt,
        action: 'Offer issued',
        user: 'System',
        note: ''
      });
    }
    if (o.respondedAt) {
      activities.push({
        date: o.respondedAt,
        action: 'Offer responded',
        user: 'Candidate',
        note: `Status: ${o.status}`
      });
    }
  });

  const validActivities = activities.filter(a => !!a.date);
  // Sort activities newest first
  validActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Determine which stages to highlight
  let currentStageIndex = STAGES.indexOf(currentStage);
  if (currentStageIndex === -1 && !isTerminal) {
    if (['Applied', 'Under Review'].includes(currentStage)) currentStageIndex = 0;
    else if (['Shortlisted', 'Selected'].includes(currentStage) || currentStage.includes('Interview')) currentStageIndex = 3;
    else if (['Offer Extended', 'Offer Sent'].includes(currentStage)) currentStageIndex = 4;
    else if (['Joined'].includes(currentStage)) currentStageIndex = 6;
    else currentStageIndex = 0;
  }

  const handlePrimaryAction = () => {
    if (actionConfig.primary) {
      onAction(actionConfig.primary);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-end p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-slate-50 w-full sm:w-[600px] h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right sm:slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{candidate.fullName}</h2>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{candidate.code}</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-medium rounded text-sm border border-blue-200">
              {currentStage}
            </span>
            <span className="text-sm text-slate-600 font-medium">{job.title}</span>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-sm text-slate-600">{client?.name}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" tabIndex={-1}>
          
          {/* Overview */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Process Overview
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Entry Type</p>
                <p className="font-medium text-slate-800">{app.associationOrigin ? 'Added by Recruiter' : 'Applied Directly'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Origin</p>
                <p className="font-medium text-slate-800">{app.associationOrigin || app.source || 'Not recorded'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Created Date</p>
                <p className="font-medium text-slate-800">{formatDate(app.appliedDate)}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Assigned Recruiter</p>
                <p className="font-medium text-slate-800">{recruiter?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Match Score</p>
                <p className="font-medium text-slate-800">{match ? `${match.score}%` : 'Not recorded'}</p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">Hiring Progress</h3>
            <div className="relative pl-3">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>
              <div className="space-y-6">
                {STAGES.map((stage, idx) => {
                  const isCompleted = !isTerminal && idx < currentStageIndex;
                  const isCurrent = !isTerminal && idx === currentStageIndex;
                  const isFuture = isTerminal || idx > currentStageIndex;
                  
                  return (
                    <div key={stage} className="relative flex items-start gap-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1.5 z-10 shrink-0 ring-4 ring-white border",
                        isCompleted ? "bg-blue-600 border-blue-600" : 
                        isCurrent ? "bg-white border-[3px] border-blue-600 w-3.5 h-3.5 mt-1" : 
                        "bg-slate-100 border-slate-300"
                      )}></div>
                      <div>
                        <p className={cn(
                          "font-medium text-sm",
                          isCurrent ? "text-blue-700 font-bold" :
                          isFuture ? "text-slate-400" : "text-slate-800"
                        )}>
                          {stage}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {isTerminal && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full mt-1.5 z-10 shrink-0 ring-4 ring-white border bg-red-600 border-red-600"></div>
                    <div>
                      <p className="font-bold text-sm text-red-700">{currentStage}</p>
                      <p className="text-xs text-red-600 mt-0.5">{app.rejectionReason || 'No reason recorded'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Stage Specific Details */}
          {app.screeningData && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Screening Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-slate-800">{app.screeningData.status}</span>
                </div>
                {app.screeningData.recruiterNotes && (
                  <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-xs italic">
                    "{app.screeningData.recruiterNotes}"
                  </div>
                )}
              </div>
            </section>
          )}

          {appInterviews.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Interviews</h3>
              <div className="space-y-4">
                {appInterviews.map((interview, idx) => (
                  <div key={interview.id} className={cn("text-sm", idx > 0 && "pt-4 border-t border-slate-100")}>
                    <p className="font-medium text-slate-800">{interview.type} (Round {interview.round})</p>
                    <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{formatDate(interview.scheduledAt)}</span>
                      <span>{interview.meetingMode}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs border border-slate-200">
                        Status: {interview.status}
                      </span>
                      {interview.feedbackStatus === 'Completed' && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200">
                          Feedback Logged
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* History */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Activity History</h3>
            {validActivities.length > 0 ? (
              <div className="space-y-4 relative pl-3">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-200"></div>
                {validActivities.map((act, i) => (
                  <div key={i} className="relative flex gap-4 text-sm">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 z-10 ring-4 ring-white"></div>
                    <div>
                      <p className="font-medium text-slate-800">{act.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {act.isFeedback ? 'Recently' : formatDate(act.date)} • {act.user}
                      </p>
                      {act.note && <p className="text-xs text-slate-600 mt-1">{act.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">No additional hiring activity has been recorded yet.</div>
            )}
          </section>

        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row gap-3">
          {actionConfig.primary ? (
            <button 
              onClick={handlePrimaryAction}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {actionConfig.primary}
            </button>
          ) : (
            <div className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-500 font-medium rounded-lg text-center text-sm border border-slate-200">
              No further actions available
            </div>
          )}
          <button 
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
