import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import { Briefcase, Building2, MapPin, Calendar, CheckCircle2, ChevronRight, Share, Eye, LayoutGrid, List, Search, UserPlus, FileText, Activity, Users, MoreVertical, ClipboardCheck, AlertCircle, Clock, UserX, DollarSign, Settings, History, X, XCircle, AlertTriangle, Send, Globe, EyeOff } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ApplicationStage, CANONICAL_SOURCES, Placement, HiringModel } from '../types';
import { useApp } from '../context/AppContext';
import { getHiringModelBadgeConfig, getPlacementBillingStatusConfig } from '../lib/hiringModelUtils';
import { getLatestInterviewForApplication, getInterviewFeedbackSummary, formatRoundSummaryForCard } from '../lib/interviewUtils';
import JobMatchesTab from './JobMatchesTab';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';
import JobFormModal from './JobFormModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import AddCandidateToJobModal from './AddCandidateToJobModal';
import ConfirmOfferAcceptanceModal from './ConfirmOfferAcceptanceModal';
import JobApplicantsTab from './JobApplicantsTab';
import CandidateScreeningModal from './CandidateScreeningModal';
import SourceBadge from './SourceBadge';
import ConfigureHiringModelModal from './ConfigureHiringModelModal';
import StartJoiningTrackingModal from './StartJoiningTrackingModal';
import ConfirmJoinedModal from './ConfirmJoinedModal';
import DidNotJoinModal from './DidNotJoinModal';
import PlacementBillingDrawer from './PlacementBillingDrawer';
import InterviewHistoryDrawer from './InterviewHistoryDrawer';
import JobOverviewTab from './JobOverviewTab';

