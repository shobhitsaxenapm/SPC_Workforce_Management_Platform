import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  AlertCircle, 
  Plus, 
  FileText, 
  ChevronRight, 
  X, 
  CheckCircle2,
  List,
  Kanban,
  Activity,
  UserCheck,
  Search,
  Filter,
  Trash2,
  MoreVertical,
  Ban
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { JobVisibility, ApplicationStage, Priority, RequirementLifecycleStatus } from '../types';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import FilterPanel, { FilterField } from './FilterPanel';
import ClientRequirementFormModal from './ClientRequirementFormModal';
import SmartJobUpload from './SmartJobUpload';
import SmartJobReview from './SmartJobReview';
import { ExtractedJobData, JobSourceMetadata } from '../types';

export default function RequirementDetail() {
  const { id } = useParams();
  const { 
    requirements, 
    clients, 
    jobs, 
    candidates, 
    applications, 
    createJob, 
    updateApplicationStage,
    updateRequirementLifecycle,
    deleteRequirement
  } = useApp();

  const req = requirements.find(r => r.id === id);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'pipeline' | 'jobs' | 'activity'>('overview');
  
  // Modals state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [openActionMenu, setOpenActionMenu] = useState(false);

  // Smart Job State
  const [creationMode, setCreationMode] = useState<'manual' | 'smart' | null>(null);
  const [smartJobStep, setSmartJobStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedJobData | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceMetadata, setSourceMetadata] = useState<JobSourceMetadata | null>(null);

  const handleCloseCreateJobModal = () => {
    setIsCreateJobOpen(false);
    setCreationMode(null);
    setSmartJobStep('upload');
    setExtractedData(null);
    setSourceText('');
    setSourceMetadata(null);
  };

  // Job Form State
  const [jobFormData, setJobFormData] = useState({
    title: req?.roleTitle || '',
    location: req?.locations[0] || 'Delhi',
    openings: req ? Math.max(req.positionsRequired - req.positionsFilled, 1) : 1,
    experienceRange: '',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    applicationDeadline: '',
    visibility: 'Public' as JobVisibility
  });

  // Edit Requirement Form State
  const [editFormData, setEditFormData] = useState({
    title: req?.title || '',
    roleTitle: req?.roleTitle || '',
    projectName: req?.projectName || '',
    positionsRequired: req?.positionsRequired || 1,
    employmentType: req?.employmentType || 'Full-time',
    contractDuration: req?.contractDuration || '',
    targetJoiningDate: req?.targetJoiningDate || '',
    priority: req?.priority || 'Medium' as Priority,
    notes: req?.notes || ''
  });

  // Date/Filter States for Candidates Tab
  const [cSearch, setCSearch] = useState('');
  const [cPreset, setCPreset] = useState<DatePreset>('All Time');
  const [cStart, setCStart] = useState('');
  const [cEnd, setCEnd] = useState('');
  const [cFills, setCFills] = useState<Record<string, string>>({ jobId: '', stage: '', source: '' });
  const [cMatch, setCMatch] = useState<string>('All Matches');

  // Date/Filter States for Activity Tab
  const [aPreset, setAPreset] = useState<DatePreset>('All Time');
  const [aStart, setAStart] = useState('');
  const [aEnd, setAEnd] = useState('');
  const [aActionType, setAActionType] = useState('');

  if (!req) return <div className="p-8 text-center text-slate-500">Requirement not found</div>;

  const client = clients.find(c => c.id === req.clientId);
  const recruiter = mockUsers.find(u => u.id === req.assignedRecruiterId);
  const reqJobs = jobs.filter(j => j.requirementId === req.id);
  const reqApps = applications.filter(a => a.requirementId === req.id);

  // Fulfilment Calculation: Joined is filled, others are not
  const filledCount = reqApps.filter(a => a.currentStage === 'Joined').length;
  const remainingCount = Math.max(req.positionsRequired - filledCount, 0);
  const progress = (filledCount / req.positionsRequired) * 100;
  const isReadonly = req.lifecycleStatus === 'Closed' || req.lifecycleStatus === 'Cancelled';

  // Overview Counts
  const sourcedCount = reqApps.filter(a => a.currentStage === 'Sourced').length;
  const appliedCount = reqApps.filter(a => a.currentStage === 'Applied').length;
  const screeningCount = reqApps.filter(a => a.currentStage === 'Screening').length;
  const interviewingCount = reqApps.filter(a => ['Interview Round 1', 'Interview Round 2', 'Interview Scheduled', 'Interview Completed'].includes(a.currentStage)).length;
  const selectedCount = reqApps.filter(a => a.currentStage === 'Selected').length;
  const offeredCount = reqApps.filter(a => a.currentStage === 'Offer Extended' || a.currentStage === 'Offer Sent').length;
  const rejectedCount = reqApps.filter(a => a.currentStage === 'Rejected' || a.currentStage === 'Offer Declined').length;

  // Actions Awaiting Attention Alerts
  const alerts: string[] = [];
  
  // 1. Candidates awaiting feedback
  const feedbackAwaitingCount = reqApps.filter(a => ['Screening', 'Applied', 'Interview Round 1'].includes(a.currentStage)).length;
  if (feedbackAwaitingCount > 0) {
    alerts.push(`${feedbackAwaitingCount} candidate(s) are awaiting feedback or stage transitions.`);
  }

  // 2. Jobs with zero applicants
  const zeroAppJobs = reqJobs.filter(j => !applications.some(a => a.jobId === j.id));
  if (zeroAppJobs.length > 0) {
    alerts.push(`${zeroAppJobs.length} job(s) (${zeroAppJobs.map(j => j.title).join(', ')}) currently have zero applicants.`);
  }

  // 3. Unfilled positions remaining
  if (remainingCount > 0) {
    alerts.push(`${remainingCount} unfilled position(s) remaining under this requirement.`);
  }

  // 4. Target date approaching
  const targetDate = new Date(req.targetJoiningDate);
  const today = new Date('2026-07-13T12:00:00');
  const timeDiff = targetDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  if (daysDiff > 0 && daysDiff <= 7) {
    alerts.push(`Requirement target date is approaching in ${daysDiff} days (${formatDate(req.targetJoiningDate)}).`);
  }

  const handleCreateJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title || !jobFormData.location || jobFormData.openings < 1 || !jobFormData.requiredSkills || !jobFormData.summary) return;

    createJob({
      clientId: req.clientId,
      title: jobFormData.title.trim(),
      projectName: req.projectName,
      location: jobFormData.location,
      openings: jobFormData.openings,
      employmentType: req.employmentType,
      experienceRange: jobFormData.experienceRange || '0-2 Years',
      requiredSkills: jobFormData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: [],
      summary: jobFormData.summary,
      responsibilities: [],
      qualifications: [],
      targetJoiningDate: req.targetJoiningDate,
      applicationDeadline: jobFormData.applicationDeadline || req.targetJoiningDate,
      assignedRecruiterId: req.assignedRecruiterId,
      visibility: jobFormData.visibility,
      status: 'Published'
    }, req.id);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsCreateJobOpen(false);
      setCreationMode(null);
      setJobFormData({
        title: req.roleTitle, location: req.locations[0], openings: Math.max(req.positionsRequired - filledCount, 1),
        experienceRange: '', requiredSkills: '', preferredSkills: '', summary: '', applicationDeadline: '', visibility: 'Public'
      });
    }, 1500);
  };

  const toggleHold = () => {
    const nextStatus: RequirementLifecycleStatus = req.lifecycleStatus === 'On Hold' ? 'Open' : 'On Hold';
    updateRequirementLifecycle(req.id, nextStatus);
    triggerToast(nextStatus === 'On Hold' ? 'Requirement has been put on hold.' : 'Requirement has been resumed.');
    setIsHoldConfirmOpen(false);
  };

  // Candidates Tab Filters
  const cJobOptions = reqJobs.map(j => ({ value: j.id, label: j.title }));
  const cStageOptions = ['Sourced', 'Applied', 'Screening', 'Interview Round 1', 'Interview Round 2', 'Selected', 'Offer Extended', 'Joined', 'Rejected'].map(s => ({ value: s, label: s }));
  const cSourceOptions = ['SPC Careers Website', 'Referral', 'Job Portal', 'Email'].map(s => ({ value: s, label: s }));

  const cFilterFields: FilterField[] = [
    { key: 'jobId', label: 'Linked Job', options: cJobOptions },
    { key: 'stage', label: 'Hiring Stage', options: cStageOptions },
    { key: 'source', label: 'Sourcing Source', options: cSourceOptions },
  ];

  const filteredAppsWithoutMatch = reqApps.filter(app => {
    const candidate = candidates.find(c => c.id === app.candidateId);
    const job = reqJobs.find(j => j.id === app.jobId);
    
    const matchSearch = !cSearch || 
      candidate?.fullName.toLowerCase().includes(cSearch.toLowerCase()) ||
      candidate?.email.toLowerCase().includes(cSearch.toLowerCase()) ||
      candidate?.phone.includes(cSearch) ||
      candidate?.skills.some(s => s.toLowerCase().includes(cSearch.toLowerCase())) ||
      job?.title.toLowerCase().includes(cSearch.toLowerCase());
      
    const matchJob = !cFills.jobId || app.jobId === cFills.jobId;
    const matchStage = !cFills.stage || app.currentStage === cFills.stage;
    const matchSource = !cFills.source || app.source === cFills.source;
    const matchDate = isDateInPreset(app.appliedDate, cPreset, cStart, cEnd);

    return matchSearch && matchJob && matchStage && matchSource && matchDate;
  });

  const getMatchCount = (min: number, max: number) => {
    return filteredAppsWithoutMatch.filter(a => a.matchScore !== undefined && a.matchScore >= min && a.matchScore <= max).length;
  };

  const filteredApps = filteredAppsWithoutMatch.filter(app => {
    if (cMatch === 'All Matches') return true;
    const score = app.matchScore;
    if (score === undefined || score === null) return false;
    if (cMatch === '90%–100%') return score >= 90 && score <= 100;
    if (cMatch === '80%–89%') return score >= 80 && score <= 89;
    if (cMatch === '70%–79%') return score >= 70 && score <= 79;
    if (cMatch === '60%–69%') return score >= 60 && score <= 69;
    return false;
  });

  // Derived Activity Timeline
  const rawTimeline: { id: string; type: string; details: string; date: string; candidate?: string; job?: string }[] = [
    { id: 'act_1', type: 'Requirement Created', details: `Client Requirement for ${req.roleTitle} was successfully created.`, date: req.createdAt }
  ];

  if (req.revisions) {
    req.revisions.forEach((rev, idx) => {
      rawTimeline.push({
        id: `rev_${idx}`,
        type: 'Requirement Amended',
        details: `Amendment: ${rev.reason}`,
        date: rev.timestamp
      });
    });
  }

  reqJobs.forEach(job => {
    rawTimeline.push({
      id: `job_act_${job.id}`,
      type: 'Job Created',
      details: `Job opening "${job.title}" (${job.code}) was created and published.`,
      date: job.publishedAt || req.createdAt,
      job: job.title
    });
  });

  reqApps.forEach(app => {
    const candidate = candidates.find(c => c.id === app.candidateId);
    const job = reqJobs.find(j => j.id === app.jobId);
    
    if (candidate && job) {
      rawTimeline.push({
        id: `app_act_create_${app.id}`,
        type: 'Candidate Applied',
        details: `Candidate ${candidate.fullName} applied for ${job.title}.`,
        date: app.appliedDate,
        candidate: candidate.fullName,
        job: job.title
      });

      if (app.currentStage !== 'Applied') {
        rawTimeline.push({
          id: `app_act_stage_${app.id}`,
          type: 'Stage Transition',
          details: `${candidate.fullName} transitioned to stage "${app.currentStage}".`,
          date: app.lastActivity,
          candidate: candidate.fullName,
          job: job.title
        });
      }
    }
  });

  // Sort activities newest first
  const sortedTimeline = rawTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Filter activities
  const filteredTimeline = sortedTimeline.filter(act => {
    const matchType = !aActionType || act.type === aActionType;
    const matchDate = isDateInPreset(act.date, aPreset, aStart, aEnd);
    return matchType && matchDate;
  });

  // Kanban Pipeline Stages
  const pipelineStages: ApplicationStage[] = ['Sourced', 'Applied', 'Screening', 'Interview Round 1', 'Interview Round 2', 'Selected', 'Offer Extended', 'Joined', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 animate-slide-in text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast.message}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" onClick={() => setOpenActionMenu(false)}>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/clients" className="text-slate-500 hover:text-slate-800">Clients</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link to={`/clients/${client?.id}`} className="text-slate-500 hover:text-slate-800">{client?.name}</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 font-mono">{req.code}</span>
        </div>
        <div className="flex gap-2 relative" onClick={e => e.stopPropagation()}>
          {!isReadonly && (
            <>
              <button 
                onClick={() => setIsHoldConfirmOpen(true)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                {req.lifecycleStatus === 'On Hold' ? 'Resume Requirement' : 'Put On Hold'}
              </button>
              <button 
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Edit
              </button>
              <button 
                onClick={() => setIsCreateJobOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Job
              </button>
            </>
          )}
          <div className="relative">
             <button
                onClick={() => setOpenActionMenu(!openActionMenu)}
                className="p-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm bg-white"
             >
                <MoreVertical className="w-5 h-5" />
             </button>
             {openActionMenu && (
               <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 text-left">
                  {req.lifecycleStatus !== 'Cancelled' && req.lifecycleStatus !== 'Closed' && (
                     <button
                        onClick={() => { setOpenActionMenu(false); updateRequirementLifecycle(req.id, 'Cancelled'); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                     >
                        <Ban className="w-4 h-4" /> Cancel
                     </button>
                  )}
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                     onClick={() => { setOpenActionMenu(false); deleteRequirement(req.id); window.location.href = '/requirements'; }}
                     className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                     <Trash2 className="w-4 h-4" /> Delete
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Requirement Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">Business Profile</span>
            <h1 className="text-2xl font-bold text-slate-800">{req.title}</h1>
            <p className="text-slate-500 mt-1">{req.roleTitle} • {req.projectName}</p>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border",
            req.lifecycleStatus === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
            req.lifecycleStatus === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-200" :
            req.lifecycleStatus === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
            req.lifecycleStatus === 'Closed' ? "bg-green-50 text-green-700 border-green-200" :
            "bg-red-50 text-red-700 border-red-200"
          )}>
            {req.lifecycleStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Target Joining Date</p>
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              {formatDate(req.targetJoiningDate)}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Priority</p>
            <span className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold",
              req.priority === 'Critical' ? "text-red-700" :
              req.priority === 'High' ? "text-amber-700" :
              req.priority === 'Medium' ? "text-blue-700" :
              "text-slate-700"
            )}>
              {req.priority === 'Critical' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {req.priority}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Employment Type</p>
            <p className="text-slate-800 font-medium">{req.employmentType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Contract Duration</p>
            <p className="text-slate-800 font-medium">{req.contractDuration || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        {(['overview', 'candidates', 'pipeline', 'jobs', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap capitalize",
              activeTab === tab 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fulfillment Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Pipeline Status Details</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <div className="text-sm font-medium text-slate-500">Sourced</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{sourcedCount}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <div className="text-sm font-medium text-slate-500">Applied</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{appliedCount}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <div className="text-sm font-medium text-slate-500">Screening</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{screeningCount}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <div className="text-sm font-medium text-slate-500">Interviewing</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{interviewingCount}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <div className="text-sm font-medium text-slate-500">Offered</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{offeredCount}</div>
                </div>
              </div>
            </div>

            {/* Attention Required alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Attention Required</h3>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{alert}</span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-sm text-slate-500">No current issues or alerts pending verification.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Fulfilment Progress</h3>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold text-slate-800">{filledCount}</div>
                <div className="text-sm font-medium text-slate-500 mb-1">of {req.positionsRequired} Joined</div>
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
              <p className="text-sm text-slate-600 text-center">{remainingCount} positions remaining</p>
              
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center text-xs">
                <div>
                  <div className="text-slate-500">Selected</div>
                  <div className="font-semibold text-slate-800 mt-1">{selectedCount}</div>
                </div>
                <div>
                  <div className="text-slate-500">Offered</div>
                  <div className="font-semibold text-slate-800 mt-1">{offeredCount}</div>
                </div>
                <div>
                  <div className="text-slate-500">Rejected</div>
                  <div className="font-semibold text-slate-800 mt-1">{rejectedCount}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Assignment</h3>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                  {recruiter?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{recruiter?.name}</p>
                  <p className="text-xs text-slate-500">{recruiter?.role}</p>
                </div>
              </div>
              
              <h3 className="font-semibold text-slate-800 mb-3">Client</h3>
              <div className="flex flex-col gap-2">
                <Link to={`/clients/${client?.id}`} className="font-medium text-blue-600 hover:underline">{client?.name}</Link>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {client?.industry}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search candidates by name, email, role, or skills..." 
                  value={cSearch}
                  onChange={e => setCSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                />
              </div>
              <DateRangeFilter
                preset={cPreset}
                customStart={cStart}
                customEnd={cEnd}
                onChange={(preset, start, end) => {
                  setCPreset(preset);
                  setCStart(start);
                  setCEnd(end);
                }}
              />
              <select 
                value={cMatch}
                onChange={e => setCMatch(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700 font-medium"
              >
                <option value="All Matches">All Matches</option>
                <option value="90%–100%">90%–100% ({getMatchCount(90, 100)})</option>
                <option value="80%–89%">80%–89% ({getMatchCount(80, 89)})</option>
                <option value="70%–79%">70%–79% ({getMatchCount(70, 79)})</option>
                <option value="60%–69%">60%–69% ({getMatchCount(60, 69)})</option>
              </select>
              <FilterPanel
                fields={cFilterFields}
                values={cFills}
                onChange={(k, v) => setCFills({ ...cFills, [k]: v })}
                onClear={() => {
                  setCFills({ jobId: '', stage: '', source: '' });
                  setCPreset('All Time');
                  setCStart('');
                  setCEnd('');
                }}
              />
            </div>

            {cPreset !== 'All Time' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Applied Date: {cPreset === 'Custom' ? `${cStart || 'Any'} to ${cEnd || 'Any'}` : cPreset}
                  <button onClick={() => { setCPreset('All Time'); setCStart(''); setCEnd(''); }} className="hover:text-blue-950"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Hiring Stage</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Notice Period</th>
                    <th className="px-6 py-4">Sourcing Source</th>
                    <th className="px-6 py-4">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        {cMatch !== 'All Matches' 
                          ? "No candidates found in this match range." 
                          : "No candidates found matching the current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map(app => {
                      const candidate = candidates.find(c => c.id === app.candidateId);
                      const job = reqJobs.find(j => j.id === app.jobId);
                      if (!candidate) return null;
  
                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/candidates/${candidate.id}`} className="font-semibold text-blue-600 hover:underline">
                            {candidate.fullName}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5">{candidate.email}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {job?.title || 'Unknown Job'}
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={app.currentStage} 
                            onChange={e => updateApplicationStage(app.id, e.target.value as ApplicationStage)}
                            className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none"
                          >
                            {pipelineStages.map(stg => (
                              <option key={stg} value={stg}>{stg}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <span className="font-semibold text-emerald-600">{app.matchScore || 75}%</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {candidate.noticePeriod}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {app.source}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(app.appliedDate)}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 overflow-x-auto shadow-inner flex gap-4 min-h-[500px]">
          {pipelineStages.map(stage => {
            const appsInStage = reqApps.filter(a => a.currentStage === stage);
            return (
              <div key={stage} className="w-80 flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="font-semibold text-slate-700 text-sm">{stage}</h4>
                  <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">{appsInStage.length}</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  {appsInStage.map(app => {
                    const candidate = candidates.find(c => c.id === app.candidateId);
                    const job = reqJobs.find(j => j.id === app.jobId);
                    if (!candidate) return null;
                    return (
                      <div key={app.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <Link to={`/candidates/${candidate.id}`} className="font-medium text-slate-800 hover:text-blue-600 block mb-1">
                          {candidate.fullName}
                        </Link>
                        <p className="text-xs text-slate-500 mb-1">{job?.title}</p>
                        <p className="text-xs text-slate-400 mb-3">{candidate.currentRole} • {candidate.totalExperience}</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-400">Score: {app.matchScore}%</span>
                          <select 
                            className="text-xs border-slate-200 rounded text-slate-600 outline-none p-1 bg-white"
                            value={app.currentStage}
                            onChange={(e) => updateApplicationStage(app.id, e.target.value as ApplicationStage)}
                          >
                            {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {appsInStage.length === 0 && (
                    <div className="h-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Linked Jobs</h3>
            <span className="text-sm font-medium text-slate-500">{reqJobs.length} Job(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Job Code</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Positions</th>
                  <th className="px-6 py-4">Total Applicants</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reqJobs.map(job => {
                  const jobAppsCount = applications.filter(a => a.jobId === job.id).length;
                  const jobFilledCount = applications.filter(a => a.jobId === job.id && a.currentStage === 'Joined').length;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {job.title}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {job.code}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {job.location}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {jobFilledCount} / {job.openings} Filled
                      </td>
                      <td className="px-6 py-4 text-slate-850 font-medium">
                        {jobAppsCount} applicant(s)
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/job-desk/${job.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          View details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={aActionType}
              onChange={e => setAActionType(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none cursor-pointer"
            >
              <option value="">All Action Types</option>
              <option value="Requirement Created">Requirement Created</option>
              <option value="Requirement Amended">Requirement Amended</option>
              <option value="Job Created">Job Created</option>
              <option value="Candidate Applied">Candidate Applied</option>
              <option value="Stage Transition">Stage Transition</option>
            </select>
            <DateRangeFilter
              preset={aPreset}
              customStart={aStart}
              customEnd={aEnd}
              onChange={(preset, start, end) => {
                setAPreset(preset);
                setAStart(start);
                setAEnd(end);
              }}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {filteredTimeline.map(act => (
                <div key={act.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  <p className="text-sm font-medium text-slate-800">{act.type}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDate(act.date)}</p>
                </div>
              ))}
              {filteredTimeline.length === 0 && (
                <p className="text-sm text-slate-500 pl-4">No activities logged for the selected filter criteria.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {isCreateJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          
          {!creationMode && (
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Create Job from Requirement</h2>
                  <p className="text-slate-500 text-sm mt-1">Choose how you want to create this job.</p>
                </div>
                <button onClick={handleCloseCreateJobModal} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div 
                  onClick={() => setCreationMode('manual')}
                  className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 text-slate-500 group-hover:text-blue-600 transition-colors">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg mb-2">Create Manually</h3>
                  <p className="text-sm text-slate-500">Fill out the standard form manually for this requirement.</p>
                </div>

                <div 
                  onClick={() => setCreationMode('smart')}
                  className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">NEW - AI</div>
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 text-slate-500 group-hover:text-blue-600 transition-colors">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg mb-2">Upload Document</h3>
                  <p className="text-sm text-slate-500">Upload a JD (PDF, DOCX) to auto-extract details.</p>
                </div>
              </div>
            </div>
          )}

          {creationMode === 'smart' && smartJobStep === 'upload' && (
            <div className="relative w-full max-w-3xl">
              <button onClick={handleCloseCreateJobModal} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors z-10">
                <X className="w-5 h-5" />
              </button>
              <SmartJobUpload 
                onCancel={handleCloseCreateJobModal}
                onExtractionSuccess={(data, text, meta) => {
                  setExtractedData({...data, linkedClientRequirement: req.id});
                  setSourceText(text);
                  setSourceMetadata({...meta, extractionStatus: 'Success', uploadedBy: 'System', uploadedAt: new Date().toISOString(), parserVersion: 'gemini-1.5-flash'});
                  setSmartJobStep('review');
                }} 
              />
            </div>
          )}

          {creationMode === 'smart' && smartJobStep === 'review' && extractedData && sourceMetadata && (
             <div className="relative w-full max-w-7xl h-[90vh]">
               <SmartJobReview 
                 extractedData={extractedData}
                 sourceText={sourceText}
                 metadata={sourceMetadata}
                 onDiscard={handleCloseCreateJobModal}
                 onSaveAsDraft={() => {
                    setIsSuccess(true);
                    setTimeout(() => {
                      setIsSuccess(false);
                      handleCloseCreateJobModal();
                    }, 1500);
                 }}
               />
               {isSuccess && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                    <div className="text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-800">Draft Saved!</h3>
                    </div>
                  </div>
                )}
             </div>
          )}

          {creationMode === 'manual' && (
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Job from Requirement</h2>
              <button onClick={handleCloseCreateJobModal} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Job Created</h3>
                  <p className="text-slate-500">The job has been created and published successfully.</p>
                </div>
              ) : (
                <form id="createJobForm" onSubmit={handleCreateJobSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col gap-1 mb-2">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Inherited from Requirement</span>
                    <p className="text-sm text-slate-700 font-medium">{client?.name} • {req.projectName}</p>
                    <p className="text-xs text-slate-600">Target Date: {formatDate(req.targetJoiningDate)}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <input type="text" required value={jobFormData.title} onChange={e => setJobFormData({...jobFormData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                        <select required value={jobFormData.location} onChange={e => setJobFormData({...jobFormData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="">Select location...</option>
                          {req.locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
                        <input type="number" min="1" required value={jobFormData.openings} onChange={e => setJobFormData({...jobFormData, openings: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                        <input type="text" placeholder="e.g. 2-4 Years" value={jobFormData.experienceRange} onChange={e => setJobFormData({...jobFormData, experienceRange: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills *</label>
                        <input type="text" required placeholder="Comma separated..." value={jobFormData.requiredSkills} onChange={e => setJobFormData({...jobFormData, requiredSkills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Description</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary *</label>
                      <textarea required rows={4} value={jobFormData.summary} onChange={e => setJobFormData({...jobFormData, summary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"></textarea>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Publishing Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                        <select value={jobFormData.visibility} onChange={e => setJobFormData({...jobFormData, visibility: e.target.value as JobVisibility})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="Public">Public (Careers Page)</option>
                          <option value="Private">Private (Sourcing Only)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                        <input type="date" value={jobFormData.applicationDeadline} onChange={e => setJobFormData({...jobFormData, applicationDeadline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                type="button"
                onClick={handleCloseCreateJobModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              {!isSuccess && (
                <button 
                  type="submit"
                  form="createJobForm"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Publish Job
                </button>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* EDIT REQUIREMENT MODAL (REUSING SHARED COMPONENT) */}
      <ClientRequirementFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          // Only trigger if a change was actually saved... could be passed down, but for now it's ok.
        }}
        requirementIdToEdit={req.id}
      />

      {/* HOLD CONFIRMATION MODAL */}
      {isHoldConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {req.lifecycleStatus === 'On Hold' ? 'Resume Client Requirement' : 'Put Requirement On Hold'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {req.lifecycleStatus === 'On Hold' 
                ? 'Are you sure you want to resume this client requirement? The status will revert to Open and recruitment activities will resume.'
                : 'Are you sure you want to put this client requirement on hold? This will update its status immediately.'}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsHoldConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={toggleHold}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  req.lifecycleStatus === 'On Hold' ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {req.lifecycleStatus === 'On Hold' ? 'Resume Requirement' : 'Put On Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
