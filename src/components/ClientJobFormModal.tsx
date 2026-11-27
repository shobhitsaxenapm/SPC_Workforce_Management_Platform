import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  AlertTriangle,
  Building2,
  Lock,
  MapPin,
  Briefcase,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Client,
  JobStatus,
  JobVisibility,
  HiringModel,
  EngagementType,
  ExtractedJobData,
  JobSourceMetadata,
} from '../types';
import { mockUsers } from '../data/mockData';
import AiSparkleBadge from './AiSparkleBadge';
import { getAllocatedOpenings, getUnallocatedPositions } from '../lib/headcount';
import { cn, formatDate } from '../lib/utils';
import SmartJobUpload from './SmartJobUpload';
import SmartJobReview from './SmartJobReview';

interface ClientJobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onJobCreated?: () => void;
}

export default function ClientJobFormModal({
  isOpen,
  onClose,
  client,
  onJobCreated,
}: ClientJobFormModalProps) {
  const { projects, jobs, createJob, currentUser } = useApp();

  const [creationPath, setCreationPath] = useState<'selection' | 'smart' | 'manual'>('selection');
  const [smartJobStep, setSmartJobStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedJobData | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceMetadata, setSourceMetadata] = useState<JobSourceMetadata | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [savedStatus, setSavedStatus] = useState<JobStatus>('Open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);

  const clientProjects = projects.filter(
    p => p.clientId === client.id && p.status !== 'Completed' && p.status !== 'Cancelled'
  );

  const defaultLocation = client.locations?.[0] || 'Delhi';
  const defaultRecruiterId =
    currentUser?.role === 'RECRUITER' || currentUser?.role === 'MANAGER'
      ? currentUser.id
      : 'u3';

  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [formData, setFormData] = useState({
    title: '',
    projectName: '',
    location: defaultLocation,
    openings: 1,
    hiringModel: 'Client Hire' as HiringModel,
    employmentType: 'Full-time',
    experienceRange: '1-3 Years',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    responsibilities: '',
    qualifications: '',
    targetJoiningDate: '',
    applicationDeadline: '',
    assignedRecruiterId: defaultRecruiterId,
    visibility: 'Public' as JobVisibility,
  });

  useEffect(() => {
    if (isOpen) {
      setCreationPath('selection');
      setSmartJobStep('upload');
      setExtractedData(null);
      setSourceText('');
      setSourceMetadata(null);
      setSelectedProjectId('none');
      setFormData({
        title: '',
        projectName: '',
        location: client.locations?.[0] || 'Delhi',
        openings: 1,
        hiringModel: 'Client Hire',
        employmentType: 'Full-time',
        experienceRange: '1-3 Years',
        requiredSkills: '',
        preferredSkills: '',
        summary: '',
        responsibilities: '',
        qualifications: '',
        targetJoiningDate: '',
        applicationDeadline: '',
        assignedRecruiterId: defaultRecruiterId,
        visibility: 'Public',
      });
      setIsSuccess(false);
      setValidationError(null);
      setShowOpenConfirm(false);
    }
  }, [isOpen, client.id]);

  if (!isOpen) return null;

  const selectedProject =
    selectedProjectId !== 'none'
      ? clientProjects.find(p => p.id === selectedProjectId)
      : undefined;

  const totalRequested = selectedProject?.totalRequestedHeadcount || 0;
  const alreadyAllocated = selectedProject ? getAllocatedOpenings(selectedProject.id, jobs) : 0;
  const availableToAllocate = selectedProject
    ? Math.max(getUnallocatedPositions(selectedProject.id, totalRequested, jobs), 0)
    : Infinity;

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setValidationError(null);

    if (projectId === 'none') {
      setFormData(prev => ({
        ...prev,
        projectName: '',
        location: client.locations?.[0] || prev.location || 'Delhi',
      }));
    } else {
      const proj = clientProjects.find(p => p.id === projectId);
      if (proj) {
        const unalloc = Math.max(
          getUnallocatedPositions(proj.id, proj.totalRequestedHeadcount, jobs),
          1
        );
        const mappedHiringModel: HiringModel =
          proj.engagementType === 'Staffing – SPC Payroll' ? 'SPC Hire' : 'Client Hire';
        setFormData(prev => ({
          ...prev,
          title: prev.title || proj.projectName,
          projectName: proj.projectName,
          location: proj.locations?.[0] || client.locations?.[0] || prev.location,
          openings: unalloc,
          hiringModel: mappedHiringModel,
          employmentType:
            proj.engagementType === 'Staffing – SPC Payroll' ? 'Contract' : prev.employmentType,
          targetJoiningDate: proj.targetJoiningDate
            ? proj.targetJoiningDate.split('T')[0]
            : prev.targetJoiningDate,
        }));
      }
    }
  };

  const handleClose = () => {
    setCreationPath('selection');
    setSmartJobStep('upload');
    setExtractedData(null);
    setSourceText('');
    setSourceMetadata(null);
    setValidationError(null);
    setShowOpenConfirm(false);
    onClose();
  };

  const validateDraft = (): string | null => {
    if (!client.id) return 'Client is required.';
    if (!formData.title.trim()) return 'Job Title is required.';
    if (!formData.hiringModel) return 'Hiring Model is required.';
    if (!formData.openings || formData.openings < 1) {
      return 'Number of Openings must be at least 1.';
    }
    if (selectedProject && formData.openings > availableToAllocate) {
      return `Only ${availableToAllocate} positions remain available under project "${selectedProject.projectName}". Reduce this Job's openings or update the Project headcount.`;
    }
    if (formData.targetJoiningDate && formData.applicationDeadline) {
      const deadlineTime = new Date(formData.applicationDeadline).getTime();
      const joiningTime = new Date(formData.targetJoiningDate).getTime();
      if (!isNaN(deadlineTime) && !isNaN(joiningTime) && deadlineTime > joiningTime) {
        return 'Application Deadline cannot be later than the Target Joining Date.';
      }
    }
    return null;
  };

  const validateOpen = (): string | null => {
    const draftErr = validateDraft();
    if (draftErr) return draftErr;

    if (!formData.location.trim()) return 'Location is required.';
    if (!formData.assignedRecruiterId) return 'Assigned Recruiter (Owner) is required.';
    if (!formData.requiredSkills.trim()) {
      return 'At least one Required Skill is required before opening the job.';
    }
    if (!formData.summary.trim()) {
      return 'Job Summary is required before opening the job.';
    }
    if (!formData.targetJoiningDate) {
      return 'Target Joining Date is required.';
    }
    if (!formData.applicationDeadline) {
      return 'Application Deadline is required.';
    }

    const deadlineTime = new Date(formData.applicationDeadline).getTime();
    const joiningTime = new Date(formData.targetJoiningDate).getTime();
    if (!isNaN(deadlineTime) && !isNaN(joiningTime) && deadlineTime > joiningTime) {
      return 'Application Deadline cannot be later than the Target Joining Date.';
    }

    return null;
  };

  const saveJob = (status: 'Draft' | 'Open') => {
    setIsSubmitting(true);
    setSavedStatus(status);

    const nowIso = new Date().toISOString();
    const isPublished = status === 'Open' && formData.visibility === 'Public';
    const engagementType: EngagementType =
      selectedProject?.engagementType ||
      (formData.hiringModel === 'SPC Hire' ? 'Staffing – SPC Payroll' : 'Direct Recruitment');

    const reqSkillsArray = formData.requiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const prefSkillsArray = formData.preferredSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const responsibilitiesArray = formData.responsibilities
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const qualificationsArray = formData.qualifications
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    createJob(
      {
        clientId: client.id,
        title: formData.title.trim(),
        projectName: selectedProject?.projectName || formData.projectName || formData.title.trim(),
        location: formData.location.trim() || defaultLocation,
        openings: Number(formData.openings) || 1,
        engagementType,
        employmentType: formData.employmentType,
        hiringModel: formData.hiringModel,
        experienceRange: formData.experienceRange.trim() || '1-3 Years',
        requiredSkills: reqSkillsArray,
        preferredSkills: prefSkillsArray,
        summary: formData.summary.trim(),
        responsibilities:
          responsibilitiesArray.length > 0
            ? responsibilitiesArray
            : [`Execute core responsibilities for ${formData.title.trim()}`],
        qualifications:
          qualificationsArray.length > 0 ? qualificationsArray : ['Relevant Qualification'],
        targetJoiningDate: formData.targetJoiningDate
          ? new Date(formData.targetJoiningDate).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        assignedRecruiterId: formData.assignedRecruiterId || defaultRecruiterId,
        visibility: formData.visibility,
        status,
        isPublished,
        createdAt: nowIso,
        publishedAt: isPublished ? nowIso : undefined,
        firstPublishedAt: isPublished ? nowIso : undefined,
      },
      selectedProjectId
    );

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      onJobCreated?.();
      handleClose();
    }, 1200);
  };

  const handleSaveDraft = () => {
    const err = validateDraft();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    saveJob('Draft');
  };

  const handleOpenJobClick = () => {
    const err = validateOpen();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setShowOpenConfirm(true);
  };

  const confirmOpenJob = () => {
    saveJob('Open');
  };

  const suggestedLocations = Array.from(
    new Set([...(client.locations || []), 'Delhi', 'Noida', 'Gurugram', 'Mumbai', 'Remote'])
  );

  // Success State Modal
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {savedStatus === 'Draft' ? 'Job Saved as Draft' : 'Job Created & Linked'}
          </h2>
          <p className="text-slate-500 text-sm">
            The job opening has been linked to <strong>{client.name}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Smart Extraction Upload & Review Steps
  if (creationPath === 'smart' && smartJobStep === 'upload') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl">
          <SmartJobUpload
            onCancel={handleClose}
            onExtractionSuccess={(data, text, meta) => {
              setExtractedData(data);
              setSourceText(text);
              setSourceMetadata({
                ...meta,
                extractionStatus: 'Success',
                uploadedBy: currentUser?.name || 'System',
                uploadedAt: new Date().toISOString(),
                parserVersion: 'gemini-1.5-flash',
              });
              setSmartJobStep('review');
            }}
          />
        </div>
      </div>
    );
  }

  if (creationPath === 'smart' && smartJobStep === 'review' && extractedData && sourceMetadata) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="relative w-full max-w-7xl h-[90vh]">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <SmartJobReview
            extractedData={extractedData}
            sourceText={sourceText}
            metadata={sourceMetadata}
            defaultClientId={client.id}
            onDiscard={handleClose}
            onSaveAsDraft={() => {
              setSavedStatus('Draft');
              setIsSuccess(true);
              setTimeout(() => {
                onJobCreated?.();
                handleClose();
              }, 1200);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Create Job Opening</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3 h-3" />
                {client.name}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Create and link a new job opening directly under {client.name}.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {showOpenConfirm ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Confirm Job Activation &amp; Publication
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  Opening this Job will immediately link it to <strong>{client.name}</strong>, enable candidate pipeline &amp; AI matching workflows, and{' '}
                  {formData.visibility === 'Public'
                    ? 'publish it to the public Careers Portal.'
                    : 'keep it private for internal sourcing.'}
                </p>

                <div className="bg-white rounded-lg border border-amber-100 p-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <strong>Client:</strong> {client.name}
                  </p>
                  {selectedProject && (
                    <p>
                      <strong>Linked Project:</strong> {selectedProject.projectName} ({selectedProject.code})
                    </p>
                  )}
                  <p>
                    <strong>Job Title:</strong> {formData.title}
                  </p>
                  <p>
                    <strong>Hiring Model:</strong> {formData.hiringModel}
                  </p>
                  <p>
                    <strong>Employment Type:</strong> {formData.employmentType}
                  </p>
                  <p>
                    <strong>Openings:</strong> {formData.openings}
                  </p>
                  <p>
                    <strong>Location:</strong> {formData.location}
                  </p>
                  <p>
                    <strong>Target Joining Date:</strong> {formatDate(formData.targetJoiningDate)}
                  </p>
                  <p>
                    <strong>Application Deadline:</strong> {formatDate(formData.applicationDeadline)}
                  </p>
                  <p>
                    <strong>Assigned Recruiter:</strong>{' '}
                    {mockUsers.find(u => u.id === formData.assignedRecruiterId)?.name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOpenConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  onClick={confirmOpenJob}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Job...' : 'Confirm & Open Job'}
                </button>
              </div>
            </div>
          ) : creationPath === 'selection' ? (
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto py-8">
              <div
                onClick={() => setCreationPath('smart')}
                className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <AiSparkleBadge className="absolute top-3 right-3 ml-0" />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Upload JD Document</h3>
                <p className="text-sm text-slate-500">
                  Upload a Job Description (PDF, DOCX, TXT) and let AI extract the details linked to {client.name}.
                </p>
              </div>

              <div
                onClick={() => setCreationPath('manual')}
                className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Create Manually</h3>
                <p className="text-sm text-slate-500">
                  Enter the job opening, hiring model, skills, and delivery details manually.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Section 1: Basic & Client Mapping */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Basic Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Locked Client Field */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>
                        Client <span className="text-red-500">*</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-normal">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Locked to selected client
                      </span>
                    </label>
                    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{client.name}</span>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          client.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}
                      >
                        {client.status}
                      </span>
                    </div>
                  </div>

                  {/* Optional Client Project Link */}
                  {clientProjects.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Link to Client Project / Requirement{' '}
                        <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={selectedProjectId}
                        onChange={e => handleProjectChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="none">-- Direct Client Job (No Specific Project) --</option>
                        {clientProjects.map(p => {
                          const rem = Math.max(
                            getUnallocatedPositions(p.id, p.totalRequestedHeadcount, jobs),
                            0
                          );
                          return (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.projectName} ({rem} of {p.totalRequestedHeadcount} positions unallocated)
                            </option>
                          );
                        })}
                      </select>

                      {selectedProject && (
                        <div
                          className={cn(
                            'mt-2 p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2',
                            availableToAllocate === 0
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-blue-50/60 border-blue-200 text-blue-900'
                          )}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <Briefcase className="w-4 h-4 shrink-0" />
                            <span>
                              Project Headcount: <strong>{totalRequested}</strong> requested •{' '}
                              <strong>{alreadyAllocated}</strong> allocated •{' '}
                              <strong>{availableToAllocate}</strong> remaining
                            </span>
                          </div>
                          {availableToAllocate === 0 && (
                            <span className="text-amber-700 font-semibold">
                              All project positions are currently allocated.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Job Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Data Entry Operator, Warehouse Supervisor"
                    />
                  </div>

                  {/* Hiring Model Radio Cards (following ProjectFormModal pattern) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hiring Model <span className="text-red-500">*</span>
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3 mt-1">
                      <label
                        className={cn(
                          'border rounded-lg p-3 cursor-pointer flex flex-col gap-1 transition-colors',
                          formData.hiringModel === 'Client Hire'
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="clientJobHiringModel"
                            checked={formData.hiringModel === 'Client Hire'}
                            onChange={() => setFormData(p => ({ ...p, hiringModel: 'Client Hire' }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-sm text-slate-800">Client Hire</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-5 leading-relaxed">
                          Direct recruitment onto {client.name}&apos;s payroll; tracks joining &amp; placement billing.
                        </span>
                      </label>

                      <label
                        className={cn(
                          'border rounded-lg p-3 cursor-pointer flex flex-col gap-1 transition-colors',
                          formData.hiringModel === 'SPC Hire'
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="clientJobHiringModel"
                            checked={formData.hiringModel === 'SPC Hire'}
                            onChange={() => setFormData(p => ({ ...p, hiringModel: 'SPC Hire' }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-sm text-slate-800">SPC Hire</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-5 leading-relaxed">
                          Staffing on SPC payroll; unlocks SPC Offers, Onboarding &amp; client deployment.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Number of Openings */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Number of Openings <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={selectedProject && availableToAllocate > 0 ? availableToAllocate : undefined}
                        value={formData.openings}
                        onChange={e =>
                          setFormData(p => ({ ...p, openings: parseInt(e.target.value, 10) || 1 }))
                        }
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      {selectedProject && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          Max: {availableToAllocate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={e => setFormData(p => ({ ...p, employmentType: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Skills & Job Description */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Skills &amp; Job Description
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Experience Range
                    </label>
                    <input
                      type="text"
                      value={formData.experienceRange}
                      onChange={e => setFormData(p => ({ ...p, experienceRange: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. 0-2 Years, 2-5 Years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Required Skills <span className="text-red-500">*</span>{' '}
                      <span className="text-xs text-slate-400 font-normal">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.requiredSkills}
                      onChange={e => setFormData(p => ({ ...p, requiredSkills: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Excel, Data Validation, Typing > 40 WPM"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Preferred Skills{' '}
                      <span className="text-xs text-slate-400 font-normal">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.preferredSkills}
                      onChange={e => setFormData(p => ({ ...p, preferredSkills: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Domain experience, ERP familiarity"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Job Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.summary}
                      onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Describe the role overview, key expectations, and team context..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Key Responsibilities{' '}
                      <span className="text-xs text-slate-400 font-normal">(One per line)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.responsibilities}
                      onChange={e => setFormData(p => ({ ...p, responsibilities: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder={'Verify records against source documents\nMaintain daily operations logs'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Qualifications{' '}
                      <span className="text-xs text-slate-400 font-normal">(Comma separated)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.qualifications}
                      onChange={e => setFormData(p => ({ ...p, qualifications: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="e.g. Any Graduate, Diploma"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Delivery & Joining Details */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Delivery &amp; Joining Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Job Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Select below or enter location..."
                    />
                    {suggestedLocations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs text-slate-400 mr-1">Quick select:</span>
                        {suggestedLocations.map(loc => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, location: loc }))}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
                              formData.location === loc
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            <MapPin className="w-3 h-3" />
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Joining Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.targetJoiningDate}
                      onChange={e => setFormData(p => ({ ...p, targetJoiningDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Application Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={e =>
                        setFormData(p => ({ ...p, applicationDeadline: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Assigned Recruiter (Owner) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.assignedRecruiterId}
                      onChange={e =>
                        setFormData(p => ({ ...p, assignedRecruiterId: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select recruiter...</option>
                      {mockUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Careers Portal Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={e =>
                        setFormData(p => ({ ...p, visibility: e.target.value as JobVisibility }))
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Public">Public (Publish on Careers Page when Open)</option>
                      <option value="Private">Private (Internal Sourcing Only)</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer (matching ProjectFormModal pattern) */}
        {creationPath !== 'selection' && !showOpenConfirm && (
          <div className="bg-slate-50 border-t border-slate-200 rounded-b-xl shrink-0">
            {validationError && (
              <div className="p-4 mx-4 mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{validationError}</p>
              </div>
            )}
            <div className="p-4 sm:p-6 flex justify-between items-center">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting || (!!selectedProject && availableToAllocate === 0)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOpenJobClick}
                  disabled={isSubmitting || (!!selectedProject && availableToAllocate === 0)}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                >
                  Create &amp; Open Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
