import React, { useState, useRef, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import { Plus, Search, MapPin, Briefcase, X, CheckCircle2, Settings } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Job, JobVisibility, JobStatus, HiringModel } from '../types';
import { getHiringModelBadgeConfig } from '../lib/hiringModelUtils';
import ConfigureHiringModelModal from './ConfigureHiringModelModal';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import SmartJobUpload from './SmartJobUpload';
import SmartJobReview from './SmartJobReview';
import InlineClientForm from './InlineClientForm';
import { getAllocatedOpenings, getUnallocatedPositions } from '../lib/headcount';
import { AlertTriangle, MoreVertical, AlertCircle } from 'lucide-react';
import { ExtractedJobData, JobSourceMetadata } from '../types';

export default function JobsList() {
  const { jobs, projects, clients, applications, createJob, updateJob, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilters, setJobFilters] = useState<Record<string, string>>({ status: '', clientId: '', isPublished: '', hiringModel: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToConfigure, setJobToConfigure] = useState<Job | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [creationMode, setCreationMode] = useState<'manual' | 'smart' | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLTableDataCellElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [jobToClose, setJobToClose] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState('Position Filled');
  const [closeNote, setCloseNote] = useState('');
  const navigate = useNavigate();
  const [smartJobStep, setSmartJobStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedJobData | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceMetadata, setSourceMetadata] = useState<JobSourceMetadata | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);

  // Form State
  const [selectedReqId, setSelectedReqId] = useState('none');
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    projectName: '',
    location: '',
    openings: 1,
    hiringModel: 'Client Hire' as HiringModel,
    employmentType: 'Contract',
    experienceRange: '0-2 Years',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    targetJoiningDate: '',
    applicationDeadline: '',
    visibility: 'Public' as JobVisibility,
  });

  const handleReqChange = (projectId: string) => {
    setSelectedReqId(projectId);
    setValidationError(null);

    if (projectId === 'none') {
      setFormData(prev => ({
        ...prev,
        title: '',
        clientId: '',
        projectName: '',
        assignedRecruiterId: '',
        location: '',
        openings: 1,
        hiringModel: 'Client Hire',
        employmentType: 'Contract',
      }));
    } else {
      const req = projects.find(r => r.id === projectId);
      if (req) {
        setFormData(prev => ({
          ...prev,
          title: req.title,
          clientId: req.clientId,
          projectName: req.projectName,
          location: req.locations[0] || 'Delhi',
          openings: Math.max(getUnallocatedPositions(req.id, req.totalRequestedHeadcount, jobs), 1),
          hiringModel: 'Client Hire',
          employmentType: 'Contract', // default as employmentType removed
        }));
      }
    }
  };

  const req = projects.find(r => r.id === selectedReqId);
  const clientForReq = req ? clients.find(c => c.id === req.clientId) : null;
  
  const totalRequested = req?.totalRequestedHeadcount || 0;
  const alreadyAllocated = req ? getAllocatedOpenings(req.id, jobs) : 0;
  const availableToAllocate = req ? getUnallocatedPositions(req.id, totalRequested, jobs) : 0;

  const handleCreateJob = (e: React.FormEvent, status: JobStatus) => {
    e.preventDefault();
    setValidationError(null);

    const title = formData.title.trim();
    const location = formData.location.trim();
    const openings = formData.openings;
    const requiredSkills = formData.requiredSkills.trim();
    const summary = formData.summary.trim();
    const targetJoiningDate = formData.targetJoiningDate;
    const applicationDeadline = formData.applicationDeadline;

    if (!title || !location || openings < 1 || !requiredSkills || !summary || !targetJoiningDate || !applicationDeadline) {
      setValidationError('Please fill in all mandatory fields (*).');
      return;
    }

    // Validation against selected project slots
    if (selectedReqId !== 'none') {
      if (openings > availableToAllocate) {
        setValidationError(`Only ${availableToAllocate} positions remain available under this Project. Reduce this Job's openings or update the Project headcount.`);
        return;
      }
    }

    // Convert comma-separated string to arrays
    const reqSkillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const prefSkillsArray = formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean);

    // Call Mutator
    const nowIso = new Date().toISOString();
    createJob({
      ...formData,
      hiringModel: formData.hiringModel,
      requiredSkills: reqSkillsArray,
      preferredSkills: prefSkillsArray,
      projectName: formData.projectName || formData.title,
      responsibilities: ['Support digitisation objectives', 'Validate source entries'],
      qualifications: ['Any Graduate'],
      assignedRecruiterId: formData.assignedRecruiterId || 'u3', // Default to u3 if none selected
      status,
      isPublished: status === 'Open',
      createdAt: nowIso,
      publishedAt: status === 'Open' ? nowIso : undefined,
      firstPublishedAt: status === 'Open' ? nowIso : undefined,
    }, selectedReqId);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setCreationMode(null);
      // Reset form
      setSelectedReqId('none');
      setFormData({
        title: '',
        clientId: '',
        projectName: '',
        location: '',
        openings: 1,
        hiringModel: 'Client Hire',
        employmentType: 'Contract',
        experienceRange: '0-2 Years',
        requiredSkills: '',
        preferredSkills: '',
        summary: '',
        targetJoiningDate: '',
        applicationDeadline: '',
        visibility: 'Public',
      });
    }, 1500);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCreationMode(null);
    setSmartJobStep('upload');
    setExtractedData(null);
    setSourceText('');
    setSourceMetadata(null);
    setShowClientForm(false);
  };

  const clientOptions = ([...new Set(jobs.map(j => j.clientId))] as string[]).map(cid => {
    const c = clients.find(cl => cl.id === cid);
    return { value: cid, label: (c?.name || cid) as string };
  });
  const jobFilterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Draft', 'Open', 'On Hold', 'Closed'].map(s => ({ value: s, label: s })) },
    { key: 'isPublished', label: 'Publication', options: [{ value: 'true', label: 'Published' }, { value: 'false', label: 'Unpublished' }] },
    { key: 'clientId', label: 'Client', options: clientOptions },
    {
      key: 'hiringModel',
      label: 'Hiring Model',
      options: [
        { value: 'Client Hire', label: 'Client Hire' },
        { value: 'SPC Hire', label: 'SPC Hire' },
        { value: 'Not Configured', label: 'Not Configured' }
      ]
    },
  ];

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    const jobTitle = job.title || job.projectName || '';
    const titleMatch = jobTitle.toLowerCase().includes(searchLower);
    const codeMatch = job.code.toLowerCase().includes(searchLower);
    const client = clients.find(c => c.id === job.clientId);
    const clientMatch = client?.name?.toLowerCase().includes(searchLower) || false;
    const matchSearch = !searchTerm || titleMatch || codeMatch || clientMatch;
    const matchStatus = !jobFilters.status || job.status === jobFilters.status;
    const matchPublished = !jobFilters.isPublished || (jobFilters.isPublished === 'true' ? job.isPublished === true : job.isPublished !== true);
    const matchClient = !jobFilters.clientId || job.clientId === jobFilters.clientId;
    const matchHiringModel = !jobFilters.hiringModel || (
      jobFilters.hiringModel === 'Not Configured'
        ? (!job.hiringModel || job.hiringModel === 'Not Configured')
        : job.hiringModel === jobFilters.hiringModel
    );
    const matchDate = isDateInPreset(job.publishedAt || job.createdAt || job.targetJoiningDate, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchPublished && matchClient && matchHiringModel && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage client-facing job openings linked to approved client projects.</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search jobs by title, client, or code..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <DateRangeFilter
            preset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
            onChange={(preset, start, end) => {
              setDatePreset(preset);
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />
          <FilterPanel
            fields={jobFilterFields}
            values={jobFilters}
            onChange={(k, v) => setJobFilters({ ...jobFilters, [k]: v })}
            onClear={() => {
              setJobFilters({ status: '', isPublished: '', clientId: '', hiringModel: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Published Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
              <button 
                onClick={() => {
                  setDatePreset('All Time');
                  setCustomStart('');
                  setCustomEnd('');
                }} 
                className="hover:text-blue-900 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[28%]">Job & Details</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">Client</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[14%]">Hiring Model</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[14%]">Fulfillment</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[13%]">Target Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[13%]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map(job => {
                const client = clients.find(c => c.id === job.clientId);
                const progress = (job.filled / job.openings) * 100;
                
                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer">
                    {/* 1. Job & Details */}
                    <td className="px-5 py-3.5">
                      <Link to={`/job-desk/${job.id}`} className="block group">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {job.title}
                          </p>
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
                            const isDormant = (now - latestActivity) >= 7 * 24 * 60 * 60 * 1000;
                            if (isDormant) {
                              return (
                                <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 shrink-0" title="No Activity for 7+ Days">
                                  <AlertCircle className="w-3 h-3 text-amber-600" /> Dormant
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 truncate">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/60 font-medium text-[11px]">
                            {job.code}
                          </span>
                          <span>•</span>
                          <span>{job.employmentType}</span>
                          {job.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {job.location}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    </td>

                    {/* 2. Client */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <p className="truncate font-medium text-slate-800 text-sm" title={client?.name}>
                          {client?.name || '—'}
                        </p>
                        {job.createdAt && (
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            Created {formatDate(job.createdAt)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Hiring Model */}
                    <td className="px-4 py-3.5">
                      {(() => {
                        const config = getHiringModelBadgeConfig(job.hiringModel);
                        const Icon = config.icon;
                        if (!config.isConfigured) {
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                                <Icon className="w-3 h-3 text-amber-600" />
                                Unconfigured
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setJobToConfigure(job);
                                }}
                                className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded transition-colors shadow-2xs"
                              >
                                Set
                              </button>
                            </div>
                          );
                        }
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            config.badgeClass
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* 4. Fulfillment */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-between text-xs mb-1.5 gap-2 max-w-[130px]">
                        <span className="font-semibold text-slate-800">{job.filled} / {job.openings}</span>
                        <span className="text-slate-400 text-[11px]">{job.openings - job.filled} rem</span>
                      </div>
                      <div className="w-full max-w-[130px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.max(progress, 3)}%` }}
                        />
                      </div>
                    </td>

                    {/* 5. Target Date */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium text-sm">
                          {job.targetJoiningDate ? formatDate(job.targetJoiningDate) : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Target Joining
                        </span>
                      </div>
                    </td>

                    {/* 6. Status & Publication */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
                          job.status === 'Open' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          job.status === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          job.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            job.status === 'Open' ? "bg-emerald-500" :
                            job.status === 'On Hold' ? "bg-amber-500" :
                            "bg-slate-400"
                          )} />
                          {job.status}
                        </span>

                        {job.isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium pl-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Live {job.publishedAt ? `• ${formatDate(job.publishedAt)}` : 'on Careers'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium pl-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {job.unpublishedAt || job.publishedAt ? 'Unpublished' : 'Not Published'}
                          </span>
                        )}

                        {job.status === 'On Hold' && job.holdReason && (
                          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" /> {job.holdReason}
                          </span>
                        )}
                        {job.status === 'Closed' && job.closeReason && (
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {job.closeReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No matching jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          
          {!creationMode && (
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Create Job Opening</h2>
                  <p className="text-slate-500 text-sm mt-1">Choose how you want to create this job.</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
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
                  <p className="text-sm text-slate-500">Fill out the standard form manually or from a linked project.</p>
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
                  <p className="text-sm text-slate-500">Upload a JD (PDF, DOCX) and let AI extract the details for you.</p>
                </div>
              </div>
            </div>
          )}

          {creationMode === 'smart' && smartJobStep === 'upload' && (
            <div className="relative w-full max-w-3xl">
              <button onClick={handleCloseModal} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors z-10">
                <X className="w-5 h-5" />
              </button>
              <SmartJobUpload 
                onCancel={handleCloseModal}
                onExtractionSuccess={(data, text, meta) => {
                  setExtractedData(data);
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
                 onDiscard={handleCloseModal}
                 onSaveAsDraft={() => {
                    setIsSuccess(true);
                    setTimeout(() => {
                      setIsSuccess(false);
                      handleCloseModal();
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Job Opening</h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
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
                  <p className="text-slate-500 text-sm">The job opening has been successfully saved.</p>
                </div>
              ) : (
                <form id="createJobForm" className="space-y-6">
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {validationError}
                    </div>
                  )}





                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Job details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.title} 
                          onChange={e => setFormData({...formData, title: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                        <select 
                          required 
                          value={formData.location} 
                          onChange={e => setFormData({...formData, location: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">Select location...</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Noida">Noida</option>
                          <option value="Gurugram">Gurugram</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                          Owner (Recruiter)
                        </label>
                        <select
                          value={formData.assignedRecruiterId}
                          onChange={(e) => setFormData({...formData, assignedRecruiterId: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">-- Select Owner --</option>
                          {mockUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                          ))}
                        </select>
                      </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                            {showClientForm ? (
                              <InlineClientForm 
                                onSuccess={(newClientId) => {
                                  setFormData({...formData, clientId: newClientId});
                                  setShowClientForm(false);
                                }}
                                onCancel={() => setShowClientForm(false)}
                              />
                            ) : (
                              <select 
                                required 
                                value={formData.clientId} 
                                onChange={(e) => {
                                  if (e.target.value === 'NEW') {
                                    setShowClientForm(true);
                                  } else {
                                    setFormData({...formData, clientId: e.target.value})
                                  }
                                }} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              >
                                <option value="">Select Client...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="NEW" className="font-bold text-blue-600 bg-blue-50">+ Create New Client</option>
                              </select>
                            )}
                          </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
                        <input 
                          type="number" 
                          min="1" 
                          required 
                          disabled={req ? availableToAllocate === 0 : false}
                          value={formData.openings} 
                          onChange={e => setFormData({...formData, openings: parseInt(e.target.value) || 0})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-400" 
                        />

                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Hiring Model *
                        </label>
                        <select 
                          value={formData.hiringModel} 
                          onChange={e => setFormData({...formData, hiringModel: e.target.value as HiringModel})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="Client Hire">Client Hire (Direct Client payroll &amp; placement billing)</option>
                          <option value="SPC Hire">SPC Hire (SPC workforce, offers &amp; onboarding)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                        <select 
                          value={formData.employmentType} 
                          onChange={e => setFormData({...formData, employmentType: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="Contract">Contract</option>
                          <option value="Full-time">Full-time</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Projects & Skills
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0-2 Years" 
                          value={formData.experienceRange} 
                          onChange={e => setFormData({...formData, experienceRange: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills * (Comma separated)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Excel, Data entry" 
                          value={formData.requiredSkills} 
                          onChange={e => setFormData({...formData, requiredSkills: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Skills (Comma separated)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Typing speed, healthcare" 
                          value={formData.preferredSkills} 
                          onChange={e => setFormData({...formData, preferredSkills: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Description
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary *</label>
                      <textarea 
                        required 
                        rows={3} 
                        value={formData.summary} 
                        onChange={e => setFormData({...formData, summary: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Joining details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Joining Date *</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.targetJoiningDate} 
                          onChange={e => setFormData({...formData, targetJoiningDate: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline *</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.applicationDeadline} 
                          onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              {!isSuccess && (
                <button 
                  type="submit" 
                  form="createJobForm" 
                  onClick={(e) => handleCreateJob(e, 'Open')}
                  disabled={req ? availableToAllocate === 0 : false}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  Create Job
                </button>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {showCloseModal && jobToClose && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Close Job Opening</h2>
              <button onClick={() => { setShowCloseModal(false); setJobToClose(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
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
                  <option value="Position Filled">Position Filled</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Client Requirement Withdrawn">Client Requirement Withdrawn</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Other">Other</option>
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
                onClick={() => { setShowCloseModal(false); setJobToClose(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateJob(jobToClose, { 
                    status: 'Closed', 
                    isPublished: false,
                    closedAt: new Date().toISOString(),
                    closedBy: currentUser?.id,
                    closeReason,
                    closeNote
                  });
                  setShowCloseModal(false);
                  setJobToClose(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm & Close Job
              </button>
            </div>
          </div>
        </div>
      )}

      {jobToConfigure && (
        <ConfigureHiringModelModal
          isOpen={!!jobToConfigure}
          onClose={() => setJobToConfigure(null)}
          job={jobToConfigure}
        />
      )}
    </div>
  );
}
