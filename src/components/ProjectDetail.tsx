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
  Ban,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Edit2,
  Eye,
  FileIcon
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { JobVisibility, ApplicationStage, ProjectStatus, EngagementType } from '../types';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import FilterPanel, { FilterField } from './FilterPanel';
import ProjectFormModal from './ProjectFormModal';
import SmartJobUpload from './SmartJobUpload';
import SmartJobReview from './SmartJobReview';
import { getAllocatedOpenings, getUnallocatedPositions } from '../lib/headcount';
import { ExtractedJobData, JobSourceMetadata } from '../types';

export default function ProjectDetail() {
  const { id } = useParams();
  const { 
    projects, 
    clients, 
    jobs, 
    candidates, 
    applications, 
    createJob, 
    updateApplicationStage,
    updateProjectStatus,
    deleteProject,
    setQuickViewClientId,
    setQuickViewCandidateId,
    setQuickViewJobId
  } = useApp();

  const proj = projects.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'agreement' | 'activity'>('overview');
  
  // Modals state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const totalRequested = proj?.totalRequestedHeadcount || 0;
  
  // Job Form State
  const [jobFormData, setJobFormData] = useState({
    title: proj?.projectName || '',
    location: proj?.locations[0] || 'Delhi',
    openings: proj ? Math.max(getUnallocatedPositions(proj.id, totalRequested, jobs), 1) : 1,
    experienceRange: '',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    applicationDeadline: '',
    assignedRecruiterId: '',
    visibility: 'Public' as JobVisibility
  });

  if (!proj) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
        <p className="text-slate-500 mt-2">The project you're looking for doesn't exist or has been deleted.</p>
        <Link to="/projects" className="mt-6 text-blue-600 hover:underline">Back to Projects</Link>
      </div>
    );
  }

  const client = clients.find(c => c.id === proj.clientId);
  const projectJobs = jobs.filter(j => j.projectId === proj.id);
  const allocatedPositions = getAllocatedOpenings(proj.id, jobs);
  const unallocatedPositions = getUnallocatedPositions(proj.id, proj.totalRequestedHeadcount, jobs);
  const projectApps = applications.filter(a => a.projectId === proj.id);
  const joinedCount = projectApps.filter(a => a.currentStage === 'Joined').length;
  
  const progressPercent = (joinedCount / proj.totalRequestedHeadcount) * 100;
  const isReadonly = proj.status === 'Completed' || proj.status === 'Cancelled';

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title || jobFormData.openings < 1 || !jobFormData.assignedRecruiterId) return;

    if (jobFormData.openings > unallocatedPositions) {
      alert(`Cannot allocate ${jobFormData.openings} positions. Only ${unallocatedPositions} unallocated positions remain for this project.`);
      return;
    }

    createJob({
      clientId: proj.clientId,
      projectName: proj.projectName,
      title: jobFormData.title,
      location: jobFormData.location,
      openings: jobFormData.openings,
      experienceRange: jobFormData.experienceRange,
      requiredSkills: jobFormData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: jobFormData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
      summary: jobFormData.summary,
      responsibilities: [],
      qualifications: [],
      targetJoiningDate: proj.targetJoiningDate,
      applicationDeadline: jobFormData.applicationDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      assignedRecruiterId: jobFormData.assignedRecruiterId,
      visibility: jobFormData.visibility,
      status: 'Published',
      engagementType: proj.engagementType
    }, proj.id);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      handleCloseCreateJobModal();
      triggerToast('Job created and linked successfully.');
      setActiveTab('jobs');
    }, 1500);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProjectStatus(proj.id, newStatus);
    setOpenActionMenu(false);
    triggerToast(`Project status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          <p className="font-medium text-sm">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-slate-700">{proj.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{proj.projectName}</h1>
            <span className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold border",
              proj.status === 'Active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
              proj.status === 'Draft' && "bg-slate-50 text-slate-700 border-slate-200",
              proj.status === 'On Hold' && "bg-amber-50 text-amber-700 border-amber-200",
              proj.status === 'Completed' && "bg-blue-50 text-blue-700 border-blue-200",
              proj.status === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
            )}>
              {proj.status}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
            <button 
              onClick={() => setQuickViewClientId(client?.id || '')}
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">{client?.name}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{proj.engagementType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{proj.locations.join(', ')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </button>
          
          {proj.status === 'Active' && (
            <button 
              onClick={() => setIsCreateJobOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Job
            </button>
          )}

          {proj.status === 'Draft' && (
            <button 
              onClick={() => handleStatusChange('Active')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <PlayCircle className="w-4 h-4" />
              Activate Project
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setOpenActionMenu(!openActionMenu)}
              className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {openActionMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
                <div className="py-1">
                  {proj.status === 'Active' && (
                    <button onClick={() => handleStatusChange('On Hold')} className="flex items-center w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50">
                      <PauseCircle className="w-4 h-4 mr-2" /> Put On Hold
                    </button>
                  )}
                  {proj.status === 'On Hold' && (
                    <button onClick={() => handleStatusChange('Active')} className="flex items-center w-full px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                      <PlayCircle className="w-4 h-4 mr-2" /> Resume
                    </button>
                  )}
                  {(proj.status === 'Active' || proj.status === 'On Hold') && (
                    <button onClick={() => handleStatusChange('Completed')} className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50">
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                    </button>
                  )}
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={() => handleStatusChange('Cancelled')} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Ban className="w-4 h-4 mr-2" /> Cancel Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'jobs', label: 'Linked Jobs', icon: Briefcase },
          { id: 'agreement', label: 'Agreement', icon: FileIcon },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 relative -mb-[1px]",
              activeTab === tab.id
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Headcount Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Headcount Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wider">Requested</p>
                      <p className="text-2xl font-bold text-blue-900">{proj.totalRequestedHeadcount}</p>
                    </div>
                    <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600 mb-1 uppercase tracking-wider">Allocated</p>
                      <p className="text-2xl font-bold text-indigo-900">{allocatedPositions}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Unallocated</p>
                      <p className="text-2xl font-bold text-slate-900">{unallocatedPositions}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-600 mb-1 uppercase tracking-wider">Joined / Fulfilled</p>
                      <p className="text-2xl font-bold text-emerald-900">{joinedCount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">Overall Fulfillment</span>
                      <span className="font-bold text-emerald-600">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Details */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Project Description</h3>
                </div>
                <div className="p-6">
                  {proj.projectDescription ? (
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{proj.projectDescription}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No description provided.</p>
                  )}
                  
                  {proj.notes && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-medium text-slate-800 mb-2">Internal Notes</h4>
                      <p className="text-sm text-slate-600 bg-amber-50 p-4 rounded-lg border border-amber-100">{proj.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Key Details Sidebar */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Target Mobilization Date</p>
                      <p className="text-sm font-medium text-slate-800">{proj.targetJoiningDate ? formatDate(proj.targetJoiningDate) : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Service Locations</p>
                      <p className="text-sm font-medium text-slate-800">{proj.locations.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Project Owner</p>
                      <p className="text-sm font-medium text-slate-800">{proj.projectOwner || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Client Contact</p>
                      <p className="text-sm font-medium text-slate-800">{proj.clientContactPerson || client?.primaryContactName}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Linked Jobs</span>
                    <span className="font-semibold text-slate-800">{projectJobs.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Active Candidates</span>
                    <span className="font-semibold text-slate-800">
                      {projectApps.filter(a => !['Rejected', 'Withdrawn'].includes(a.currentStage)).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Days Active</span>
                    <span className="font-semibold text-slate-800">
                      {Math.floor((Date.now() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Jobs Linked to Project</h3>
              {proj.status === 'Active' && (
                <button 
                  onClick={() => setIsCreateJobOpen(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Add Job
                </button>
              )}
            </div>
            
            {projectJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-3 uppercase tracking-wider text-xs">Job Title</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-xs">Location</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-xs">Positions (Alloc / Filled)</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-xs text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <Link to={`/job-desk/${job.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {job.title}
                          </Link>
                          <div className="text-xs text-slate-500">{job.code}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{job.location}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-800">{job.openings}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-600">{job.filled}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            job.status === 'Published' ? "bg-emerald-50 text-emerald-700" :
                            job.status === 'Draft' ? "bg-slate-100 text-slate-700" :
                            "bg-slate-50 text-slate-600"
                          )}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/job-desk/${job.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p>No jobs have been linked to this project yet.</p>
                {proj.status === 'Active' && (
                  <button 
                    onClick={() => setIsCreateJobOpen(true)}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    Create First Job
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'agreement' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl">
            <h3 className="font-semibold text-slate-800 mb-6">Agreement Details</h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-xs text-slate-500 mb-1">Agreement / Work Order Reference</p>
                <p className="text-sm font-medium text-slate-800">{proj.agreementReference || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Agreement Status</p>
                <span className={cn(
                  "inline-flex px-2 py-0.5 rounded text-xs font-medium border mt-0.5",
                  proj.agreementStatus === 'Signed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  {proj.agreementStatus || 'Draft'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-slate-800">{proj.agreementStartDate ? formatDate(proj.agreementStartDate) : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">End Date</p>
                <p className="text-sm font-medium text-slate-800">{proj.agreementEndDate ? formatDate(proj.agreementEndDate) : 'Not specified'}</p>
              </div>
              
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-medium text-slate-800 mb-3 border-b border-slate-100 pb-2">Uploaded Documents</h4>
                {proj.agreementDocumentMetadata ? (
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{proj.agreementDocumentMetadata.filename}</p>
                      <p className="text-xs text-slate-500">{(proj.agreementDocumentMetadata.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(proj.agreementDocumentMetadata.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Download</button>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500 bg-slate-50">
                    No agreement document uploaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-6">Project History</h3>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                <div>
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">Project Created</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(proj.createdAt)}</p>
                </div>
              </div>
              {proj.updatedAt !== proj.createdAt && (
                <div className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-300"></div>
                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">Project Details Updated</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(proj.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ProjectFormModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        projectIdToEdit={proj.id}
      />
      
      {/* Create Job Modals */}
      {isCreateJobOpen && creationMode === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Create Job Opening</h2>
                <p className="text-sm text-slate-500 mt-1">Select how you want to create a new job for this project.</p>
              </div>
              <button onClick={handleCloseCreateJobModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 grid sm:grid-cols-2 gap-6">
              <div 
                onClick={() => setCreationMode('smart')}
                className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Smart Extraction</h3>
                <p className="text-sm text-slate-500">Upload a JD or paste text to automatically extract job details.</p>
              </div>

              <div 
                onClick={() => setCreationMode('manual')}
                className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Create Manually</h3>
                <p className="text-sm text-slate-500">Fill out a standard form to create the job opening from scratch.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateJobOpen && creationMode === 'smart' && smartJobStep === 'upload' && (
        <SmartJobUpload
          onCancel={handleCloseCreateJobModal}
          onExtractionSuccess={(data, text, metadata) => {
            setExtractedData(data);
            setSourceText(text);
            setSourceMetadata(metadata);
            setSmartJobStep('review');
          }}
        />
      )}

      {isCreateJobOpen && creationMode === 'smart' && smartJobStep === 'review' && extractedData && (
        <SmartJobReview
          extractedData={extractedData}
          sourceText={sourceText}
          metadata={sourceMetadata!}
          onSaveAsDraft={handleCloseCreateJobModal}
          onDiscard={handleCloseCreateJobModal}
        />
      )}

      {isCreateJobOpen && creationMode === 'manual' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            {isSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Job Created</h2>
                <p className="text-slate-500">The job opening has been published successfully.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Create Job Opening</h2>
                    <p className="text-sm text-slate-500 mt-1">Linking to project: <span className="font-semibold text-slate-700">{proj.projectName}</span></p>
                  </div>
                  <button onClick={handleCloseCreateJobModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {unallocatedPositions <= 0 && (
                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">No Unallocated Positions</p>
                        <p>This project's headcount ({proj.totalRequestedHeadcount}) is fully allocated across existing jobs. You cannot create another job unless you increase the project headcount first.</p>
                      </div>
                    </div>
                  )}

                  <form id="createJobForm" onSubmit={handleCreateJob} className={`space-y-5 ${unallocatedPositions <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <input 
                          type="text" 
                          required
                          value={jobFormData.title}
                          onChange={e => setJobFormData({...jobFormData, title: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <input 
                          type="text"
                          value={jobFormData.location}
                          onChange={e => setJobFormData({...jobFormData, location: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1"
                            max={unallocatedPositions > 0 ? unallocatedPositions : 1}
                            required
                            value={jobFormData.openings}
                            onChange={e => setJobFormData({...jobFormData, openings: parseInt(e.target.value) || 1})}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-24" 
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            Max: {unallocatedPositions}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2-5 Years"
                          value={jobFormData.experienceRange}
                          onChange={e => setJobFormData({...jobFormData, experienceRange: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
                        <input 
                          type="text" 
                          placeholder="Comma separated"
                          value={jobFormData.requiredSkills}
                          onChange={e => setJobFormData({...jobFormData, requiredSkills: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                        <input 
                          type="date" 
                          value={jobFormData.applicationDeadline.split('T')[0]}
                          onChange={e => setJobFormData({...jobFormData, applicationDeadline: new Date(e.target.value).toISOString()})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Recruiter *</label>
                        <select
                          required
                          value={jobFormData.assignedRecruiterId}
                          onChange={e => setJobFormData({...jobFormData, assignedRecruiterId: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select Recruiter...</option>
                          {mockUsers.filter(u => u.role === 'RECRUITER' || u.role === 'MANAGER').map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary</label>
                        <textarea 
                          rows={3}
                          value={jobFormData.summary}
                          onChange={e => setJobFormData({...jobFormData, summary: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                        />
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-3 rounded-b-xl">
                  <button 
                    type="button" 
                    onClick={handleCloseCreateJobModal}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="createJobForm"
                    disabled={unallocatedPositions <= 0}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Create Job
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
