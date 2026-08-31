import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockJobs, mockClients, mockUsers } from '../data/mockData';
import { getMatchingJobsForCandidate } from '../data/mockCandidateJobInsights';
import { Mail, Phone, MapPin, Building2, Briefcase, FileText, Sparkles, AlertTriangle, MoreHorizontal, Check, X, Clock, Play, AlertCircle, Users, Calendar } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Application } from '../types';
import AIInsightCard from './AIInsightCard';
import { useApp } from '../context/AppContext';
import CandidateFormModal from './CandidateFormModal';
import MatchInsightModal from './MatchInsightModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import CandidateScreeningModal from './CandidateScreeningModal';
import OfferPreparationModal from './OfferPreparationModal';
import ConfirmSelectionModal from './ConfirmSelectionModal';
import ViewInterviewModal from './ViewInterviewModal';
import AddJobToCandidateModal from './AddJobToCandidateModal';
import CandidateProcessModal from './CandidateProcessModal';
import RecordInterviewFeedbackModal from './RecordInterviewFeedbackModal';

type TabType = 'Overview' | 'Matching Jobs' | 'Jobs & Hiring Progress' | 'Activity' | 'Documents';

interface ActionConfig {
  primary: string | null;
  secondary: string[];
  moreActions: string[];
}

