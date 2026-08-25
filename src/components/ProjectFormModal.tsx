import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, FileText, Upload, Plus, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Project, EngagementType, AgreementStatus } from '../types';
import { mockUsers } from '../data/mockData';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  projectIdToEdit?: string;
}

export default function ProjectFormModal({ isOpen, onClose, defaultClientId, projectIdToEdit }: ProjectFormModalProps) {
  const { clients, projects, createProject, updateProject } = useApp();
  
  const [creationPath, setCreationPath] = useState<'selection' | 'upload' | 'manual'>('selection');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [showActivationConfirm, setShowActivationConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: defaultClientId || '',
    projectName: '',
    engagementType: 'Direct Recruitment' as EngagementType,
    totalRequestedHeadcount: 1,
    projectDescription: '',
    clientContactPerson: '',
    agreementReference: '',
    agreementStartDate: '',
    agreementEndDate: '',
    agreementStatus: 'Draft' as AgreementStatus,
    locations: '',
    targetJoiningDate: '',
    projectOwner: '',
    notes: ''
  });

  const [documentMetadata, setDocumentMetadata] = useState<{filename: string; fileType: string; size: number; uploadDate: string;} | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (projectIdToEdit) {
        const proj = projects.find(p => p.id === projectIdToEdit);
        if (proj) {
          setFormData({
            clientId: proj.clientId,
            projectName: proj.projectName,
            engagementType: proj.engagementType,
            totalRequestedHeadcount: proj.totalRequestedHeadcount,
            projectDescription: proj.projectDescription || '',
            clientContactPerson: proj.clientContactPerson || '',
            agreementReference: proj.agreementReference || '',
            agreementStartDate: proj.agreementStartDate || '',
            agreementEndDate: proj.agreementEndDate || '',
            agreementStatus: proj.agreementStatus || 'Draft',
            locations: proj.locations.join(', '),
            targetJoiningDate: proj.targetJoiningDate || '',
            projectOwner: proj.projectOwner || '',
            notes: proj.notes || ''
          });
          setDocumentMetadata(proj.agreementDocumentMetadata || null);
          setCreationPath('manual');
        }
      } else {
        setFormData(prev => ({ ...prev, clientId: defaultClientId || '' }));
        setCreationPath('selection');
        setDocumentMetadata(null);
      }
      setIsSuccess(false);
      setValidationError(null);
      setShowActivationConfirm(false);
    }
  }, [isOpen, projectIdToEdit, projects, defaultClientId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setCreationPath('selection');
    setFormData({
      clientId: defaultClientId || '',
      projectName: '',
      engagementType: 'Direct Recruitment',
      totalRequestedHeadcount: 1,
      projectDescription: '',
      clientContactPerson: '',
      agreementReference: '',
      agreementStartDate: '',
      agreementEndDate: '',
      agreementStatus: 'Draft',
      locations: '',
      targetJoiningDate: '',
      projectOwner: '',
      notes: ''
    });
    setDocumentMetadata(null);
    setValidationError(null);
    setShowActivationConfirm(false);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentMetadata({
        filename: file.name,
        fileType: file.type || 'application/pdf',
        size: file.size,
        uploadDate: new Date().toISOString()
      });
      setCreationPath('manual');
    }
  };

  const validateDraft = () => {
    if (!formData.clientId) return 'Client is required.';
    if (!formData.projectName) return 'Project Name is required.';
    if (!formData.engagementType) return 'Engagement Type is required.';
    if (formData.totalRequestedHeadcount < 1) return 'Headcount must be at least 1.';
    return null;
  };

  const validateActivation = () => {
    const draftError = validateDraft();
    if (draftError) return draftError;
    
    return null;
  };

  const saveProject = (status: 'Draft' | 'Active') => {
    setIsSubmitting(true);
    
    const projectData = {
      clientId: formData.clientId,
      projectName: formData.projectName,
      engagementType: formData.engagementType,
      totalRequestedHeadcount: formData.totalRequestedHeadcount,
      projectDescription: formData.projectDescription,
      clientContactPerson: formData.clientContactPerson,
      agreementReference: formData.agreementReference,
      agreementStartDate: formData.agreementStartDate,
      agreementEndDate: formData.agreementEndDate,
      agreementStatus: formData.agreementStatus,
      locations: formData.locations.split(',').map(s => s.trim()).filter(Boolean),
      targetJoiningDate: formData.targetJoiningDate,
      projectOwner: formData.projectOwner,
      notes: formData.notes,
      agreementDocumentMetadata: documentMetadata || undefined,
      status
    };

    if (projectIdToEdit) {
      updateProject(projectIdToEdit, projectData);
    } else {
      createProject(projectData);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleSaveDraft = () => {
    const err = validateDraft();
    if (err) {
      setValidationError(err);
      return;
    }
    saveProject('Draft');
  };

  const handleActivateClick = () => {
    const err = validateActivation();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setShowActivationConfirm(true);
  };

  const confirmActivation = () => {
    saveProject('Active');
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Project {projectIdToEdit ? 'Updated' : 'Created'} Successfully</h2>
          <p className="text-slate-500">The project details have been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {projectIdToEdit ? 'Edit Project' : 'Create Project'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Set up a new project engagement and requirement details.
            </p>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">

          {showActivationConfirm ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Confirm Project Activation
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  Activating this Project will allow recruitment Jobs to be opened under it. Confirm that the agreement and Project details have been reviewed.
                </p>
                
                <div className="bg-white rounded border border-amber-100 p-4 space-y-2 text-sm text-slate-700">
                  <p><strong>Client:</strong> {clients.find(c => c.id === formData.clientId)?.name}</p>
                  <p><strong>Project Name:</strong> {formData.projectName}</p>
                  <p><strong>Engagement Type:</strong> {formData.engagementType}</p>
                  <p><strong>Agreement Reference:</strong> {formData.agreementReference}</p>
                  <p><strong>Total Headcount:</strong> {formData.totalRequestedHeadcount}</p>
                  <p><strong>Locations:</strong> {formData.locations}</p>
                  <p><strong>Project Owner:</strong> {formData.projectOwner}</p>
                  {documentMetadata && <p><strong>Document:</strong> {documentMetadata.filename}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowActivationConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Back to Review
                </button>
                <button onClick={confirmActivation} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Activating...' : 'Activate Project'}
                </button>
              </div>
            </div>
          ) : creationPath === 'selection' ? (
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto py-8">
              <div className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Upload Agreement</h3>
                <p className="text-sm text-slate-500">Upload a signed agreement or work order and review the Project details before activation.</p>
              </div>
              
              <div 
                onClick={() => setCreationPath('manual')}
                className="border-2 border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Create Manually</h3>
                <p className="text-sm text-slate-500">Enter the agreement and Project details manually.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {documentMetadata && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{documentMetadata.filename}</p>
                      <p className="text-xs text-slate-500">{(documentMetadata.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(documentMetadata.uploadDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <label className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer px-3 py-1.5 bg-white border border-blue-200 rounded shadow-sm">
                    Replace
                    <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileUpload} />
                  </label>
                </div>
              )}
              
              {/* Basic Details */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Basic Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData(p => ({ ...p, clientId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a client...</option>
                      {clients.filter(c => c.status === 'Active').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData(p => ({ ...p, projectName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. UrbanEdge Hub Operations"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Engagement Type <span className="text-red-500">*</span></label>
                    <div className="grid sm:grid-cols-2 gap-3 mt-1">
                      <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1 transition-colors ${formData.engagementType === 'Direct Recruitment' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="engType" 
                            checked={formData.engagementType === 'Direct Recruitment'}
                            onChange={() => setFormData(p => ({ ...p, engagementType: 'Direct Recruitment' }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-sm text-slate-800">Direct Recruitment</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-5 leading-relaxed">SPC recruits candidates who will be employed directly by the client.</span>
                      </label>
                      
                      <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1 transition-colors ${formData.engagementType === 'Staffing – SPC Payroll' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="engType" 
                            checked={formData.engagementType === 'Staffing – SPC Payroll'}
                            onChange={() => setFormData(p => ({ ...p, engagementType: 'Staffing – SPC Payroll' }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-sm text-slate-800">Staffing – SPC Payroll</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-5 leading-relaxed">SPC recruits and employs candidates who will later be deployed to the client.</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Requested Headcount <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalRequestedHeadcount}
                      onChange={(e) => setFormData(p => ({ ...p, totalRequestedHeadcount: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client Contact Person</label>
                    <input
                      type="text"
                      value={formData.clientContactPerson}
                      onChange={(e) => setFormData(p => ({ ...p, clientContactPerson: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Description</label>
                    <textarea
                      rows={3}
                      value={formData.projectDescription}
                      onChange={(e) => setFormData(p => ({ ...p, projectDescription: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Agreement Details */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Agreement Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agreement / Work Order Reference</label>
                    <input
                      type="text"
                      value={formData.agreementReference}
                      onChange={(e) => setFormData(p => ({ ...p, agreementReference: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agreement Start Date</label>
                    <input
                      type="date"
                      value={formData.agreementStartDate}
                      onChange={(e) => setFormData(p => ({ ...p, agreementStartDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agreement End Date</label>
                    <input
                      type="date"
                      value={formData.agreementEndDate}
                      onChange={(e) => setFormData(p => ({ ...p, agreementEndDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agreement Status</label>
                    <select
                      value={formData.agreementStatus}
                      onChange={(e) => setFormData(p => ({ ...p, agreementStatus: e.target.value as AgreementStatus }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Signed">Signed</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Delivery Details */}
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Delivery Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Location(s)</label>
                    <input
                      type="text"
                      value={formData.locations}
                      onChange={(e) => setFormData(p => ({ ...p, locations: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Delhi, Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Mobilization Date</label>
                    <input
                      type="date"
                      value={formData.targetJoiningDate}
                      onChange={(e) => setFormData(p => ({ ...p, targetJoiningDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Owner</label>
                    <select
                      value={formData.projectOwner}
                      onChange={(e) => setFormData(p => ({ ...p, projectOwner: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select owner...</option>
                      {mockUsers.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {creationPath !== 'selection' && !showActivationConfirm && (
          <div className="bg-slate-50 border-t border-slate-200 rounded-b-xl shrink-0">
            {validationError && (
              <div className="p-4 mx-4 mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{validationError}</p>
              </div>
            )}
            <div className="p-4 sm:p-6 flex justify-between items-center">
              <button 
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleActivateClick}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                >
                  Activate Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
