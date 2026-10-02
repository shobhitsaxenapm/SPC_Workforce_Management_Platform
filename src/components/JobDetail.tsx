import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import { Briefcase, Building2, MapPin, Calendar, CheckCircle2, ChevronRight, Share, Eye, LayoutGrid, List, Search, UserPlus, FileText, Activity, Users, MoreVertical, ClipboardCheck, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ApplicationStage } from '../types';
import { useApp } from '../context/AppContext';
import JobMatchesTab from './JobMatchesTab';
import CandidateMatchProfileDrawer from './CandidateMatchProfileDrawer';
import JobFormModal from './JobFormModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import AddCandidateToJobModal from './AddCandidateToJobModal';
import ConfirmOfferAcceptanceModal from './ConfirmOfferAcceptanceModal';
import JobApplicantsTab from './JobApplicantsTab';
import CandidateScreeningModal from './CandidateScreeningModal';

export default function JobDetail() {
  const { id } = useParams();
  const { jobs, projects, clients, applications, candidates, offers, updateApplicationStage, matchRuns, runJobMatching, currentUser, addMatchToPipeline, updateJob, setQuickViewProjectId, setQuickViewCandidateId } = useApp();
  const job = jobs.find(j => j.id === id);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Applicants' | 'Matches' | 'Pipeline' | 'Activity'>('Overview');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);
  const [showScreeningModal, setShowScreeningModal] = useState<string | null>(null);
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
  
  if (!job) return <div>Job not found</div>;

  const req = projects.find(r => r.id === job.projectId);
  const client = clients.find(c => c.id === job.clientId);
  const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
  const jobApplications = applications.filter(a => a.jobId === job.id);
  const applicants = jobApplications.filter(a => a.source === 'SPC Careers Website');
  const pipelineApps = jobApplications.filter(a => !['New', 'Under Review', 'Application Rejected'].includes(a.currentStage));
  
  const progress = (job.filled / job.openings) * 100;

  const currentMatchRun = matchRuns.find(r => r.jobId === job.id);
  const activeMatches = currentMatchRun?.matches.filter(m => !m.dismissed) || [];
  
  const isJobActive = job.status !== 'Closed' && job.status !== 'On Hold';
  const canRunMatching = (currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.id === job.assignedRecruiterId) && isJobActive;
  const canAction = canRunMatching;

  const canonicalStages = ['Sourced', 'Screening', 'Interviewing', 'Selected', 'Rejected'] as const;

  const groupedApps: Record<string, typeof jobApplications> = {};
  canonicalStages.forEach(s => groupedApps[s] = []);
  
  let groupedCount = 0;
  pipelineApps.forEach(app => {
    let canonical = app.currentStage as string;
    if (canonical === 'Offered') {
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
      default: return ['Sourced', 'Screening', 'Interviewing', 'Selected', 'Rejected'];
    }
  };

  const updateStage = (appId: string, newStage: ApplicationStage) => {

    if (newStage === 'Rejected' || newStage === 'Withdrawn') {
       const reason = window.prompt(`Please provide a reason for marking as ${newStage}:`);
       if (reason === null) return; // Cancelled
       updateApplicationStage(appId, newStage, undefined, reason);
    } else {
       updateApplicationStage(appId, newStage);
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
                      onClick={() => updateJob(job.id, { isPublished: true, publishedAt: new Date().toISOString() })}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Publish Job
                    </button>
                  )}
                  {job.status === 'Open' && job.isPublished && (
                    <button 
                      onClick={() => updateJob(job.id, { isPublished: false })}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Unpublish Job
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
                      onClick={() => updateJob(job.id, { status: 'Open', isPublished: false })}
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
                      onClick={() => updateJob(job.id, { status: 'Open', isPublished: false })}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
                  <div className="flex items-center gap-3 mt-2 text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                    <span>•</span>
                    <span>{job.employmentType}</span>
                    <span>•</span>
                    <span>{job.experienceRange}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2 items-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium border",
                      job.status === 'Open' ? "bg-green-50 text-green-700 border-green-200" :
                      job.status === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      job.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                      "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {job.status}
                    </span>
                    {job.isPublished && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200">
                        Published
                      </span>
                    )}
                    {(() => {
                      if (job.status !== 'Open') return null;
                      const jobApps = applications.filter(a => a.jobId === job.id);
                      let latestActivity = job.publishedAt ? new Date(job.publishedAt).getTime() : 0;
                      jobApps.forEach(a => {
                        const act = new Date(a.lastActivity).getTime();
                        if (act > latestActivity) latestActivity = act;
                      });
                      if (latestActivity === 0) return null;
                      const now = new Date('2026-07-13T12:00:00Z').getTime();
                      const isDormant = (now - latestActivity) >= 15 * 24 * 60 * 60 * 1000;
                      if (isDormant) {
                        return <span className="px-3 py-1 rounded-full text-sm uppercase tracking-wider text-amber-700 font-semibold bg-amber-50 border border-amber-200 flex items-center gap-1" title="No Activity for 15+ Days"><AlertCircle className="w-3.5 h-3.5" /> Dormant</span>;
                      }
                      return null;
                    })()}
                  </div>
                  {job.status === 'On Hold' && job.holdReason && (
                    <span className="text-sm text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {job.holdReason}
                    </span>
                  )}
                  {job.status === 'Closed' && job.closeReason && (
                    <span className="text-sm text-slate-500 font-medium">
                      {job.closeReason}
                    </span>
                  )}
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Summary</h3>
                <p>{job.summary}</p>
                
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mt-6 mb-2">Responsibilities</h3>
                <ul>
                  {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mt-6 mb-2">Qualifications & Skills</h3>
                <div className="mb-3">
                  {job.qualifications.map((q, i) => <span key={i} className="block">• {q}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.requiredSkills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>


          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Job Progress</h3>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold text-slate-800">{job.filled}</div>
                <div className="text-sm font-medium text-slate-500 mb-1">of {job.openings} openings</div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500",
                    progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.max(progress, 2)}%` }}
                ></div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Applicants</span>
                  <span className="font-medium text-gray-800">{applicants.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Pipeline</span>
                  <span className="font-medium text-gray-800">
                    {pipelineApps.filter(a => a.currentStage !== 'Rejected' && a.currentStage !== 'Withdrawn' && a.currentStage !== 'Offer Declined').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Database Matches</span>
                  <span className="font-medium text-gray-800">{activeMatches.length}</span>
                </div>
                <div className="flex justify-between text-xs pb-2">
                  <span className="text-gray-400">Last Match Run</span>
                  <span className="text-gray-500">{currentMatchRun ? formatDate(currentMatchRun.timestamp) : 'Never'}</span>
                </div>
                
                {canRunMatching && (
                  <button 
                    onClick={handleRefreshMatches}
                    disabled={isRefreshing}
                    className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        {currentMatchRun ? 'Refreshing matches...' : 'Finding matches...'}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        {currentMatchRun ? 'Refresh Matches' : 'Find AI Matches'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Target Joining Date</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(job.targetJoiningDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Application Deadline</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(job.applicationDeadline)}</p>
                </div>
                <hr className="border-slate-100" />
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Linked Project</p>
                  <button onClick={() => req && setQuickViewProjectId(req.id)} className="text-sm font-medium text-blue-600 hover:underline outline-none">{req?.title}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 overflow-x-auto shadow-inner flex gap-6 min-h-[500px] w-full">
          {canonicalStages.map(stage => {
            const appsInStage = groupedApps[stage] || [];
            if ((stage as string) === 'Other' && appsInStage.length === 0) return null;
            return (
              <div key={stage} className="w-[320px] flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-semibold text-slate-700 text-sm">{stage}</h4>
                  <span className="bg-slate-200/70 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">{appsInStage.length}</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  {appsInStage.map(app => {
                    const candidate = candidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;
                    return (
                      <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
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
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{candidate.currentLocation} • {app.source}</p>
                        
                        {app.currentSubstate && app.currentSubstate !== 'Offer Issued (Delivery Pending)' && app.currentSubstate !== 'Application Received' && (
                          <div className="mb-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">{app.currentSubstate}</span>
                          </div>
                        )}
                        
                        {(app.currentStage === 'Selected' || app.currentStage === 'Offered') && (() => {
                           const activeOffer = getActiveOfferCase(app.id);
                           if (!activeOffer) return null;
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
                </div>
              </div>
            );
          })}
          </div>

          {jobApplications.filter(a => a.currentStage === 'Hired').length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Completed Outcomes
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {jobApplications.filter(a => a.currentStage === 'Hired').map(app => {
                  const candidate = candidates.find(c => c.id === app.candidateId);
                  if (!candidate) return null;
                  return (
                    <div key={app.id} className="w-[320px] flex-shrink-0 bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm relative">
                      <div className="flex justify-between items-start mb-2">
                          <button onClick={() => setQuickViewCandidateId(candidate.id)} className="font-semibold text-green-900 hover:text-green-700 truncate outline-none text-left mr-2">
                            {candidate.fullName}
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                            Hired
                          </span>
                      </div>
                      <p className="text-xs text-green-700 mb-1 truncate">{candidate.currentRole} • {candidate.totalExperience}</p>
                      <p className="text-xs text-green-600/70 flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{candidate.currentLocation}</p>
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
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Confirm Hold
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
          onProceedToInterview={() => {
            const app = jobApplications.find(a => a.id === showScreeningModal);
            if (app) {
              setScheduleCandidateId(app.candidateId);
            }
          }}
        />
      )}
    </div>
  );
}
