import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockJobs, mockClients, mockUsers } from '../data/mockData';
import { getMatchingJobsForCandidate } from '../data/mockCandidateJobInsights';
import { Mail, Phone, MapPin, Building2, Briefcase, FileText, Sparkles, AlertTriangle, MoreHorizontal, Check, X, Clock, Play, AlertCircle, Users, Calendar, Edit3, Download, ExternalLink } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Application } from '../types';
import { useApp } from '../context/AppContext';
import { getEasyTwoLineSummary } from '../lib/summaryHelper';
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
import ResumeModal from './ResumeModal';
import SourceBadge from './SourceBadge';

type TabType = 'Overview' | 'Matching Jobs' | 'Hiring Progress' | 'Activity';

interface ActionConfig {
  primary: string | null;
  secondary: string[];
  moreActions: string[];
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, applications, interviews, offers, onboardings, matchRuns, jobs, clients, clientReviewBatches, setQuickViewJobId, setQuickViewClientId, addMatchToPipeline, recordOfferResponse } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  
  const [dismissedMatches, setDismissedMatches] = useState<string[]>([]);
  const [showViewInterviewModal, setShowViewInterviewModal] = useState<{jobId: string, candidateId: string} | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState<string | null>(null);
  const [negotiationPrompt, setNegotiationPrompt] = useState<{ offerId: string; candidateName: string } | null>(null);
  const [negotiationNote, setNegotiationNote] = useState('');
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
  const [showDismissMatchModal, setShowDismissMatchModal] = useState<string | null>(null); // jobId
  const [showRecordFeedbackModal, setShowRecordFeedbackModal] = useState<string | null>(null); // interviewId
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // jobId
  
  // Filters for Matching Jobs
  const [locationFilter, setLocationFilter] = useState('');
  
  // On-demand matching state
  const [hasRunCandidateMatch, setHasRunCandidateMatch] = useState(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const handleRunCandidateMatches = () => {
    setIsRefreshingMatches(true);
    setTimeout(() => {
      setHasRunCandidateMatch(true);
      setIsRefreshingMatches(false);
    }, 1000);
  };

  // Expandable Timeline
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return <div className="p-8 text-center text-slate-500">Candidate not found</div>;

  // Existing Applications (directly from context)
  const existingCandidateApps = applications.filter(a => a.candidateId === candidate.id);
  const primaryActiveJobId = existingCandidateApps[0]?.jobId;
  const primaryActiveJob = jobs.find(j => j.id === primaryActiveJobId);
  const [aiSummaryLine1, aiSummaryLine2] = getEasyTwoLineSummary(candidate);

  const handleDownloadResume = () => {
    if (!candidate?.resumeUrl) return;
    try {
      const link = document.createElement('a');
      const href = candidate.resumeUrl.startsWith('http') || candidate.resumeUrl.startsWith('blob:')
        ? candidate.resumeUrl
        : `/${candidate.resumeUrl}`;
      link.href = href;
      link.download = candidate.resumeUrl.split('/').pop() || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: 'Resume download started.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: 'Failed to download resume file.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCopyResumeLink = () => {
    if (!candidate?.resumeUrl) return;
    const fullUrl = candidate.resumeUrl.startsWith('http')
      ? candidate.resumeUrl
      : `${window.location.origin}/${candidate.resumeUrl}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setToast({ message: 'Resume link copied to clipboard.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }).catch(() => {
      setToast({ message: 'Failed to copy link.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    });
  };
  
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
    if (job.status !== 'Open' || !job.isPublished) return false; 
    if (job.openings - job.filled <= 0) return false;

    if (locationFilter && job.location !== locationFilter) return false;


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
        if (activeOffer?.status === 'Offer Draft' || activeOffer?.status === 'Revised Draft') {
          primary = 'Continue Offer';
        } else if (activeOffer?.status === 'Offer Issued' || activeOffer?.status === 'Revised Offer Issued' || activeOffer?.status === 'Sent') {
          primary = 'View Offer';
        } else {
          primary = 'Initiate Offer';
        }
        break;
      case 'Offered':
        if (activeOffer?.status === 'Accepted' || substate === 'Offer Accepted') {
          primary = 'Start Onboarding';
        } else if (activeOffer?.status === 'Negotiating') {
          primary = 'Revise Offer';
          moreActions = ['View Offer'];
        } else if (activeOffer?.status === 'Offer Draft' || activeOffer?.status === 'Revised Draft') {
          primary = 'Continue Offer';
        } else if (activeOffer?.status === 'Offer Issued' || activeOffer?.status === 'Revised Offer Issued' || activeOffer?.status === 'Sent') {
          primary = 'View Offer';
          moreActions = ['Record Response', 'Record Negotiation'];
        } else {
          primary = 'Record Response';
        }
        break;
      case 'Joining Pending':
      case 'Hired/Placed':
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
      case 'Initiate Offer': {
        const offerJob = jobs.find(j => j.id === app.jobId);
        navigate('/offers', { 
          state: { 
            jobId: app.jobId, 
            candidateId: app.candidateId,
            applicationId: app.id,
            candidateName: candidate.fullName,
            jobTitle: offerJob?.title || 'Unknown Job',
            clientId: offerJob?.clientId,
            projectId: offerJob?.projectId,
            autoOpen: true 
          } 
        });
        break;
      }
      case 'Prepare Offer':
      case 'Continue Offer':
      case 'Revise Offer':
        setShowOfferPreparationModal(app.id);
        break;
      case 'Record Negotiation': {
        const appOffer = offers.filter(o => o.applicationId === app.id).pop();
        if (appOffer) {
          setNegotiationPrompt({ offerId: appOffer.id, candidateName: candidate.fullName });
        }
        break;
      }
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
    setShowDismissMatchModal(jobId);
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

    const appBatches = clientReviewBatches.filter(b => b.applicationIds.includes(app.id));
    appBatches.forEach(batch => {
      candidateActivities.push({
        id: `act-crb-${batch.id}-submit`,
        action: `Client-review batch submitted`,
        date: batch.createdAt,
        actor: 'Recruiter',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: 'Client Review'
      });
      candidateActivities.push({
        id: `act-crb-${batch.id}-link`,
        action: `Client-review link created`,
        date: batch.createdAt,
        actor: 'System',
        jobId: job?.id,
        jobTitle: relatedStr,
        stage: 'Client Review'
      });
      if (batch.viewedAt) {
        candidateActivities.push({
          id: `act-crb-${batch.id}-viewed`,
          action: `Client viewed the batch for the first time`,
          date: batch.viewedAt,
          actor: 'Client',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Client Review'
        });
      }
      if (batch.status === 'Submitted') {
        candidateActivities.push({
          id: `act-crb-${batch.id}-partial`,
          action: `Client submitted partial feedback`,
          date: app.lastActivity,
          actor: 'Client',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Client Review'
        });
      } else if (batch.status === 'Completed') {
        candidateActivities.push({
          id: `act-crb-${batch.id}-complete`,
          action: `Client completed the batch`,
          date: app.lastActivity,
          actor: 'Client',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Client Review'
        });
      }
      if (app.clientReviewStatus && !['Submitted', 'Feedback Pending', 'CV Shared'].includes(app.clientReviewStatus)) {
        candidateActivities.push({
          id: `act-crb-${batch.id}-decision-${app.id}`,
          action: `Client submitted a candidate decision: ${app.clientReviewStatus}`,
          date: app.lastActivity,
          actor: 'Client',
          jobId: job?.id,
          jobTitle: relatedStr,
          stage: 'Client Review'
        });
      }
    });

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

    const appInterviews = interviews.filter(i => i.applicationId === app.id);
    const appInterview = appInterviews.length > 0 
      ? [...appInterviews].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0] 
      : undefined;

    const appOffer = offers.filter(o => o.applicationId === app.id).pop();
    const lastActivity = (app as any).updatedAt || app.lastActivity || appOffer?.createdAt || appInterview?.createdAt || app.appliedDate;
    const isExpanded = expandedTimelineId === app.id;
    const insight = candidateInsights.find(i => i.jobId === app.jobId);

    const timelineStages = ['Added', 'Screening', 'Client Review', 'Interviewing', 'Selected', 'Offered', 'Hired', 'Joined'];
    const getStageIndex = (stage: string) => {
      if (['Rejected', 'Withdrawn'].includes(stage)) return -1;
      switch (stage) {
        case 'Sourced':
        case 'Applied': return 0;
        case 'Screening': return 1;
        case 'Client Review': return 2;
        case 'Interviewing': return 3;
        case 'Selected': return 4;
        case 'Offered': return 5;
        case 'Hired': return 6;
        case 'Joined': return 7;
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-slate-700">Application Source:</span>
                <SourceBadge source={app.source} compact />
                <span className="text-slate-400">•</span>
                <span>Added {formatDate(app.appliedDate)}</span>
                <span className="text-slate-400">•</span>
                <span>Recruiter: {recruiter?.name || 'Unassigned'}</span>
              </div>
              <p>Last Activity: {formatDate(lastActivity)}</p>
              {appInterview && currentStage === 'Interviewing' && (
                <p>
                  <span className="font-medium text-slate-600">Current Round: </span> 
                  {appInterview.roundName ? `${appInterview.roundName} ` : ''} 
                  {appInterview.interviewType ? `(${appInterview.interviewType})` : ''} 
                  <span className="text-slate-400 ml-1">• {new Date(appInterview.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {app.clientReviewStatus && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-amber-50 text-amber-700 border-amber-200">
                  {app.clientReviewStatus}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200">
                {currentStage}
              </span>
            </div>
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
              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1 origin-bottom-right">
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
              </div>
              <p className="text-slate-600 mt-1">{candidate.currentRole || 'No Role'} at {candidate.currentCompany || 'No Company'}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {candidate.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {candidate.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {candidate.currentLocation}</span>

                {candidate.resumeUrl && (
                  <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-50 text-xs text-slate-700 overflow-hidden shadow-2xs hover:border-slate-300 transition-colors">
                    <button
                      type="button"
                      onClick={() => setShowResumeModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      title="View original uploaded resume"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-800">{candidate.resumeUrl.split('/').pop() || 'Resume.pdf'}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      className="px-2 py-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 border-l border-slate-200 transition-colors"
                      title="Download Original PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!candidate.resumeUrl && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Resume</span>
              </button>
            )}
            <button 
              onClick={() => setIsEditModalOpen(true)} 
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto hide-scrollbar">
        <div className="flex gap-6 min-w-max px-2">
          {['Overview', 'Hiring Progress', 'Matching Jobs', 'Activity'].map(tab => {
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
          {/* Left Column: Recruiter Screening Baseline */}
          <div className="lg:col-span-1 space-y-6">
            {/* Screening & Compensation Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Screening & Compensation</h3>
                  <p className="text-xs text-slate-500">Recruiter screening baseline</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-xs"
                  title="Update screening & compensation details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Details
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <p className="text-xs font-medium text-slate-500 mb-1">Total Experience</p>
                  <p className="text-base font-bold text-slate-900">{candidate.totalExperience || '—'}</p>
                </div>

                {(() => {
                  const isShobhit = candidate.fullName?.toLowerCase().includes('shobhit');
                  const displayCurrentSalary = (!isShobhit && candidate.currentSalary && candidate.currentSalary !== '—' && candidate.currentSalary !== '-') ? candidate.currentSalary : '—';
                  const displayExpectedSalary = (!isShobhit && candidate.expectedSalary && candidate.expectedSalary !== '—' && candidate.expectedSalary !== '-') ? candidate.expectedSalary : '—';

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Current CTC</p>
                          <p className={cn("text-sm font-semibold", displayCurrentSalary !== '—' ? "text-slate-800" : "text-slate-400")}>
                            {displayCurrentSalary}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Expected CTC</p>
                          <p className={cn("text-sm font-semibold", displayExpectedSalary !== '—' ? "text-slate-800" : "text-slate-400")}>
                            {displayExpectedSalary}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Notice Period</p>
                          <p className={cn("text-sm font-semibold", candidate.noticePeriod ? "text-slate-800" : "text-slate-400")}>
                            {candidate.noticePeriod || '—'}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Availability</p>
                          <p className={cn("text-sm font-semibold", candidate.availableFrom ? "text-slate-800" : "text-slate-400")}>
                            {candidate.availableFrom ? formatDate(candidate.availableFrom) : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Current Role</p>
                          <p className="text-sm font-medium text-slate-800">{candidate.currentRole || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Current Company</p>
                          <p className="text-sm font-medium text-slate-800">{candidate.currentCompany || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Original Source</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <SourceBadge source={candidate.source} />
                          </div>
                        </div>
                      </div>

                      {(!candidate.currentSalary || !candidate.noticePeriod) && !isShobhit && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>Compensation or notice period omitted in resume. Click <strong>Edit Details</strong> above to record from recruiter screening call.</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Skills & Education Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Skills & Education</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">Core Skills</p>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/80 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">—</p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Highest Qualification</p>
                  <p className="text-sm font-medium text-slate-800">
                    {candidate.education || (candidate.educationEntries && candidate.educationEntries[0]?.qualification) || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Executive Summary & Experience Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Executive Summary - Easy Two-Liner */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-800">AI Executive Summary</h3>
                </div>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
                  2-Line Quick Overview
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-slate-50 p-4 rounded-xl border border-blue-100 text-sm text-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <p className="font-medium text-slate-900 leading-snug">
                    {aiSummaryLine1}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <p className="text-slate-700 leading-snug">
                    {aiSummaryLine2}
                  </p>
                </div>
              </div>
            </div>

            {/* Experience Analysis (AI) - Option A & Capped at 3 Stints */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Experience Analysis (AI)</h3>
                    <p className="text-xs text-slate-500">Domain strength & top employment stints (Capped at 3)</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  AI Analysis Active
                </span>
              </div>

              {/* Recent Employment Stints (Capped at 3) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Key Employment Stints ({Math.min(candidate.employmentHistory?.length || 0, 3)} of {candidate.employmentHistory?.length || 0})
                  </h4>
                </div>

                {candidate.employmentHistory && candidate.employmentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.employmentHistory.slice(0, 3).map((exp, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div>
                            <div>
                              <h5 className="font-semibold text-slate-900 text-sm">{exp.role}</h5>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                              <span className="font-medium text-slate-800 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {exp.company}
                              </span>
                              {exp.location && (
                                <span className="text-slate-400">• {exp.location}</span>
                              )}
                            </div>
                          </div>
                          <span className="self-start sm:self-auto text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>

                        {/* Strictly 1-Line Core Focus & Deliverables */}
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs flex items-start gap-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800">Core Focus &amp; Impact: </span>
                            <span className="text-slate-600 leading-relaxed">
                              {exp.aiAnalysis || (exp.responsibilities && exp.responsibilities[0]) || 'Proven execution and domain contributions.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No Employment Records Extracted</p>
                    <p className="text-xs text-slate-500 mt-1">You can add employment details manually via Edit Profile.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matching Jobs Tab */}
      {activeTab === 'Matching Jobs' && !hasRunCandidateMatch && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Matching Data</h3>
          <p className="text-slate-500 mb-4">Run the matching engine to find suitable jobs for this candidate.</p>
          <button 
            onClick={handleRunCandidateMatches} 
            disabled={isRefreshingMatches}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 inline-flex items-center justify-center gap-2"
          >
            {isRefreshingMatches ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Finding Matches...
              </>
            ) : (
              'Find AI Matches'
            )}
          </button>
        </div>
      )}

      {activeTab === 'Matching Jobs' && hasRunCandidateMatch && (
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
             <button 
                onClick={handleRunCandidateMatches} 
                disabled={isRefreshingMatches}
                className="px-4 py-2 bg-white border border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
              >
                {isRefreshingMatches ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh Matches'
                )}
              </button>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
          <Clock className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h3>
          <p className="text-slate-500 max-w-sm text-center">
            Detailed candidate activity tracking and audit logs will be available in a future update.
          </p>
        </div>
      )}

      {/* Modals */}
      <CandidateFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={candidate}
        isEditMode={true}
        targetJobTitle={primaryActiveJob?.title}
        isJobMatched={!!primaryActiveJob}
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
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Original Source</label>
                    <div className="font-medium text-sm text-slate-800 flex items-center gap-2">
                      <SourceBadge source={candidate.source} compact />
                      <span className="text-slate-400 font-normal">(Preserved)</span>
                    </div>
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

      {/* Dismiss Match Confirmation Modal */}
      {showDismissMatchModal && (() => {
        const targetJob = mockJobs.find(j => j.id === showDismissMatchModal);
        const targetClient = mockClients.find(c => c.id === targetJob?.clientId);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800">Dismiss Job Match</h3>
                <button onClick={() => setShowDismissMatchModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 text-sm">
                  Are you sure you want to dismiss the recommended match between <strong>{candidate.fullName}</strong> and:
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <p className="font-semibold text-slate-900 text-sm">{targetJob?.title || 'Job Opening'}</p>
                  <p className="text-xs text-slate-500">{targetClient?.name || 'Client'}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2.5 rounded-lg">
                  This role will be hidden from the candidate's active match recommendations. The candidate record remains intact.
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => setShowDismissMatchModal(null)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setDismissedMatches([...dismissedMatches, showDismissMatchModal]);
                    const jobTitle = targetJob?.title || 'Job';
                    setShowDismissMatchModal(null);
                    setToast({ message: `Match with "${jobTitle}" dismissed.`, type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                  }} 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Confirm Dismissal
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  This will create an onboarding record and update the candidate's hiring stage. The candidate's original source ({candidate.source}) will be preserved.
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

      {/* Record Negotiation Modal */}
      {negotiationPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">Record Negotiation</h3>
             </div>
             <div className="p-6">
                <p className="text-slate-600 text-sm mb-4">Record negotiation notes for <strong>{negotiationPrompt.candidateName}</strong>. This will set the offer status to "Negotiating" and allow you to revise the offer.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Negotiation Note / Reason</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    rows={3}
                    placeholder="E.g., Candidate requested higher base salary..."
                    value={negotiationNote}
                    onChange={(e) => setNegotiationNote(e.target.value)}
                  />
                </div>
             </div>
             <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => {
                    setNegotiationPrompt(null);
                    setNegotiationNote('');
                  }} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (negotiationNote.trim()) {
                      recordOfferResponse(negotiationPrompt.offerId, 'Continue Negotiation', negotiationNote);
                      setNegotiationPrompt(null);
                      setNegotiationNote('');
                    } else {
                      alert('Please enter a negotiation note.');
                    }
                  }} 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Note
                </button>
             </div>
          </div>
        </div>
      )}
      {showResumeModal && (
        <ResumeModal candidateId={candidate.id} onClose={() => setShowResumeModal(false)} />
      )}
    </div>
  );
}
