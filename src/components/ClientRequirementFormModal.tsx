import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Search, Briefcase, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import { Priority, ExtractedRequirementData, RequirementSourceMetadata, ClientRequirement } from '../types';
import SmartRequirementUpload from './SmartRequirementUpload';
import SmartRequirementReview from './SmartRequirementReview';

interface ClientRequirementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  requirementIdToEdit?: string;
}

export default function ClientRequirementFormModal({ isOpen, onClose, defaultClientId, requirementIdToEdit }: ClientRequirementFormModalProps) {
  const { clients, requirements, jobs, applications, createRequirement, updateRequirement } = useApp();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [creationMode, setCreationMode] = useState<'manual' | 'smart' | null>(null);
  const [smartReqStep, setSmartReqStep] = useState<'upload' | 'review'>('upload');
  const [extractedDataArray, setExtractedDataArray] = useState<ExtractedRequirementData[]>([]);
  const [sourceText, setSourceText] = useState('');
  const [sourceMetadata, setSourceMetadata] = useState<RequirementSourceMetadata | null>(null);

  const [showImpactReview, setShowImpactReview] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [impactReasonError, setImpactReasonError] = useState<string | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
  const [impactSnapshot, setImpactSnapshot] = useState<any>(null);

  const resetSmartState = () => {
    setCreationMode(null);
    setSmartReqStep('upload');
    setExtractedDataArray([]);
    setSourceText('');
    setSourceMetadata(null);
  };

  const [formData, setFormData] = useState({
    clientId: defaultClientId || '',
    roleTitle: '',
    title: '', // represents "Business" field
    projectName: '',
    locations: '',
    positionsRequired: 1,
    employmentType: 'Full-time',
    contractDuration: '',
    targetJoiningDate: '',
    priority: 'Medium' as Priority,
    assignedRecruiterId: '',
    notes: ''
  });

  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && requirementIdToEdit) {
      const req = requirements.find(r => r.id === requirementIdToEdit);
      if (req) {
        const initial = {
          clientId: req.clientId,
          roleTitle: req.roleTitle,
          title: req.title,
          projectName: req.projectName,
          locations: req.locations.join(', '),
          positionsRequired: req.positionsRequired,
          employmentType: req.employmentType,
          contractDuration: req.contractDuration || '',
          targetJoiningDate: req.targetJoiningDate,
          priority: req.priority,
          assignedRecruiterId: req.assignedRecruiterId,
          notes: req.notes || ''
        };
        setFormData(initial);
        setInitialData(initial);
        setCreationMode('manual');
      }
    } else if (isOpen) {
      const initial = {
        clientId: defaultClientId || '',
        roleTitle: '',
        title: '',
        projectName: '',
        locations: '',
        positionsRequired: 1,
        employmentType: 'Full-time',
        contractDuration: '',
        targetJoiningDate: '',
        priority: 'Medium' as Priority,
        assignedRecruiterId: '',
        notes: ''
      };
      setFormData(initial);
      setInitialData(initial);
      setCreationMode(null);
    }
  }, [isOpen, requirementIdToEdit, requirements, defaultClientId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setValidationError(null);
    setShowImpactReview(false);
    setAmendmentReason('');
    setImpactReasonError(null);
    setPendingUpdate(null);
    resetSmartState();
    onClose();
  };

  const calculateImpact = () => {
    if (!requirementIdToEdit) return null;
    const reqJobs = jobs.filter(j => j.requirementId === requirementIdToEdit);
    const reqApps = applications.filter(a => a.requirementId === requirementIdToEdit);
    return {
      linkedJobsCount: reqJobs.length,
      pipelineCount: reqApps.length,
      filledCount: reqApps.filter(a => a.currentStage === 'Joined').length,
      offersCount: reqApps.filter(a => ['Offer Extended', 'Offer Sent', 'Offer Accepted'].includes(a.currentStage)).length
    };
  };

  const getChangedMaterialFields = () => {
    if (!initialData) return [];
    const materialFields = ['clientId', 'roleTitle', 'title', 'locations', 'positionsRequired', 'employmentType', 'contractDuration', 'targetJoiningDate'];
    return materialFields.filter(f => (formData as any)[f] !== initialData[f]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationError(null);

    if (!formData.clientId) { setValidationError('Client is required.'); return; }
    if (!formData.roleTitle.trim()) { setValidationError('Role Title is required.'); return; }
    if (!formData.title.trim()) { setValidationError('Project/Business is required.'); return; }
    if (formData.positionsRequired < 1) { setValidationError('Number of positions must be at least 1.'); return; }
    if (!formData.targetJoiningDate) { setValidationError('Target Joining Date is required.'); return; }
    if (!formData.assignedRecruiterId) { setValidationError('Assigned Recruiter is required.'); return; }

    const impact = calculateImpact();
    if (impact && formData.positionsRequired < impact.filledCount) {
      setValidationError(`Cannot reduce positions below the already filled count (${impact.filledCount}).`);
      return;
    }

    const dataPayload = {
      clientId: formData.clientId,
      title: formData.title.trim(),
      roleTitle: formData.roleTitle.trim(),
      projectName: formData.projectName.trim() || 'General',
      locations: formData.locations ? formData.locations.split(',').map(l => l.trim()).filter(Boolean) : ['Delhi'],
      positionsRequired: formData.positionsRequired,
      employmentType: formData.employmentType,
      contractDuration: formData.contractDuration || '12 Months',
      targetJoiningDate: formData.targetJoiningDate,
      priority: formData.priority,
      assignedRecruiterId: formData.assignedRecruiterId,
      notes: formData.notes,
    };

    if (requirementIdToEdit) {
      const changedMaterial = getChangedMaterialFields();
      if (changedMaterial.length > 0 && impact && (impact.linkedJobsCount > 0 || impact.pipelineCount > 0)) {
        // Material change with downstream data -> Impact Review required
        setPendingUpdate(dataPayload);
        setImpactSnapshot(impact);
        setShowImpactReview(true);
        return;
      }
      
      setIsSubmitting(true);
      const res = updateRequirement(requirementIdToEdit, dataPayload);
      if (!res?.success && res?.error) {
        setValidationError(res.error);
        setIsSubmitting(false);
        return;
      }
    } else {
      setIsSubmitting(true);
      createRequirement(dataPayload);
    }

    setIsSuccess(true);
    setTimeout(() => { setIsSuccess(false); handleClose(); }, 1500);
  };

  const handleImpactConfirm = () => {
    if (!amendmentReason.trim()) {
      setImpactReasonError('A reason is required to perform material amendments.');
      return;
    }
    setImpactReasonError(null);
    setIsSubmitting(true);
    
    if (requirementIdToEdit && pendingUpdate) {
      const res = updateRequirement(requirementIdToEdit, pendingUpdate, amendmentReason, impactSnapshot);
      if (!res?.success && res?.error) {
        setValidationError(res.error);
        setIsSubmitting(false);
        setShowImpactReview(false);
        return;
      }
    }

    setIsSuccess(true);
    setShowImpactReview(false);
    setTimeout(() => { setIsSuccess(false); handleClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      
      {!creationMode && !requirementIdToEdit && (
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden p-8">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Create Client Requirement</h2>
              <p className="text-slate-500 text-sm mt-1">Choose how you want to create this requirement.</p>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div onClick={() => setCreationMode('manual')} className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 text-slate-500 group-hover:text-blue-600 transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg mb-2">Create Manually</h3>
              <p className="text-sm text-slate-500">Fill out the standard requirement form manually.</p>
            </div>

            <div onClick={() => setCreationMode('smart')} className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">NEW - AI</div>
              <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 text-slate-500 group-hover:text-blue-600 transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg mb-2">Upload Document</h3>
              <p className="text-sm text-slate-500">Upload a JD (PDF, DOCX, XLSX) to auto-extract details.</p>
            </div>
          </div>
        </div>
      )}

      {creationMode === 'smart' && smartReqStep === 'upload' && (
        <div className="relative w-full max-w-3xl">
          <button onClick={handleClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <SmartRequirementUpload 
            onCancel={handleClose}
            onExtractionSuccess={(data, text, meta) => {
              setExtractedDataArray(data);
              setSourceText(text);
              setSourceMetadata({...meta, extractionStatus: 'Success', uploadedBy: 'System', uploadedAt: new Date().toISOString(), parserVersion: 'gemini-1.5-flash'});
              setSmartReqStep('review');
            }} 
          />
        </div>
      )}

      {creationMode === 'smart' && smartReqStep === 'review' && extractedDataArray.length > 0 && sourceMetadata && (
         <div className="relative w-full max-w-7xl h-[90vh]">
           <SmartRequirementReview 
             extractedDataArray={extractedDataArray}
             sourceText={sourceText}
             metadata={sourceMetadata}
             onDiscard={handleClose}
             onSaveAsDraft={() => {
                setIsSuccess(true);
                setTimeout(() => { setIsSuccess(false); handleClose(); }, 1500);
             }}
           />
           {isSuccess && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Drafts Saved!</h3>
                </div>
              </div>
            )}
         </div>
      )}

      {creationMode === 'manual' && !showImpactReview && (
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {requirementIdToEdit ? 'Edit Client Requirement' : 'Create Client Requirement'}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {requirementIdToEdit ? 'Requirement Updated' : 'Requirement Created'}
              </h3>
              <p className="text-slate-500">
                {requirementIdToEdit ? 'The client requirement has been updated.' : 'The client requirement has been created and is now Open.'}
              </p>
            </div>
          ) : (
            <form id="sharedCreateReqForm" onSubmit={handleSubmit} className="space-y-6">
              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {validationError}
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                    <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                      <option value="">Select a client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Title *</label>
                    <input type="text" required value={formData.roleTitle} onChange={e => setFormData({...formData, roleTitle: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project/Business *</label>
                    <input type="text" placeholder="Enter Project/Business identifier" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Locations</label>
                    <input type="text" placeholder="e.g. Mumbai, Delhi" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Engagement Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Positions *</label>
                    <input type="number" min="1" required value={formData.positionsRequired} onChange={e => setFormData({...formData, positionsRequired: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                    <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract Duration</label>
                    <input type="text" placeholder="e.g. 6 Months" value={formData.contractDuration} onChange={e => setFormData({...formData, contractDuration: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Execution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Joining Date *</label>
                    <input type="date" required value={formData.targetJoiningDate} onChange={e => setFormData({...formData, targetJoiningDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Recruiter *</label>
                    <select required value={formData.assignedRecruiterId} onChange={e => setFormData({...formData, assignedRecruiterId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                      <option value="">Select a recruiter...</option>
                      {mockUsers.filter(u => u.role === 'RECRUITER' || u.role === 'MANAGER').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"></textarea>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          {!isSuccess && (
            <button type="submit" form="sharedCreateReqForm" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
              {requirementIdToEdit ? 'Save Changes' : 'Create Requirement'}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Impact Review Dialog */}
      {showImpactReview && impactSnapshot && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold text-slate-800">Impact Review Required</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              You are making a material change to this requirement (e.g., Client, Role, Positions, Dates). 
              Because there is downstream activity, you must provide a reason for the audit log.
            </p>
            
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Downstream Impact</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex justify-between"><span>Linked Jobs:</span> <span className="font-medium">{impactSnapshot.linkedJobsCount}</span></li>
                <li className="flex justify-between"><span>Candidates in Pipeline:</span> <span className="font-medium">{impactSnapshot.pipelineCount}</span></li>
                <li className="flex justify-between"><span>Active Offers:</span> <span className="font-medium">{impactSnapshot.offersCount}</span></li>
                <li className="flex justify-between"><span>Positions Filled:</span> <span className="font-medium text-green-600">{impactSnapshot.filledCount}</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Reason for Amendment *</label>
              <textarea 
                value={amendmentReason}
                onChange={e => setAmendmentReason(e.target.value)}
                placeholder="e.g., Client requested additional headcount..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                rows={3}
              />
              {impactReasonError && <p className="text-xs text-red-600">{impactReasonError}</p>}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => { setShowImpactReview(false); setPendingUpdate(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel Edit
            </button>
            <button 
              type="button"
              onClick={handleImpactConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors"
            >
              Confirm Amendment
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