export default function CandidateDetail() {
  const { id } = useParams();
  const { candidates, applications, interviews, offers, onboardings, matchRuns, jobs, clients, setQuickViewJobId, setQuickViewClientId, addMatchToPipeline } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  
  const [dismissedMatches, setDismissedMatches] = useState<string[]>([]);
  const [showViewInterviewModal, setShowViewInterviewModal] = useState<{jobId: string, candidateId: string} | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAddingToPipeline, setIsAddingToPipeline] = useState<boolean>(false);
  
  // Action Modals State
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [showMatchModal, setShowMatchModal] = useState<{jobId: string, candidateId: string} | null>(null);
  const [showPipelineConfirmModal, setShowPipelineConfirmModal] = useState<string | null>(null);
  const [showScreeningModal, setShowScreeningModal] = useState<string | null>(null); // appId
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState<{jobId: string, candidateId?: string} | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState<{jobId: string} | null>(null);
  const [showOfferPreparationModal, setShowOfferPreparationModal] = useState<string | null>(null); // appId
  const [showConfirmSelectionModal, setShowConfirmSelectionModal] = useState<string | null>(null); // appId
  const [showRecordFeedbackModal, setShowRecordFeedbackModal] = useState<string | null>(null); // interviewId
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // jobId
  
  // Filters for Matching Jobs
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');

  // Expandable Timeline
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return <div className="p-8 text-center text-slate-500">Candidate not found</div>;

  // Existing Applications (directly from context)
  const existingCandidateApps = applications.filter(a => a.candidateId === candidate.id);
  
  // Combine for Jobs & Hiring Progress tab
  const allAssociatedJobIds = [...existingCandidateApps.map(a => a.jobId)];
  const combinedApplications = [...existingCandidateApps];

  const completedStages = ['Rejected', 'Withdrawn', 'Offer Declined'];
  const activeProcesses = combinedApplications.filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return !completedStages.includes(app.currentStage) && job?.status !== 'Closed';
  });
  const completedProcesses = combinedApplications.filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return completedStages.includes(app.currentStage) || job?.status === 'Closed';
  });

  // All Candidate Match Insights from actual match runs
  const candidateInsights: Array<{jobId: string, matchScore: number, breakdown: any, strengths: string[], missingCriteria: string[], explanation: string}> = matchRuns.flatMap(run => {
    const match = run.matches.find(m => m.candidateId === candidate.id);
    if (!match) return [];
    return [{ 
      jobId: run.jobId, 
      matchScore: match.score, 
      breakdown: match.breakdown,
      strengths: match.matchStrengths,
      missingCriteria: match.missingRequirements,
      explanation: match.mismatchReasons.join(' ') || 'Candidate is a good match based on required skills and experience.',
    }];
  });

  // Eligible Matching Jobs List
  const matchingJobs = candidateInsights.filter(insight => {
    if (insight.matchScore < 70) return false;
    if (dismissedMatches.includes(insight.jobId)) return false;
    
    const job = mockJobs.find(j => j.id === insight.jobId);
    if (!job) return false;
    if (job.status !== 'Published') return false; 
    if (job.openings - job.filled <= 0) return false;

    if (locationFilter && job.location !== locationFilter) return false;
    if (employmentFilter && job.employmentType !== employmentFilter) return false;

    return true;
  }).sort((a, b) => b.matchScore - a.matchScore);

  const topMatches = matchingJobs
    .filter(insight => !allAssociatedJobIds.includes(insight.jobId))
    .slice(0, 3);

  const getActionsForApplication = (app: Application): ActionConfig => {
    const stage = app.currentStage;
    const appOffers = offers.filter(o => o.applicationId === app.id);
    const activeOffer = appOffers.length > 0 ? appOffers[appOffers.length - 1] : null;
    const substate = app.currentSubstate || '';

    const viewTimeline = 'View Timeline';
    const viewJob = 'View Job';

    let primary: string | null = null;
    let secondary = [viewTimeline, viewJob];
    let moreActions: string[] = [];

    switch (stage) {
      case 'Sourced':
      case 'Applied' as string:
        primary = 'Begin Screening';
        break;
      case 'Screening' as string:
        primary = 'Continue Screening';
        moreActions = ['Schedule Interview'];
        break;
      case 'Interviewing': {
        const appInterviews = interviews.filter(i => i.applicationId === app.id);
        const hasMissingFeedback = appInterviews.some(i => (i.status === 'Scheduled' || i.status === 'Completed') && i.feedbackStatus !== 'Submitted');
        
        if (hasMissingFeedback) {
          primary = 'Record Feedback';
          moreActions = ['Confirm Selection', 'View Interview', 'Schedule Next Round'];
        } else if (substate === 'Next Round To Schedule') {
          primary = 'Schedule Next Round';
          moreActions = ['Confirm Selection', 'View Interview'];
        } else {
          primary = 'Confirm Selection';
          moreActions = ['View Interview', 'Schedule Next Round'];
        }
        break;
      }
      case 'Selected':
        if (activeOffer?.status === 'Draft') {
          primary = 'Continue Offer';
        } else if (activeOffer?.status === 'Issued') {
          primary = 'View Offer';
        } else {
          primary = 'Prepare Offer';
        }
        break;
      case 'Offered':
        if (activeOffer?.status === 'Accepted' || substate === 'Offer Accepted') {
          primary = 'Start Onboarding';
        } else if (activeOffer?.status === 'Issued') {
          primary = 'View Offer';
          moreActions = ['Record Response'];
        } else {
          primary = 'Record Response';
        }
        break;
      case 'Hired':
      case 'Joined':
        if (activeOffer?.status === 'Accepted' || substate === 'Offer Accepted') {
          primary = 'Start Onboarding';
        } else {
          primary = 'Start Onboarding';
        }
        break;
      case 'Rejected':
      case 'Withdrawn':
        primary = 'View History';
        break;
      default:
        primary = null;
    }

    return { primary, secondary, moreActions };
  };

  const handleAction = async (action: string, app: Application) => {
    const jobId = app.jobId;
    switch (action) {
      case 'Begin Screening':
      case 'Continue Screening':
        setShowScreeningModal(app.id);
        break;
      case 'Schedule Interview':
      case 'Schedule Next Round':
        setShowScheduleInterviewModal({ jobId });
        break;
      case 'Confirm Selection':
        setShowConfirmSelectionModal(app.id);
        break;
      case 'Prepare Offer':
      case 'Continue Offer':
        setShowOfferPreparationModal(app.id);
        break;
      case 'Start Onboarding':
        setShowOnboardingModal({ jobId });
        break;
      case 'View Match':
        const job = jobs.find(j => j.id === app.jobId);
        const client = clients.find(c => c.id === job?.clientId);
        const insight = candidateInsights.find(i => i.jobId === app.jobId);
        if (job && client && insight) {
          setSelectedInsight({ job, client, insight });
        } else {
          alert('No match insights available for this relationship.');
        }
        break;
      case 'View Job':
        setQuickViewJobId(jobId);
        break;
      case 'View Timeline':
        setExpandedTimelineId(prev => prev === app.id ? null : app.id);
        break;
      case 'Open Handover':
      case 'View Offer':
      case 'Record Response':
      case 'Review Feedback':
      case 'Start Onboarding Handover':
      case 'View Process':
      case 'View Hiring Process':
      case 'View History':
        setShowProcessModal(app.id);
        break;
      case 'View Interview':
        setShowViewInterviewModal({ jobId: app.jobId, candidateId: app.candidateId });
        break;
      case 'Record Feedback': {
        const appInterview = interviews.find(i => i.applicationId === app.id && (i.status === 'Scheduled' || i.status === 'Completed') && i.feedbackStatus !== 'Submitted');
        if (appInterview) setShowRecordFeedbackModal(appInterview.id);
        break;
      }
      default:
        alert(`Simulating action: ${action}\nRoute or drawer would open here.`);
        break;
    }
  };

  const handleAddToPipeline = async (jobId: string) => {
    setIsAddingToPipeline(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const res = addMatchToPipeline(jobId, candidate.id, 'Added from Candidate Match');
    setIsAddingToPipeline(false);
    if (res.success) {
      setToast({ message: `${candidate.fullName} was added to the ${jobs.find(j => j.id === jobId)?.title} pipeline at Sourced.`, type: 'success' });
      setShowPipelineConfirmModal(null);
      setActiveTab('Jobs & Hiring Progress');
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ message: res.error || 'Failed to add to pipeline.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDismiss = (jobId: string) => {
    if (window.confirm('Are you sure you want to dismiss this match? It will be hidden from the matching jobs list.')) {
      setDismissedMatches([...dismissedMatches, jobId]);
    }
  };

  const confirmStartOnboarding = () => {
    setIsProcessing(showOnboardingModal?.jobId || null);
    setTimeout(() => {
      setIsProcessing(null);
      setShowOnboardingModal(null);
    }, 800);
  };

  // Build Activities Timeline
  const candidateActivities = [];
  candidateActivities.push({
    id: `act-create`,
    action: 'Candidate profile created',
    date: candidate.createdAt || '2026-07-10T10:00:00Z',
    actor: 'System Import',
  });
  if (candidate.resumeUrl) {
    candidateActivities.push({
      id: `act-resume`,
      action: 'Resume uploaded',
      date: candidate.updatedAt || candidate.createdAt || '2026-07-10T10:30:00Z',
      actor: candidate.source === 'Applied' ? candidate.fullName : 'Recruiter',
    });
  }
  
  const candidateApps = applications.filter(a => a.candidateId === candidate.id);
  candidateApps.forEach(app => {
    const job = jobs.find(j => j.id === app.jobId);
    const client = job ? clients.find(c => c.id === job.clientId) : null;
    const relatedStr = job ? `${job.title} — ${client?.name}` : '';
    
    candidateActivities.push({
      id: `act-app-${app.id}-start`,
      action: app.currentStage === 'Applied' ? 'Applied for Job' : 'Added to Job Pipeline',
      date: app.appliedDate || app.lastActivity || candidate.createdAt || new Date().toISOString(),
      actor: app.currentStage === 'Applied' ? candidate.fullName : 'Recruiter',
      jobId: job?.id,
      jobTitle: relatedStr,
      stage: 'Sourced'
    });

    if (app.currentStage !== 'Sourced' && app.lastActivity) {
      candidateActivities.push({
        id: `act-app-${app.id}-update`,
        action: `Moved to ${app.currentStage}`,
        date: app.lastActivity || app.appliedDate || candidate.createdAt || new Date().toISOString(),
        actor: 'Recruiter',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: app.currentStage
      });
    }

    const appInterviews = interviews.filter(i => i.applicationId === app.id);
    appInterviews.forEach(iv => {
      candidateActivities.push({
        id: `act-iv-${iv.id}-sched`,
        action: `Interview Scheduled (${iv.interviewType})`,
        date: iv.scheduledAt || app.lastActivity || candidate.createdAt || new Date().toISOString(),
        actor: 'Recruiter',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: 'Interviewing'
      });
      if (iv.status === 'Completed' || iv.status === 'Cancelled') {
        candidateActivities.push({
          id: `act-iv-${iv.id}-end`,
          action: `Interview ${iv.status} (${iv.interviewType})`,
          date: iv.cancelledAt || iv.rescheduledAt || iv.scheduledAt || app.lastActivity || candidate.createdAt || new Date().toISOString(),
          actor: iv.status === 'Cancelled' ? 'Recruiter' : 'Interviewer',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Interviewing'
        });
      }
    });

    const appOffers = offers.filter(o => o.applicationId === app.id);
    appOffers.forEach(o => {
      candidateActivities.push({
        id: `act-off-${o.id}-draft`,
        action: `Offer Drafted`,
        date: o.offerDate || o.sentDate || app.lastActivity || candidate.createdAt || new Date().toISOString(),
        actor: 'Recruiter',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: 'Offered'
      });
      if (o.status === 'Offer Issued') {
        candidateActivities.push({
          id: `act-off-${o.id}-issue`,
          action: `Offer Issued to Candidate`,
          date: o.sentDate || o.offerDate || app.lastActivity || candidate.createdAt || new Date().toISOString(),
          actor: 'Recruiter',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Offered'
        });
      } else if (o.status === 'Accepted' || o.status === 'Declined') {
        candidateActivities.push({
          id: `act-off-${o.id}-resp`,
          action: `Offer ${o.status}`,
          date: o.acceptedAt || o.rejectedAt || o.sentDate || app.lastActivity || candidate.createdAt || new Date().toISOString(),
          actor: candidate.fullName,
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: o.status === 'Accepted' ? 'Offer Accepted' : 'Offered'
        });
      }
    });
    
    const appOnboarding = onboardings.find(o => o.applicationId === app.id);
    if (appOnboarding) {
      candidateActivities.push({
        id: `act-onb-${appOnboarding.id}`,
        action: `Onboarding Handover Created`,
        date: appOnboarding.proposedJoiningDate || appOnboarding.plannedJoiningDate || app.lastActivity || candidate.createdAt || new Date().toISOString(),
        actor: 'Recruiter',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: 'Hired'
      });
    }
  });

  candidateActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Build Documents
  const candidateDocuments = [];
  if (candidate.resumeUrl) {
    candidateDocuments.push({
      id: 'doc-resume',
      name: 'Candidate Resume',
      type: 'Resume',
      filename: candidate.resumeUrl.split('/').pop() || 'resume.pdf',
      uploadedBy: candidate.source === 'Applied' ? candidate.fullName : 'Recruiter',
      uploadDate: candidate.updatedAt || candidate.createdAt || '2026-07-10T10:30:00Z',
      status: 'Verified',
      jobId: null,
      jobTitle: null
    });
  }

  const renderAppCard = (app: Application) => {
    const job = jobs.find(j => j.id === app.jobId);
    const client = clients.find(c => c.id === job?.clientId);
    const recruiter = mockUsers.find(u => u.id === app.assignedRecruiterId);
    
    let originLabel = 'Applied directly';
    if ('associationOrigin' in app && app.associationOrigin) {
      originLabel = app.associationOrigin as string;
    } else if (app.source === 'SPC Careers Website') {
      originLabel = 'Applied through SPC Careers Website';
    }

    const currentStage = app.currentStage || 'Unknown';
    const actionConfig = getActionsForApplication(app);

    const appInterview = interviews.find(i => i.applicationId === app.id);
    const appOffer = offers.filter(o => o.applicationId === app.id).pop();
    const lastActivity = (app as any).updatedAt || app.lastActivity || appOffer?.createdAt || appInterview?.createdAt || app.appliedDate;
    const isExpanded = expandedTimelineId === app.id;
    const insight = candidateInsights.find(i => i.jobId === app.jobId);

    const timelineStages = ['Added', 'Screening', 'Interviewing', 'Selected', 'Offered', 'Hired', 'Joined'];
    const getStageIndex = (stage: string) => {
      if (['Rejected', 'Withdrawn'].includes(stage)) return -1;
      switch (stage) {
        case 'Sourced':
        case 'Applied': return 0;
        case 'Screening': return 1;
        case 'Interviewing': return 2;
        case 'Selected': return 3;
        case 'Offered': return 4;
        case 'Hired': return 5;
        case 'Joined': return 6;
        default: return -1;
      }
    };
    const currentIndex = getStageIndex(currentStage);

    return (
      <div key={app.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => job && setQuickViewJobId(job.id)} className="font-semibold text-slate-800 hover:text-blue-600 text-lg outline-none text-left">
                {job?.title || 'Unknown Job'} <span className="text-sm font-normal text-slate-500 ml-1">{job?.code}</span>
              </button>
              <span className="text-slate-400">•</span>
              <button onClick={() => client && setQuickViewClientId(client.id)} className="text-sm text-slate-600 hover:text-blue-600 outline-none">
                {client?.name || 'Unknown Client'}
              </button>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><span className="font-medium text-slate-700">Origin: {originLabel}</span> • Added {formatDate(app.appliedDate)} • Recruiter: {recruiter?.name || 'Unassigned'}</p>
              <p>Last Activity: {formatDate(lastActivity)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200">
              {currentStage}
            </span>
            {appOffer && (
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                Offer: {appOffer.status}
              </span>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-5 bg-slate-50 border-b border-slate-100">
            <div className="relative flex items-center justify-between mt-2 max-w-2xl mx-auto">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
              {timelineStages.map((stage, idx) => {
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                return (
                  <div key={stage} className="relative z-10 flex flex-col items-center gap-2 w-16">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors duration-300",
                      isCompleted ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300",
                      isCurrent && "ring-4 ring-blue-100"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight transition-colors duration-300",
                      isCompleted ? "text-slate-800" : "text-slate-400",
                      isCurrent && "font-bold text-blue-700"
                    )}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50 flex justify-end gap-2 items-center flex-wrap border-t border-slate-100">
          {insight && (
            <button 
              onClick={() => handleAction('View Match', app)}
              className="px-3 py-1.5 bg-transparent text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 mr-auto"
            >
              <Sparkles className="w-4 h-4" /> View Match
            </button>
          )}

          {actionConfig.moreActions.includes('Schedule Next Round') && (
            <button 
              onClick={() => handleAction('Schedule Next Round', app)}
              disabled={isProcessing === app.jobId}
              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors mr-auto"
              title="Schedule Next Round"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}

          {actionConfig.secondary.map((action, idx) => (
            <button 
              key={idx} 
              onClick={() => handleAction(action, app)}
              disabled={isProcessing === app.jobId}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {action === 'View Timeline' ? (isExpanded ? 'Hide Timeline' : 'View Timeline') : action}
            </button>
          ))}
          
          {actionConfig.primary && (
            <button 
              onClick={() => handleAction(actionConfig.primary!, app)}
              disabled={isProcessing === app.jobId}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[120px]"
            >
              {isProcessing === app.jobId ? 'Processing...' : actionConfig.primary}
            </button>
          )}
          
          {actionConfig.moreActions.filter(ma => ma !== 'Schedule Next Round').length > 0 && (
            <div className="relative group">
              <button disabled={isProcessing === app.jobId} className="px-2 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                {actionConfig.moreActions.filter(ma => ma !== 'Schedule Next Round').map((ma, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => handleAction(ma, app)}
                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                   >
                     {ma}
                   </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border",
            toast.type === 'error' ? "bg-red-600 border-red-500 text-white" : "bg-slate-900 border-slate-800 text-white"
          )}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <Check className="w-4 h-4 text-green-400" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">{candidate.fullName}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                  {candidate.code}
                </span>
                {candidate.duplicateStatus !== 'None' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium rounded">
                    <AlertTriangle className="w-3 h-3" />
                    {candidate.duplicateStatus}
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-1">{candidate.currentRole || 'No Role'} at {candidate.currentCompany || 'No Company'}</p>
              
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {candidate.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {candidate.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {candidate.currentLocation}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Edit Profile
            </button>
            {candidate.resumeUrl ? (
              <>
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                  Download Resume
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Resume
                </button>
              </>
            ) : (
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Upload Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {candidate.duplicateStatus !== 'None' && (
        <AIInsightCard 
          title="Duplicate Candidate Warning"
          severity="warning"
          explanation="This profile has strong similarities with another candidate in the database."
          evidence={[
            "Same phone number: +91 9876543210",
            "Highly similar resume text (92% overlap)",
            "Previous profile: CAN-2023-088 (Applied 2 months ago)"
          ]}
          actionLabel="Merge Profiles"
          onAction={() => {}}
        />
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto hide-scrollbar">
        <div className="flex gap-6 min-w-max px-2">
          {['Overview', 'Hiring Progress', 'Matching Jobs', 'Activity', 'Documents'].map(tab => {
            const isActive = activeTab === tab;
            const count = tab === 'Hiring Progress' ? activeProcesses.length :
              tab === 'Matching Jobs' ? matchingJobs.length : null;
            const label = count !== null ? `${tab} (${count})` : tab;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Professional Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Experience</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.totalExperience || 'Not provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current CTC</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.currentSalary || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Expected CTC</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.expectedSalary || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Notice Period</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.noticePeriod || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Availability</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.availableFrom ? formatDate(candidate.availableFrom) : 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Company</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.currentCompany || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Role</p>
                    <p className="text-sm font-medium text-slate-800">{candidate.currentRole || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Candidate Source</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.source || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Skills & Education</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Skills</p>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Languages</p>
                  {candidate.languages && candidate.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.languages.map((lang, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Education / Qualification</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.education || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">System Metadata</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Profile Created Date</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.createdAt ? formatDate(candidate.createdAt) : 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Resume Last Updated</p>
                  <p className="text-sm font-medium text-slate-800">{candidate.resumeUrl ? 'Recently updated' : 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-slate-800">Top Matching Jobs</h3>
                 <button onClick={() => setActiveTab('Matching Jobs')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                   View all matching jobs
                 </button>
               </div>
               
               {topMatches.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {topMatches.map(insight => {
                     const job = mockJobs.find(j => j.id === insight.jobId);
                     const client = mockClients.find(c => c.id === job?.clientId);
                     if (!job) return null;
                     
                     return (
                       <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-sm px-2 py-0.5 rounded shadow-sm">
                              {insight.matchScore}%
                            </span>
                            <span className="text-xs text-slate-500">{job.openings - job.filled} open</span>
                         </div>
                         <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{job.title}</h4>
                         <p className="text-xs text-slate-500 mb-3">{client?.name || 'Unknown Client'} • {job.location}</p>
                         
                         <div className="mt-auto space-y-2">
                           <ul className="text-xs text-slate-600 space-y-1">
                             {insight.strengths.slice(0, 2).map((s, i) => (
                               <li key={i} className="flex items-start gap-1"><span className="text-green-500 font-bold">•</span> <span className="truncate">{s}</span></li>
                             ))}
                             {insight.missingCriteria.length > 0 && (
                               <li className="flex items-start gap-1"><span className="text-amber-500 font-bold">•</span> <span className="truncate">{insight.missingCriteria[0]}</span></li>
                             )}
                           </ul>
                           
                           <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                              <button onClick={() => setSelectedInsight({ job, client, insight })} className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 border border-slate-200 rounded hover:bg-slate-50">
                                View Match
                              </button>
                              <button onClick={() => setShowPipelineConfirmModal(job.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1.5 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 text-center">
                                Pipeline
                              </button>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                  <div className="bg-white/60 p-6 rounded-lg text-center text-slate-600 text-sm">
                    <p>No new eligible matching jobs found.</p>
                    <p className="text-xs mt-1 text-slate-500">The candidate may already be in the pipeline for all their strong matches.</p>
                  </div>
               )}
            </div>

            {candidate.professionalSummary && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3">Professional Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{candidate.professionalSummary}</p>
              </div>
            )}

            {candidate.employmentHistory && candidate.employmentHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-6">Employment History</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                  {candidate.employmentHistory.map((exp, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ml-[2px] md:ml-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm ml-4 md:ml-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-800 text-sm">{exp.role}</h4>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{exp.company} {exp.location && `• ${exp.location}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matching Jobs Tab */}
      {activeTab === 'Matching Jobs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
             <div className="flex gap-4 flex-1">

               <label className="flex items-center gap-2 text-sm text-slate-600">
                 Location:
                 <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="border-slate-300 rounded px-2 py-1">
                   <option value="">All Locations</option>
                   <option value="Delhi">Delhi</option>
                   <option value="Noida">Noida</option>
                   <option value="Gurugram">Gurugram</option>
                 </select>
               </label>
             </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {matchingJobs.length > 0 ? matchingJobs.map(insight => {
              const job = mockJobs.find(j => j.id === insight.jobId);
              const client = mockClients.find(c => c.id === job?.clientId);
              if (!job) return null;

              return (
                <div key={job.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50/50 transition-colors group">
                   <div className="flex flex-col items-center justify-start md:w-24 shrink-0">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
                        {insight.matchScore}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2">Score</span>
                   </div>
                   
                   <div className="flex-1 space-y-4">
                     <div>
                       <button onClick={() => setQuickViewJobId(job.id)} className="font-bold text-lg text-slate-800 hover:text-blue-600 outline-none text-left">
                        {job.title} <span className="text-sm font-normal text-slate-500 ml-2">{job.code}</span>
                      </button>
                       <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                         <span className="font-medium text-slate-700 flex items-center gap-1.5"><Building2 className="w-4 h-4"/> {client?.name || 'Unknown Client'}</span>
                         <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {job.location}</span>
                         <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {job.employmentType}</span>
                         <span className="text-slate-400">•</span>
                         <span className="font-medium text-slate-700">{job.status}</span>
                         <span className="text-slate-400">•</span>
                         <span className="font-medium text-blue-600">{job.openings - job.filled} Openings</span>
                       </div>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Skills: {insight.breakdown?.skills || 0}/40</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Exp: {insight.breakdown?.experience || 0}/20</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Location: {insight.breakdown?.location || 0}/15</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Edu: {insight.breakdown?.education || 0}/10</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Avail: {insight.breakdown?.availability || 0}/10</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Type: {insight.breakdown?.employmentType || 0}/5</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Strengths</p>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {insight.strengths.slice(0,3).map((s: string, i: number) => <li key={i} className="flex items-start gap-1"><span className="text-green-500 mt-0.5">•</span> {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Missing / Unverified</p>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {insight.missingCriteria.slice(0,3).map((g: string, i: number) => <li key={i} className="flex items-start gap-1"><span className="text-amber-500 mt-0.5">•</span> {g}</li>)}
                            {insight.missingCriteria.length === 0 && <li className="text-slate-400 italic">None</li>}
                          </ul>
                        </div>
                     </div>
                     
                     <div className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                       <span className="font-semibold text-slate-700 mr-2">Explanation:</span>
                       {insight.explanation}
                     </div>
                   </div>
                   
                   <div className="flex flex-col gap-2 shrink-0 md:w-40">
                     {combinedApplications.find(a => a.jobId === job.id) ? (
                       <div className="w-full px-4 py-2 bg-slate-100 text-slate-500 text-sm font-medium rounded-lg text-center border border-slate-200">
                         {['Rejected', 'Withdrawn', 'Offer Declined'].includes(combinedApplications.find(a => a.jobId === job.id)!.currentStage) 
                           ? combinedApplications.find(a => a.jobId === job.id)!.currentStage 
                           : 'In Pipeline'}
                       </div>
                     ) : (
                       <button onClick={() => setShowPipelineConfirmModal(job.id)} className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-center">
                         Add to Pipeline
                       </button>
                     )}
                     <button onClick={() => setSelectedInsight({ job, client, insight })} className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors text-center">
                       View Match Details
                     </button>
                     <button onClick={() => setQuickViewJobId(job.id)} className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors text-center block outline-none">
                      View Job
                    </button>
                     <button onClick={() => handleDismiss(job.id)} className="w-full px-4 py-2 mt-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors text-center">
                       Dismiss Match
                     </button>
                   </div>
                </div>
              );
            }) : (
              <div className="p-12 text-center text-slate-500">
                 No jobs match the current criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs & Hiring Progress Tab Content */}
      {activeTab === 'Hiring Progress' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Hiring Progress</h3>
            <button 
              onClick={() => setShowAddJobModal(true)} 
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Add to Job Pipeline
            </button>
          </div>
          
          {activeProcesses.length === 0 && completedProcesses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No Active Job Processes</h3>
              <p className="mb-6 max-w-md mx-auto">This candidate is not currently being evaluated for any jobs.</p>
              <button 
                onClick={() => setShowAddJobModal(true)}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm mx-auto flex items-center gap-2"
              >
                Add to Job Pipeline
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {activeProcesses.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Active Processes</h4>
                  {activeProcesses.map(renderAppCard)}
                </div>
              )}
              {completedProcesses.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Completed / Closed</h4>
                  {completedProcesses.map(renderAppCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {activeTab === 'Activity' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Activity History</h3>
          <div className="relative pl-4 space-y-6">
            <div className="absolute top-2 bottom-2 left-[23px] w-0.5 bg-slate-200"></div>
            {candidateActivities.map((act, idx) => (
              <div key={act.id + idx} className="relative z-10 flex gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-blue-500 ring-4 ring-white shrink-0 shadow-sm" />
                <div className="flex-1 pb-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                    <p className="font-semibold text-slate-800 text-sm">{act.action}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(act.date)}
                    </div>
                  </div>
                  {act.jobTitle && (
                    <p className="text-sm text-slate-600 mb-1">{act.jobTitle}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200">{act.actor}</span>
                    {act.stage && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">Stage: {act.stage}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {candidateActivities.length === 0 && (
              <div className="text-center text-slate-500 py-8 italic">No activity recorded for this candidate.</div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {activeTab === 'Documents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Candidate Documents</h3>
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Upload Document
            </button>
          </div>
          <div className="p-6">
            {candidateDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidateDocuments.map((doc, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                        {doc.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-500 mb-3 truncate" title={doc.filename}>{doc.filename}</p>
                    
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type</span>
                        <span className="font-medium">{doc.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uploaded</span>
                        <span className="font-medium">{formatDate(doc.uploadDate).split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">By</span>
                        <span className="font-medium truncate max-w-[100px]" title={doc.uploadedBy}>{doc.uploadedBy}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md transition-colors border border-slate-200">
                        View
                      </button>
                      <button className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors border border-blue-100">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Documents Available</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">There are no documents uploaded for this candidate yet.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CandidateFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={candidate}
        isEditMode={true}
      />
      
      {selectedInsight && (
        <MatchInsightModal 
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          job={selectedInsight.job}
          client={selectedInsight.client}
          candidate={candidate}
          insight={selectedInsight.insight}
        />
      )}

      {showOfferPreparationModal && (
        <OfferPreparationModal 
          isOpen={!!showOfferPreparationModal}
          onClose={() => setShowOfferPreparationModal(null)}
          applicationId={showOfferPreparationModal}
        />
      )}

      {showConfirmSelectionModal && (
        <ConfirmSelectionModal 
          isOpen={!!showConfirmSelectionModal}
          onClose={() => setShowConfirmSelectionModal(null)}
          applicationId={showConfirmSelectionModal}
        />
      )}

      {showViewInterviewModal && (
        <ViewInterviewModal
          isOpen={true}
          onClose={() => setShowViewInterviewModal(null)}
          jobId={showViewInterviewModal.jobId}
          candidateId={showViewInterviewModal.candidateId}
        />
      )}

      {showAddJobModal && (
        <AddJobToCandidateModal
          isOpen={showAddJobModal}
          onClose={() => setShowAddJobModal(false)}
          candidateId={id!}
        />
      )}

      {showProcessModal && (
        <CandidateProcessModal
          isOpen={true}
          onClose={() => setShowProcessModal(null)}
          applicationId={showProcessModal}
          onAction={(action) => {
            const app = applications.find(a => a.id === showProcessModal);
            if (app) handleAction(action, app);
          }}
          actionConfig={getActionsForApplication(applications.find(a => a.id === showProcessModal)!)}
        />
      )}

      {/* Pipeline Confirmation Modal */}
      {showPipelineConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">Add to Pipeline</h3>
             </div>
             <div className="p-6">
                <p className="text-slate-600 text-sm mb-4">You are adding <strong>{candidate.fullName}</strong> to the pipeline for:</p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
                  <p className="font-semibold text-slate-800 text-sm">{mockJobs.find(j => j.id === showPipelineConfirmModal)?.title}</p>
                  <p className="text-xs text-slate-500">{mockClients.find(c => c.id === mockJobs.find(j => j.id === showPipelineConfirmModal)?.clientId)?.name}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Initial Stage</label>
                    <div className="font-medium text-sm text-slate-800">Sourced</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Association Origin</label>
                    <div className="font-medium text-sm text-slate-800">Added from Candidate Match</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Candidate Source</label>
                    <div className="font-medium text-sm text-slate-800">{candidate.source} <span className="text-slate-400 font-normal">(Preserved)</span></div>
                  </div>
                </div>
             </div>
             <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setShowPipelineConfirmModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddToPipeline(showPipelineConfirmModal)} 
                  disabled={isAddingToPipeline}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {isAddingToPipeline ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding to Pipeline...
                    </>
                  ) : 'Confirm Addition'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal 
        isOpen={!!showScheduleInterviewModal} 
        onClose={() => setShowScheduleInterviewModal(null)} 
        initialCandidateId={candidate.id}
        initialJobId={showScheduleInterviewModal?.jobId}
      />

      {/* Candidate Screening Modal */}
      {showScreeningModal && (
        <CandidateScreeningModal
          applicationId={showScreeningModal}
          isOpen={true}
          onClose={() => setShowScreeningModal(null)}
          onProceedToInterview={() => {
            const app = applications.find(a => a.id === showScreeningModal);
            if (app) {
              setShowScheduleInterviewModal({ jobId: app.jobId });
            }
          }}
        />
      )}

      {/* Start Onboarding Confirmation Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">Start Onboarding</h3>
             </div>
             <div className="p-6">
                <p className="text-slate-600 text-sm mb-4">You are initiating the onboarding process for <strong>{candidate.fullName}</strong>.</p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Role</label>
                    <div className="font-medium text-sm text-blue-900">{mockJobs.find(j => j.id === showOnboardingModal.jobId)?.title}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Client</label>
                    <div className="font-medium text-sm text-blue-900">{mockClients.find(c => c.id === mockJobs.find(j => j.id === showOnboardingModal.jobId)?.clientId)?.name}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  This will create an onboarding record and update the candidate's hiring stage. The candidate's source ({candidate.source}) will be preserved.
                </p>
             </div>
             <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => setShowOnboardingModal(null)} 
                  disabled={isProcessing === showOnboardingModal.jobId}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmStartOnboarding} 
                  disabled={isProcessing === showOnboardingModal.jobId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing === showOnboardingModal.jobId ? 'Initiating...' : 'Start Onboarding'}
                </button>
             </div>
          </div>
        </div>
      )}
      {showRecordFeedbackModal && (
        <RecordInterviewFeedbackModal
          isOpen={!!showRecordFeedbackModal}
          onClose={() => setShowRecordFeedbackModal(null)}
          interview={interviews.find(i => i.id === showRecordFeedbackModal)!}
          candidateName={candidate.fullName}
        />
      )}
    </div>
  );
}