export default function JobDetail() {
  const { id } = useParams();
  const { 
    jobs, 
    projects, 
    clients, 
    applications, 
    candidates, 
    offers, 
    interviews, 
    updateApplicationStage, 
    matchRuns, 
    runJobMatching, 
    currentUser, 
    addMatchToPipeline, 
    updateJob, 
    setQuickViewProjectId, 
    setQuickViewCandidateId, 
    createClientReviewBatch, 
    clientReviewBatches,
    placements 
  } = useApp();
  const job = jobs.find(j => j.id === id);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Applicants' | 'Matches' | 'Pipeline' | 'Activity'>('Overview');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);
  const [showScreeningModal, setShowScreeningModal] = useState<string | null>(null);
  
  // Hiring Model & Placement Billing states
  const [isConfigureHiringModelOpen, setIsConfigureHiringModelOpen] = useState(false);
  const [startTrackingAppId, setStartTrackingAppId] = useState<string | null>(null);
  const [confirmJoinedAppId, setConfirmJoinedAppId] = useState<string | null>(null);
  const [didNotJoinAppId, setDidNotJoinAppId] = useState<string | null>(null);
  const [selectedPlacementForBilling, setSelectedPlacementForBilling] = useState<Placement | null>(null);
  
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineSourceFilter, setPipelineSourceFilter] = useState('All');
  const [pipelineActionFilter, setPipelineActionFilter] = useState('All');
  const [pipelineRoundFilter, setPipelineRoundFilter] = useState('All');
  const [pipelineFeedbackFilter, setPipelineFeedbackFilter] = useState('All');
  const [historyDrawerAppId, setHistoryDrawerAppId] = useState<string | null>(null);
  
  const [isPreparingClientReview, setIsPreparingClientReview] = useState(false);
  const [selectedForClientReview, setSelectedForClientReview] = useState<string[]>([]);
  const [clientReviewMessage, setClientReviewMessage] = useState('');
  const [clientReviewSuccess, setClientReviewSuccess] = useState<{token: string, count: number, date: string} | null>(null);

  const [showSubmitClientReviewModal, setShowSubmitClientReviewModal] = useState(false);
  const [clientReviewCandidateToAdvance, setClientReviewCandidateToAdvance] = useState<{
    app: typeof applications[0];
    candidate: typeof candidates[0];
    targetStage: 'Interviewing' | 'Rejected';
  } | null>(null);
  const [stageChangePrompt, setStageChangePrompt] = useState<{
    appId: string;
    candidateName: string;
    newStage: 'Rejected' | 'Withdrawn';
  } | null>(null);
  const [stageChangeReason, setStageChangeReason] = useState('Technical Skills Not Aligned');
  const [stageChangeNotes, setStageChangeNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState<any>('Positions Filled/Placed');
  const [closeNote, setCloseNote] = useState('');
  
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState<any>('Client Hold');

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  
  if (!job) return <div>Job not found</div>;

  const req = projects.find(r => r.id === job.projectId);
  const client = clients.find(c => c.id === job.clientId);
  const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
  const jobApplications = applications.filter(a => a.jobId === job.id);
  const applicants = jobApplications.filter(a => 
    ['SPC Careers Website', 'LinkedIn', 'Naukri', 'Bulk Upload', 'Manual Upload'].includes(a.source) || 
    ['New', 'Under Review', 'Application Rejected'].includes(a.currentStage)
  );
  const pipelineApps = jobApplications.filter(a => !['New', 'Under Review', 'Application Rejected'].includes(a.currentStage));
  
  const progress = (job.filled / job.openings) * 100;

  const currentMatchRun = matchRuns.find(r => r.jobId === job.id);
  const activeMatches = currentMatchRun?.matches.filter(m => !m.dismissed) || [];
  
  const isJobActive = job.status !== 'Closed' && job.status !== 'On Hold';
  const canRunMatching = (currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.id === job.assignedRecruiterId) && isJobActive;
  const canAction = canRunMatching;

  const canonicalStages = ['Sourced', 'Screening', 'Client Review', 'Interviewing', 'Selected', 'Rejected', 'Withdrawn'] as const;

  const groupedApps: Record<string, typeof jobApplications> = {};
  canonicalStages.forEach(s => groupedApps[s] = []);
  
  let groupedCount = 0;
  pipelineApps.forEach(app => {
    let canonical = app.currentStage as string;
    if (['Offered', 'Offer', 'Joining Pending', 'Hired', 'Joined', 'Offer Accepted'].includes(canonical)) {
      canonical = 'Selected';
    }
    
    if (groupedApps[canonical]) {
        groupedApps[canonical].push(app);
    } else {
        // Fallback for any invalid stages
        groupedApps['Withdrawn'] = groupedApps['Withdrawn'] || [];
        groupedApps['Withdrawn'].push(app);
    }
    groupedCount++;
    if (!groupedApps[canonical] && process.env.NODE_ENV === 'development') {
        console.log(`Unmapped stage: ${app.currentStage} for app ${app.id}`);
    }
  });

  if (process.env.NODE_ENV === 'development' && groupedCount !== pipelineApps.length) {
     console.warn(`Pipeline mismatch: Job ${job.id} has ${pipelineApps.length} apps, but grouped ${groupedCount}`);
  }

  // Dynamic selectable stages based on current stage
  const getSelectableStages = (currentStage: ApplicationStage): ApplicationStage[] => {
    switch (currentStage) {
      case 'Rejected':
      case 'Withdrawn': return [currentStage, 'Sourced']; // Allow reopening
      default: return ['Sourced', 'Screening', 'Client Review', 'Interviewing', 'Selected', 'Rejected', 'Withdrawn'];
    }
  };

  const updateStage = (appId: string, newStage: ApplicationStage) => {
    const targetApp = applications.find(a => a.id === appId);
    const cand = candidates.find(c => c.id === targetApp?.candidateId);
    const candidateName = cand?.fullName || 'Candidate';

    if (newStage === 'Rejected' || newStage === 'Withdrawn') {
      setStageChangeReason(newStage === 'Rejected' ? 'Technical Skills Not Aligned' : 'Accepted Another Offer');
      setStageChangeNotes('');
      setStageChangePrompt({ appId, candidateName, newStage });
    } else {
      updateApplicationStage(appId, newStage);
      setToast({ message: `${candidateName} moved to ${newStage}.`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleConfirmStageChangePrompt = () => {
    if (!stageChangePrompt) return;
    const { appId, newStage, candidateName } = stageChangePrompt;
    const fullReason = stageChangeNotes.trim() ? `${stageChangeReason}: ${stageChangeNotes.trim()}` : stageChangeReason;
    updateApplicationStage(appId, newStage, undefined, fullReason);
    setToast({ message: `${candidateName} marked as ${newStage}.`, type: 'success' });
    setStageChangePrompt(null);
    setStageChangeNotes('');
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmSubmitClientReview = () => {
    const token = createClientReviewBatch({
      jobId: job.id,
      clientId: job.clientId,
      applicationIds: selectedForClientReview,
      targetCount: 10,
      message: clientReviewMessage
    });
    setClientReviewSuccess({ token, count: selectedForClientReview.length, date: new Date().toISOString() });
    setToast({ message: `Successfully submitted ${selectedForClientReview.length} candidate(s) to ${client?.name || 'client'}.`, type: 'success' });
    setIsPreparingClientReview(false);
    setSelectedForClientReview([]);
    setClientReviewMessage('');
    setShowSubmitClientReviewModal(false);
    setTimeout(() => setToast(null), 3500);
  };

  const handleConfirmAdvanceFromReview = (scheduleInterviewNow = false) => {
    if (!clientReviewCandidateToAdvance) return;
    const { app, candidate, targetStage } = clientReviewCandidateToAdvance;
    
    updateStage(app.id, targetStage);
    setClientReviewCandidateToAdvance(null);
    
    if (scheduleInterviewNow && targetStage === 'Interviewing') {
      setScheduleCandidateId(candidate.id);
    }
  };

  const handleRefreshMatches = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      runJobMatching(job.id);
      setIsRefreshing(false);
    }, 1000);
  };

  const getActiveOfferCase = (appId: string) => {
    const appOffers = offers.filter(o => o.applicationId === appId);
    if (appOffers.length === 0) return null;
    
    const caseMap = new Map<string, typeof offers[0]>();
    appOffers.forEach(o => {
      const caseId = o.parentOfferId || o.id;
      const existing = caseMap.get(caseId);
      if (!existing || (o.version || 1) > (existing.version || 1)) {
        caseMap.set(caseId, o);
      }
    });
    
    const cases = Array.from(caseMap.values());
    return cases[0] || null;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <Link to="/projects" className="text-slate-500 hover:text-slate-800">Reqs</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <button onClick={() => req && setQuickViewProjectId(req.id)} className="text-slate-500 hover:text-slate-800 outline-none focus-visible:underline">{req?.code}</button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 font-mono">{job.code}</span>
        </div>
        <div className="flex gap-2">
          {job.status === 'Draft' ? (
            <button 
              onClick={() => updateJob(job.id, { status: 'Open', isPublished: false })}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Open Job
            </button>
          ) : (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Edit Job
            </button>
          )}

          {job.status !== 'Draft' && (
            <div className="relative z-50" ref={actionMenuRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(!showActionMenu);
                }}
                className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm h-full"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 text-sm">
                  {job.status === 'Open' && !job.isPublished && (
                    <button 
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowPublishModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>{job.publishedAt ? 'Republish Job' : 'Publish Job'}</span>
                    </button>
                  )}
                  {job.status === 'Open' && job.isPublished && (
                    <button 
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowUnpublishModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      <span>Unpublish Job</span>
                    </button>
                  )}
                  {job.status === 'Open' && (
                    <button 
                      onClick={() => { setShowActionMenu(false); setShowHoldModal(true); }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Put on Hold
                    </button>
                  )}
                  {job.status === 'On Hold' && (
                    <button 
                      onClick={() => {
                        setShowActionMenu(false);
                        updateJob(job.id, { status: 'Open', isPublished: false });
                        setToast({ message: `Job "${job.title}" has been resumed.`, type: 'success' });
                        setTimeout(() => setToast(null), 3500);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Resume Job
                    </button>
                  )}
                  {(job.status === 'Open' || job.status === 'On Hold') && (
                    <button 
                      onClick={() => { setShowActionMenu(false); setShowCloseModal(true); }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Close Job
                    </button>
                  )}
                  {job.status === 'Closed' && (
                    <button 
                      onClick={() => {
                        setShowActionMenu(false);
                        updateJob(job.id, { status: 'Open', isPublished: false });
                        setToast({ message: `Job "${job.title}" reopened as Open (Unpublished).`, type: 'success' });
                        setTimeout(() => setToast(null), 3500);
                      }}
                      className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50"
                    >
                      Reopen Job
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('Overview')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'Overview' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <FileText className="w-4 h-4" /> Job Overview
        </button>
        <button 
          onClick={() => setActiveTab('Applicants')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'Applicants' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <List className="w-4 h-4" /> Applicants ({applicants.length})
        </button>
        <button 
          onClick={() => setActiveTab('Matches')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'Matches' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Users className="w-4 h-4" /> Matches ({activeMatches.length})
        </button>
        <button 
          onClick={() => setActiveTab('Pipeline')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'Pipeline' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <LayoutGrid className="w-4 h-4" /> Pipeline ({pipelineApps.length})
        </button>
        <button 
          onClick={() => setActiveTab('Activity')} 
          className={cn("px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'Activity' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Activity className="w-4 h-4" /> Activity
        </button>
      </div>

      {activeTab === 'Overview' && (
        <JobOverviewTab
          job={job}
          applications={applications}
          applicants={applicants}
          pipelineApps={pipelineApps}
          activeMatches={activeMatches}
          currentMatchRun={currentMatchRun}
          canRunMatching={canRunMatching}
          isRefreshing={isRefreshing}
          onRefreshMatches={handleRefreshMatches}
          onConfigureHiringModel={() => setIsConfigureHiringModelOpen(true)}
        />
      )}
      
      {activeTab === 'Applicants' && (
        <JobApplicantsTab jobId={job.id} applications={applicants} candidates={candidates} />
      )}

      {activeTab === 'Matches' && <JobMatchesTab job={job} />}

      {activeTab === 'Pipeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-semibold text-slate-800">Pipeline Board</h3>
            {['Closed', 'Filled', 'Cancelled', 'On Hold'].includes(job.status) ? (
              <div className="group relative">
                <button disabled className="px-4 py-2 bg-blue-100 text-blue-400 text-sm font-medium rounded-lg flex items-center gap-2 cursor-not-allowed">
                  <UserPlus className="w-4 h-4" /> Add Candidate
                </button>
                <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-xl z-10 text-center">
                  Cannot add candidates to a job that is {job.status}.
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAddCandidateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Add Candidate
              </button>
            )}
          </div>
          
          {clientReviewSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in shadow-sm mx-2">
              <div>
                <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Client review link created
                </h4>
                <p className="text-xs text-green-700 mt-1">
                  Submitted {clientReviewSuccess.count} candidate(s) on {formatDate(clientReviewSuccess.date)}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/client-review/${clientReviewSuccess.token}`}
                    className="w-full text-xs font-mono bg-white border border-green-200 text-green-900 rounded-md py-1.5 px-3 pr-16 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/client-review/${clientReviewSuccess.token}`);
                      alert('Link copied to clipboard!');
                    }}
                    className="absolute right-1 top-1 text-[10px] font-semibold bg-green-100 hover:bg-green-200 text-green-800 px-2 py-0.5 rounded transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
                <a 
                  href={`/client-review/${clientReviewSuccess.token}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <Share className="w-3.5 h-3.5" /> Open Client View
                </a>
              </div>
            </div>
          )}

          {/* Pipeline Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidates, role, skills..."
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                {pipelineSearch && (
                  <button
                    onClick={() => setPipelineSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Source:</label>
                <select
                  value={pipelineSourceFilter}
                  onChange={(e) => setPipelineSourceFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Sources</option>
                  {CANONICAL_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Action Required Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Action:</label>
                <select
                  value={pipelineActionFilter}
                  onChange={(e) => setPipelineActionFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Feedback Pending">Feedback Pending</option>
                  <option value="Screening Pending">Screening Pending</option>
                  <option value="Overdue">Overdue (&gt;7 days)</option>
                </select>
              </div>

              {/* Round Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Round:</label>
                <select
                  value={pipelineRoundFilter}
                  onChange={(e) => setPipelineRoundFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Rounds</option>
                  <option value="Round 1">Round 1</option>
                  <option value="Round 2">Round 2</option>
                  <option value="Round 3+">Round 3+</option>
                </select>
              </div>

              {/* Feedback Status Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Feedback:</label>
                <select
                  value={pipelineFeedbackFilter}
                  onChange={(e) => setPipelineFeedbackFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Feedback</option>
                  <option value="Not Due">Not Due</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Received">Received</option>
                </select>
              </div>

              {(pipelineSearch.trim() !== '' || pipelineSourceFilter !== 'All' || pipelineActionFilter !== 'All' || pipelineRoundFilter !== 'All' || pipelineFeedbackFilter !== 'All') && (
                <button
                  onClick={() => {
                    setPipelineSearch('');
                    setPipelineSourceFilter('All');
                    setPipelineActionFilter('All');
                    setPipelineRoundFilter('All');
                    setPipelineFeedbackFilter('All');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {(pipelineSearch.trim() !== '' || pipelineSourceFilter !== 'All' || pipelineActionFilter !== 'All' || pipelineRoundFilter !== 'All' || pipelineFeedbackFilter !== 'All') ? (
                <span>
                  Filtering active <span className="text-slate-400 font-normal">(stage counts unaltered)</span>
                </span>
              ) : (
                <span>{pipelineApps.length} in pipeline</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 overflow-x-auto shadow-inner flex gap-6 min-h-[500px] w-full">
          {canonicalStages.map(stage => {
            const appsInStage = groupedApps[stage] || [];
            if ((stage as string) === 'Other' && appsInStage.length === 0) return null;

            const visibleAppsInStage = appsInStage.filter(app => {
              const candidate = candidates.find(c => c.id === app.candidateId);
              if (!candidate) return false;

              if (pipelineSearch.trim()) {
                const q = pipelineSearch.trim().toLowerCase();
                const matchName = candidate.fullName.toLowerCase().includes(q);
                const matchRole = (candidate.currentRole || '').toLowerCase().includes(q);
                const matchEmail = (candidate.email || '').toLowerCase().includes(q);
                const matchSkills = (candidate.skills || []).some(s => s.toLowerCase().includes(q));
                if (!matchName && !matchRole && !matchEmail && !matchSkills) return false;
              }

              if (pipelineSourceFilter !== 'All' && app.source !== pipelineSourceFilter) {
                return false;
              }

              if (pipelineActionFilter !== 'All') {
                const isFeedbackPending = app.clientReviewStatus === 'Submitted' ||
                  app.clientReviewStatus === 'Feedback Pending' ||
                  interviews.some(i => i.applicationId === app.id && (i.status === 'Scheduled' || i.status === 'Completed') && i.feedbackStatus !== 'Submitted');
                
                const isScreeningPending = app.currentStage === 'Screening' && (!app.screeningData || app.screeningData.status === 'Pending' || app.screeningData.status === 'Requested Info');
                
                const lastAct = new Date(app.lastActivity || app.appliedDate).getTime();
                const isOverdue = (new Date('2026-07-13T12:00:00Z').getTime() - lastAct) >= 7 * 24 * 60 * 60 * 1000;
                
                const isActionRequired = isFeedbackPending || isScreeningPending || isOverdue ||
                  app.clientReviewStatus === 'More Info Requested' ||
                  (app.currentStage === 'Selected' && !app.offerCaseId);

                if (pipelineActionFilter === 'Action Required' && !isActionRequired) return false;
                if (pipelineActionFilter === 'Feedback Pending' && !isFeedbackPending) return false;
                if (pipelineActionFilter === 'Screening Pending' && !isScreeningPending) return false;
                if (pipelineActionFilter === 'Overdue' && !isOverdue) return false;
              }

              if (pipelineRoundFilter !== 'All') {
                const latestIv = getLatestInterviewForApplication(app.id, interviews);
                if (!latestIv) return false;
                const rNum = latestIv.roundNumber || 1;
                if (pipelineRoundFilter === 'Round 1' && rNum !== 1) return false;
                if (pipelineRoundFilter === 'Round 2' && rNum !== 2) return false;
                if (pipelineRoundFilter === 'Round 3+' && rNum < 3) return false;
              }

              if (pipelineFeedbackFilter !== 'All') {
                const latestIv = getLatestInterviewForApplication(app.id, interviews);
                if (!latestIv) return false;
                const fb = getInterviewFeedbackSummary(latestIv);
                if (fb.status !== pipelineFeedbackFilter) return false;
              }

              return true;
            });

            return (
              <div key={stage} className="w-[320px] flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-700 text-sm">{stage}</h4>
                    <span className="bg-slate-200/70 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">{appsInStage.length}</span>
                  </div>
                  
                  {stage === 'Client Review' && (
                    <button
                      onClick={() => setIsPreparingClientReview(!isPreparingClientReview)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded transition-colors",
                        isPreparingClientReview 
                          ? "bg-slate-700 text-white hover:bg-slate-800" 
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      )}
                    >
                      {isPreparingClientReview ? 'Cancel' : 'Prepare Client Submission'}
                    </button>
                  )}
                </div>
                
                {stage === 'Client Review' && isPreparingClientReview && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 mx-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-800">
                        {selectedForClientReview.length} of 10 selected
                      </span>
                      <button
                        disabled={selectedForClientReview.length === 0}
                        onClick={() => setShowSubmitClientReviewModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                    <textarea 
                      placeholder="Optional message to client..."
                      className="w-full text-xs p-2 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      rows={2}
                      value={clientReviewMessage}
                      onChange={e => setClientReviewMessage(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex-1 space-y-3">
                  {visibleAppsInStage.map(app => {
                    const candidate = candidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;
                    const isSelected = selectedForClientReview.includes(app.id);
                    const canSelect = app.clientReviewStatus !== 'Submitted';
                    
                    return (
                      <div key={app.id} className={cn(
                        "bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all group relative",
                        isSelected ? "border-blue-400 ring-1 ring-blue-400" : "border-slate-200"
                      )}>
                        {stage === 'Client Review' && isPreparingClientReview && (
                          <div className="absolute top-3 right-3 z-10">
                            <input 
                              type="checkbox"
                              disabled={!canSelect}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForClientReview(prev => [...prev, app.id]);
                                } else {
                                  setSelectedForClientReview(prev => prev.filter(id => id !== app.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <button onClick={() => setQuickViewCandidateId(candidate.id)} className="font-semibold text-slate-800 hover:text-blue-600 truncate mr-2 outline-none text-left">
                            {candidate.fullName}
                            </button>
                            {app.matchScore && (
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                    app.matchScore >= 90 ? "bg-green-100 text-green-700" :
                                    app.matchScore >= 75 ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-100 text-amber-700"
                                    )}>
                                    {app.matchScore}%
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mb-1 truncate">{candidate.currentRole} • {candidate.totalExperience}</p>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{candidate.currentLocation || 'Location not specified'}</span>
                          </span>
                          <SourceBadge source={app.source} compact />
                        </div>
                        
                        {app.currentStage === 'Client Review' && (() => {
                          const batch = clientReviewBatches.find(b => b.applicationIds.includes(app.id));
                          if (!batch) return null;
                          return (
                            <div className="mb-3 space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-700 text-xs">Client Review Batch</span>
                                <a href={`/client-review/${batch.token}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">Open Link <Share className="w-3 h-3"/></a>
                              </div>
                              <div className="text-[10px] text-slate-500">Submitted: {formatDate(batch.createdAt)}</div>
                              {app.clientReviewStatus && app.clientReviewStatus !== 'Submitted' && app.clientReviewStatus !== 'Feedback Pending' && (
                                <div className="pt-2 border-t border-slate-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded",
                                      app.clientReviewStatus === 'Shortlisted' ? 'bg-green-100 text-green-800' :
                                      app.clientReviewStatus === 'Client Rejected' ? 'bg-red-100 text-red-800' :
                                      app.clientReviewStatus === 'More Info Requested' ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'
                                    )}>{app.clientReviewStatus}</span>
                                    <span className="text-[10px] text-slate-500">{formatDate(app.lastActivity)}</span>
                                  </div>
                                  {app.clientReviewComment && (
                                    <div className="bg-white p-2 rounded border border-slate-100 mt-1.5 shadow-sm">
                                      <p className="text-[10px] text-slate-600 italic">"{app.clientReviewComment}"</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Secondary Substate / Model Status Badges */}
                        {(() => {
                          if (app.currentStage === 'Client Review') return null;

                          // For Client Hire under Selected stage
                          if (job.hiringModel === 'Client Hire' && app.currentStage === 'Selected') {
                            const plc = placements.find(p => p.applicationId === app.id);
                            if (app.currentSubstate === 'Joining Pending') {
                              return (
                                <div className="mb-3 space-y-1">
                                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-purple-600" />
                                    Joining Pending
                                  </span>
                                  {plc?.expectedJoiningDate && (
                                    <div className="text-[10px] text-purple-900 font-medium ml-0.5">
                                      Expected: {formatDate(plc.expectedJoiningDate)}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            if (app.currentSubstate === 'Did Not Join') {
                              return (
                                <div className="mb-3 space-y-1">
                                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 inline-flex items-center gap-1">
                                    <UserX className="w-3 h-3 text-amber-600" />
                                    Did Not Join
                                  </span>
                                  {plc?.didNotJoinReason && (
                                    <div className="text-[10px] text-amber-900 truncate max-w-[200px]" title={plc.didNotJoinReason}>
                                      {plc.didNotJoinReason}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="mb-3">
                                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                  Client Hire • Selected
                                </span>
                              </div>
                            );
                          }

                          // For SPC Hire under Selected / Offered
                          if ((job.hiringModel === 'SPC Hire' || !job.hiringModel) && (app.currentStage === 'Selected' || app.currentStage === 'Offered')) {
                            const activeOffer = getActiveOfferCase(app.id);
                            if (activeOffer) {
                              return (
                                <div className="mb-3 flex gap-2">
                                  <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {['Offer Draft', 'Pending Approval', 'Approved', 'Sent', 'Negotiating', 'Declined', 'Expired'].includes(activeOffer.status) 
                                      ? `Offer: ${activeOffer.status === 'Offer Draft' ? 'Draft' : activeOffer.status}` 
                                      : activeOffer.status}
                                  </span>
                                </div>
                              );
                            }
                          }

                          if (app.currentSubstate && app.currentSubstate !== 'Offer Issued (Delivery Pending)' && app.currentSubstate !== 'Application Received') {
                            return (
                              <div className="mb-3">
                                <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">{app.currentSubstate}</span>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        {/* Latest Round Summary & History Trigger */}
                        {(() => {
                          const latestIv = getLatestInterviewForApplication(app.id, interviews);
                          const roundSummaryText = latestIv ? formatRoundSummaryForCard(latestIv) : null;
                          if (!roundSummaryText) return null;

                          return (
                            <div className="mb-3 flex items-center justify-between gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
                              <span className={cn(
                                "text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 truncate",
                                latestIv?.status === 'Completed' ? "bg-emerald-100 text-emerald-800" :
                                latestIv?.status === 'No Show' ? "bg-amber-100 text-amber-900" :
                                latestIv?.status === 'Rescheduled' ? "bg-purple-100 text-purple-800" :
                                "bg-blue-100 text-blue-800"
                              )}>
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{roundSummaryText}</span>
                              </span>

                              <button
                                type="button"
                                aria-label="View interview history"
                                title="View interview history"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryDrawerAppId(app.id);
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors shrink-0 flex items-center gap-1 text-[11px] font-bold"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">History</span>
                              </button>
                            </div>
                          );
                        })()}

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(app.appliedDate)}</span>
                          
                          <div className="flex gap-2">
                            {(app.currentStage === 'Sourced' || app.currentStage === 'Screening') && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowScreeningModal(app.id); }}
                                className="px-2 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200 text-[10px] font-bold flex items-center gap-1"
                                title={app.currentStage === 'Sourced' ? 'Begin Screening' : 'Continue Screening'}
                              >
                                <ClipboardCheck className="w-3 h-3" />
                                {app.currentStage === 'Sourced' ? 'Begin Screening' : 'Continue Screening'}
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setScheduleCandidateId(candidate?.id || null); }}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                              title="Schedule Interview"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-2">
                              {(app.currentStage === 'Selected' || app.currentStage === 'Offered') && (() => {
                                // If unconfigured legacy job:
                                if (!job.hiringModel || job.hiringModel === 'Not Configured') {
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsConfigureHiringModelOpen(true);
                                      }}
                                      className="px-2 py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold border border-amber-300"
                                      title="Configure Hiring Model to proceed"
                                    >
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      Configure Model
                                    </button>
                                  );
                                }

                                // Branch 1: Client Hire post-selection workflow
                                if (job.hiringModel === 'Client Hire') {
                                  const isJoiningPending = app.currentSubstate === 'Joining Pending';
                                  const isDidNotJoin = app.currentSubstate === 'Did Not Join';

                                  return (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {!isJoiningPending && !isDidNotJoin && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setStartTrackingAppId(app.id);
                                          }}
                                          className="px-2 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold border border-purple-200"
                                          title="Start tracking client payroll joining"
                                        >
                                          <Clock className="w-3 h-3 text-purple-600" />
                                          Start Joining Tracking
                                        </button>
                                      )}

                                      {isJoiningPending && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmJoinedAppId(app.id);
                                            }}
                                            className="px-2 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold border border-emerald-200"
                                            title="Confirm Candidate Joined on Client Payroll"
                                          >
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            Confirm Joined
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDidNotJoinAppId(app.id);
                                            }}
                                            className="px-2 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold border border-amber-200"
                                            title="Record Candidate Did Not Join"
                                          >
                                            <UserX className="w-3 h-3 text-amber-600" />
                                            Did Not Join
                                          </button>
                                        </>
                                      )}

                                      {isDidNotJoin && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setStartTrackingAppId(app.id);
                                          }}
                                          className="px-2 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold border border-purple-200"
                                          title="Re-track Joining"
                                        >
                                          <Clock className="w-3 h-3 text-purple-600" />
                                          Re-track Joining
                                        </button>
                                      )}
                                    </div>
                                  );
                                }

                                // Branch 2: SPC Hire (preserve current Offers-module handoff)
                                const activeOffer = getActiveOfferCase(app.id);
                                const isTerminal = activeOffer && ['Declined', 'Expired', 'Withdrawn'].includes(activeOffer.status);
                                
                                return (
                                  <div className="flex items-center gap-2">
                                    {isTerminal && (
                                      <Link
                                        to="/offers"
                                        state={{
                                          candidateId: candidate.id,
                                          candidateName: candidate.fullName,
                                          jobId: job.id,
                                          jobTitle: job.title,
                                          clientId: job.clientId,
                                          projectId: job.projectId,
                                          applicationId: app.id,
                                          forceNewCase: true
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-2 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold border border-blue-200 block"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Prepare New Offer
                                      </Link>
                                    )}
                                    <Link
                                      to="/offers"
                                      state={!activeOffer ? {
                                        candidateId: candidate.id,
                                        candidateName: candidate.fullName,
                                        jobId: job.id,
                                        jobTitle: job.title,
                                        clientId: job.clientId,
                                        projectId: job.projectId,
                                        applicationId: app.id
                                      } : {
                                        openOfferId: activeOffer.id
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-2 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-medium border border-indigo-200 block"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {isTerminal ? 'View Previous Offer' : (activeOffer ? 'View Offer' : 'Initiate Offer')}
                                    </Link>
                                  </div>
                                );
                              })()}
                              {app.currentStage === 'Client Review' && app.clientReviewStatus === 'Shortlisted' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (candidate) {
                                      setClientReviewCandidateToAdvance({ app, candidate, targetStage: 'Interviewing' });
                                    }
                                  }}
                                  className="px-2 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors text-[10px] font-bold"
                                >
                                  Move to Interviewing
                                </button>
                              )}
                              
                              {app.currentStage === 'Client Review' && app.clientReviewStatus === 'Client Rejected' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (candidate) {
                                      setClientReviewCandidateToAdvance({ app, candidate, targetStage: 'Rejected' });
                                    }
                                  }}
                                  className="px-2 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors text-[10px] font-bold"
                                >
                                  Move to Rejected
                                </button>
                              )}
                              
                              <select 
                                className={cn(
                                  "text-xs border-slate-200 rounded-md text-slate-700 font-medium outline-none p-1.5 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-blue-100 transition-colors",
                                  app.currentStage === 'Screening' && "opacity-50 cursor-not-allowed"
                                )}
                                value={app.currentStage === 'Offered' ? 'Selected' : app.currentStage}
                                disabled={app.currentStage === 'Screening'}
                                onChange={(e) => {
                                  const newStage = e.target.value as ApplicationStage;
                                  if (newStage === 'Screening') {
                                    setShowScreeningModal(app.id);
                                  } else {
                                    updateStage(app.id, newStage);
                                  }
                                }}
                              >
                                {getSelectableStages(app.currentStage).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {appsInStage.length === 0 && (
                    <div className="h-28 rounded-xl border-2 border-dashed border-slate-200/70 bg-slate-50/50 flex flex-col items-center justify-center text-sm text-slate-400 gap-2">
                      <span className="font-medium">No Candidates</span>
                    </div>
                  )}

                  {appsInStage.length > 0 && visibleAppsInStage.length === 0 && (
                    <div className="h-28 rounded-xl border-2 border-dashed border-slate-200/70 bg-slate-50/50 flex flex-col items-center justify-center text-xs text-slate-400 gap-1 px-4 text-center">
                      <span className="font-medium">No Matching Candidates</span>
                      <span className="text-[11px] text-slate-400">Try adjusting your filters</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {jobApplications.filter(a => a.currentStage === 'Hired' || a.currentStage === 'Joined' || a.currentSubstate === 'Joined/Placed').length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Completed Outcomes
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {jobApplications.filter(a => a.currentStage === 'Hired' || a.currentStage === 'Joined' || a.currentSubstate === 'Joined/Placed').map(app => {
                  const candidate = candidates.find(c => c.id === app.candidateId);
                  if (!candidate) return null;
                  const plc = placements.find(p => p.applicationId === app.id);
                  const isClientHire = job.hiringModel === 'Client Hire' || (plc && plc.hiringModel === 'Client Hire');
                  const billingConfig = plc?.billingStatus ? getPlacementBillingStatusConfig(plc.billingStatus) : null;
                  const BillingIcon = billingConfig?.icon;

                  return (
                    <div key={app.id} className="w-[340px] flex-shrink-0 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <button onClick={() => setQuickViewCandidateId(candidate.id)} className="font-semibold text-emerald-950 hover:text-emerald-700 truncate outline-none text-left mr-2">
                            {candidate.fullName}
                          </button>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            Joined/Placed
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mb-1 truncate">{candidate.currentRole} • {candidate.totalExperience}</p>
                        <div className="flex items-center justify-between gap-1.5 mt-1">
                          <p className="text-xs text-emerald-700/80 flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{candidate.currentLocation}</p>
                          <SourceBadge source={app.source} compact />
                        </div>
                      </div>

                      {/* Client Hire Placement & Billing section */}
                      {isClientHire && plc && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {billingConfig && BillingIcon && (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                                billingConfig.badgeClass
                              )}>
                                <BillingIcon className="w-3 h-3" />
                                {billingConfig.label}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedPlacementForBilling(plc)}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-white hover:bg-purple-50 border border-purple-300 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                            Placement &amp; Billing
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Activity' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Activity log coming soon.
        </div>
      )}

      <CandidateMatchProfileDrawer 
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        candidate={candidates.find(c => c.id === selectedProfileId) || null}
        match={currentMatchRun?.matches.find(m => m.candidateId === selectedProfileId) || null}
      />

      <JobFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={job}
      />

      <ScheduleInterviewModal 
        isOpen={!!scheduleCandidateId}
        onClose={() => setScheduleCandidateId(null)}
        initialCandidateId={scheduleCandidateId || ''}
        initialJobId={job.id}
      />

      {showAddCandidateModal && (
        <AddCandidateToJobModal 
          jobId={job.id} 
          isOpen={showAddCandidateModal} 
          onClose={() => setShowAddCandidateModal(false)} 
          onSuccess={(msg) => {
            setToast({ message: msg, type: 'success' });
            setTimeout(() => setToast(null), 3500);
          }}
        />
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Close Job Opening</h2>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5 opacity-0" /> {/* Spacer */}
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-start gap-3">
                <p><strong>Warning:</strong> Closing this job will prevent any new applications, matching runs, or interview scheduling. Existing applicants and history will be preserved.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Close Reason <span className="text-red-500">*</span></label>
                <select 
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm bg-white"
                >
                  <option value="Positions Filled/Placed">Positions Filled/Placed</option>
                  <option value="Lost to Competitor">Lost to Competitor</option>
                  <option value="Client Cancelled">Client Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Optional Note</label>
                <textarea 
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm resize-none"
                  rows={3}
                  placeholder="Add any additional context here..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateJob(job.id, { 
                    status: 'Closed', 
                    isPublished: false,
                    closedAt: new Date().toISOString(),
                    closedBy: currentUser?.id,
                    closeReason,
                    closeNote
                  });
                  setShowCloseModal(false);
                  setToast({ message: `Job "${job.title}" has been closed.`, type: 'success' });
                  setTimeout(() => setToast(null), 3500);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm & Close Job
              </button>
            </div>
          </div>
        </div>
      )}

      {showHoldModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Put Job on Hold</h2>
              <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-start gap-3">
                <p><strong>Note:</strong> Placing this job on hold will hide it from the active pipeline but preserve all data.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hold Reason <span className="text-red-500">*</span></label>
                <select 
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm bg-white"
                >
                  <option value="Client Hold">Client Hold</option>
                  <option value="Internal Hold">Internal Hold</option>
                  <option value="Sourcing Difficulty">Sourcing Difficulty</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setShowHoldModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateJob(job.id, { 
                    status: 'On Hold', 
                    isPublished: false,
                    holdReason
                  });
                  setShowHoldModal(false);
                  setToast({ message: `Job "${job.title}" has been placed on hold.`, type: 'success' });
                  setTimeout(() => setToast(null), 3500);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Job Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100/70 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {job.publishedAt ? 'Republish Job Opening' : 'Publish Job Opening'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.code || job.id} &bull; {job.title}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Public Careers Portal Visibility</span>
                </div>
                <p className="text-emerald-700 leading-relaxed pl-6">
                  {job.publishedAt
                    ? `Republishing will make this opening visible again on the public Careers portal. The published date will be refreshed to today (${formatDate(new Date().toISOString())}) so candidates see it as a fresh opening.`
                    : 'Publishing this opening makes it immediately visible on the public Careers portal. Candidates will be able to search, view full role requirements, and submit job applications online.'}
                </p>
              </div>

              {job.firstPublishedAt && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Publication History</div>
                  <p>First published: {formatDate(job.firstPublishedAt)}</p>
                  {job.unpublishedAt && <p>Last unpublished: {formatDate(job.unpublishedAt)}</p>}
                </div>
              )}

              {/* Job Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{job.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {client?.name || 'Company Client'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {job.publishedAt ? 'Ready to Republish' : 'Ready to Publish'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location || 'Gurugram'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.employmentType || 'Full-time'} &bull; {job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                You can unpublish or pause this opening at any time without losing candidate applications, interview logs, or pipeline history.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const now = new Date().toISOString();
                  updateJob(job.id, { 
                    isPublished: true, 
                    publishedAt: now,
                    firstPublishedAt: job.firstPublishedAt || job.publishedAt || now,
                    unpublishedAt: undefined
                  });
                  setShowPublishModal(false);
                  setToast({ 
                    message: `"${job.title}" has been ${job.publishedAt ? 'republished' : 'published'} to the Careers Portal.`, 
                    type: 'success' 
                  });
                  setTimeout(() => setToast(null), 3500);
                }}
                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {job.publishedAt ? 'Confirm & Republish' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Job Confirmation Modal */}
      {showUnpublishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100/70 text-amber-700 rounded-xl border border-amber-200 shadow-sm">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Unpublish Job Opening</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.code || job.id} &bull; {job.title}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowUnpublishModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Hidden from Public Careers Portal</span>
                </div>
                <p className="text-amber-700 leading-relaxed pl-6">
                  Unpublishing will immediately remove this opening from public view on the Careers portal. Candidates will no longer be able to discover or apply for this role online.
                </p>
              </div>

              {/* Data Safety Note */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pipeline & Internal Sourcing Preserved</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All existing applicants ({applicants.length}), active pipeline candidates ({pipelineApps.length}), scheduled interviews, and AI database matches remain completely intact and active for your team to manage.
                </p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                You can republish this opening at any time whenever you are ready to receive public applications again.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setShowUnpublishModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Keep Published
              </button>
              <button 
                onClick={() => {
                  updateJob(job.id, { 
                    isPublished: false,
                    unpublishedAt: new Date().toISOString()
                  });
                  setShowUnpublishModal(false);
                  setToast({ 
                    message: `"${job.title}" has been unpublished from the Careers Portal.`, 
                    type: 'success' 
                  });
                  setTimeout(() => setToast(null), 3500);
                }}
                className="px-5 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Confirm & Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      {showScreeningModal && (
        <CandidateScreeningModal
          applicationId={showScreeningModal}
          isOpen={true}
          onClose={() => setShowScreeningModal(null)}
        />
      )}

      {isConfigureHiringModelOpen && (
        <ConfigureHiringModelModal
          isOpen={isConfigureHiringModelOpen}
          onClose={() => setIsConfigureHiringModelOpen(false)}
          job={job}
        />
      )}

      {startTrackingAppId && (() => {
        const targetApp = applications.find(a => a.id === startTrackingAppId);
        const cand = candidates.find(c => c.id === targetApp?.candidateId);
        if (!targetApp || !cand) return null;
        const plc = placements.find(p => p.applicationId === targetApp.id);
        return (
          <StartJoiningTrackingModal
            isOpen={!!startTrackingAppId}
            onClose={() => setStartTrackingAppId(null)}
            candidate={cand}
            job={job}
            applicationId={targetApp.id}
            initialExpectedDate={plc?.expectedJoiningDate}
            initialNotes={plc?.notes}
          />
        );
      })()}

      {confirmJoinedAppId && (() => {
        const targetApp = applications.find(a => a.id === confirmJoinedAppId);
        const cand = candidates.find(c => c.id === targetApp?.candidateId);
        if (!targetApp || !cand) return null;
        const plc = placements.find(p => p.applicationId === targetApp.id);
        return (
          <ConfirmJoinedModal
            isOpen={!!confirmJoinedAppId}
            onClose={() => setConfirmJoinedAppId(null)}
            candidate={cand}
            job={job}
            applicationId={targetApp.id}
            placement={plc}
          />
        );
      })()}

      {didNotJoinAppId && (() => {
        const targetApp = applications.find(a => a.id === didNotJoinAppId);
        const cand = candidates.find(c => c.id === targetApp?.candidateId);
        if (!targetApp || !cand) return null;
        const plc = placements.find(p => p.applicationId === targetApp.id);
        return (
          <DidNotJoinModal
            isOpen={!!didNotJoinAppId}
            onClose={() => setDidNotJoinAppId(null)}
            candidate={cand}
            job={job}
            applicationId={targetApp.id}
            placement={plc}
          />
        );
      })()}

      {selectedPlacementForBilling && (() => {
        const cand = candidates.find(c => c.id === selectedPlacementForBilling.candidateId);
        return (
          <PlacementBillingDrawer
            isOpen={!!selectedPlacementForBilling}
            onClose={() => setSelectedPlacementForBilling(null)}
            placement={selectedPlacementForBilling}
            candidate={cand}
            job={job}
          />
        );
      })()}

      {historyDrawerAppId && (
        <InterviewHistoryDrawer
          isOpen={!!historyDrawerAppId}
          onClose={() => setHistoryDrawerAppId(null)}
          applicationId={historyDrawerAppId}
          onScheduleNextRound={(candidateId, jobId, nextRoundNum) => {
            setScheduleCandidateId(candidateId);
            setHistoryDrawerAppId(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] animate-slide-in-right">
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium",
            toast.type === 'success' 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Submit to Client Review Confirmation Modal */}
      {showSubmitClientReviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Submit to Client Review</h3>
                  <p className="text-xs text-slate-500">Dispatch batch to client review portal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSubmitClientReviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                You are about to submit <strong className="text-slate-900">{selectedForClientReview.length} candidate(s)</strong> to <strong className="text-slate-900">{client?.name || 'the client'}</strong> for review.
              </p>

              {/* Candidates Selected Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selected Candidates ({selectedForClientReview.length})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {selectedForClientReview.map(appId => {
                    const app = applications.find(a => a.id === appId);
                    const cand = candidates.find(c => c.id === app?.candidateId);
                    if (!cand) return null;
                    return (
                      <div key={appId} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{cand.fullName}</span>
                        <span className="text-slate-500">{cand.currentRole || 'Candidate'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message to Client */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message for Client (Optional)
                </label>
                <textarea
                  value={clientReviewMessage}
                  onChange={e => setClientReviewMessage(e.target.value)}
                  placeholder="E.g., Please review these top shortlisted profiles for your initial review..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitClientReviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitClientReview}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Confirm & Submit to Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance / Reject from Client Review Confirmation Modal */}
      {clientReviewCandidateToAdvance && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold",
                  clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? 'Advance to Interviewing' : 'Move to Rejected'}
                  </h3>
                  <p className="text-xs text-slate-500">Post-client review transition</p>
                </div>
              </div>
              <button 
                onClick={() => setClientReviewCandidateToAdvance(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                {clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? (
                  <>The client shortlisted <strong className="text-slate-900">{clientReviewCandidateToAdvance.candidate.fullName}</strong>. Advance them to the Interviewing stage?</>
                ) : (
                  <>The client rejected <strong className="text-slate-900">{clientReviewCandidateToAdvance.candidate.fullName}</strong>. Move them to the Rejected stage?</>
                )}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div>Candidate: <span className="font-semibold text-slate-800">{clientReviewCandidateToAdvance.candidate.fullName}</span></div>
                <div>Client Status: <span className={cn(
                  "font-bold",
                  clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? "text-emerald-700" : "text-red-700"
                )}>{clientReviewCandidateToAdvance.app.clientReviewStatus || 'Reviewed'}</span></div>
                {clientReviewCandidateToAdvance.app.clientReviewFeedback && (
                  <div className="text-slate-600 italic mt-1">"{clientReviewCandidateToAdvance.app.clientReviewFeedback}"</div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClientReviewCandidateToAdvance(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              {clientReviewCandidateToAdvance.targetStage === 'Interviewing' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleConfirmAdvanceFromReview(false)}
                    className="px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    Move Stage Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmAdvanceFromReview(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    Move & Schedule Round 1
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmAdvanceFromReview(false)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  Confirm Rejection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Withdrawal Reason Capture Modal */}
      {stageChangePrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Mark as {stageChangePrompt.newStage}</h3>
                  <p className="text-xs text-slate-500">Record reason for stage transition</p>
                </div>
              </div>
              <button 
                onClick={() => setStageChangePrompt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Please specify a reason for marking <strong className="text-slate-900">{stageChangePrompt.candidateName}</strong> as <strong className="text-slate-900">{stageChangePrompt.newStage}</strong>:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason *
                </label>
                <select
                  value={stageChangeReason}
                  onChange={e => setStageChangeReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                >
                  {stageChangePrompt.newStage === 'Rejected' ? (
                    <>
                      <option value="Technical Skills Not Aligned">Technical Skills Not Aligned</option>
                      <option value="Culture / Communication Fit">Culture / Communication Fit</option>
                      <option value="Candidate Notice Period Unsuitable">Candidate Notice Period Unsuitable</option>
                      <option value="Candidate Compensation Expectations Mismatch">Candidate Compensation Expectations Mismatch</option>
                      <option value="Client Rejected Post-Interview">Client Rejected Post-Interview</option>
                      <option value="Failed Background / Reference Check">Failed Background / Reference Check</option>
                      <option value="Other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="Accepted Another Offer">Accepted Another Offer</option>
                      <option value="No Longer Interested in Role">No Longer Interested in Role</option>
                      <option value="Relocation / Location Constraint">Relocation / Location Constraint</option>
                      <option value="Personal / Family Reasons">Personal / Family Reasons</option>
                      <option value="Current Employer Retained / Counter-Offer">Current Employer Retained / Counter-Offer</option>
                      <option value="Unresponsive / Ghosted">Unresponsive / Ghosted</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={stageChangeNotes}
                  onChange={e => setStageChangeNotes(e.target.value)}
                  placeholder="Provide context or internal feedback..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStageChangePrompt(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStageChangePrompt}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm {stageChangePrompt.newStage}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
