import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import { Priority } from '../types';

interface CreateRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  requirementIdToEdit?: string;
}

export default function CreateRequirementModal({ isOpen, onClose, defaultClientId, requirementIdToEdit }: CreateRequirementModalProps) {
  const { clients, requirements, createRequirement, updateRequirement } = useApp();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  React.useEffect(() => {
    if (isOpen && requirementIdToEdit) {
      const req = requirements.find(r => r.id === requirementIdToEdit);
      if (req) {
        setFormData({
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
        });
      }
    } else if (isOpen) {
      setFormData({
        clientId: defaultClientId || '',
        roleTitle: '',
        title: '',
        projectName: '',
        locations: '',
        positionsRequired: 1,
        employmentType: 'Full-time',
        contractDuration: '',
        targetJoiningDate: '',
        priority: 'Medium',
        assignedRecruiterId: '',
        notes: ''
      });
    }
  }, [isOpen, requirementIdToEdit, requirements, defaultClientId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationError(null);

    if (!formData.clientId) {
      setValidationError('Client is required.');
      return;
    }
    if (!formData.roleTitle.trim()) {
      setValidationError('Role Title is required.');
      return;
    }
    if (!formData.title.trim()) {
      setValidationError('Business is required.');
      return;
    }
    if (formData.positionsRequired < 1) {
      setValidationError('Number of positions must be at least 1.');
      return;
    }
    if (!formData.targetJoiningDate) {
      setValidationError('Target Joining Date is required.');
      return;
    }
    if (!formData.assignedRecruiterId) {
      setValidationError('Assigned Recruiter is required.');
      return;
    }

    setIsSubmitting(true);
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
      updateRequirement(requirementIdToEdit, dataPayload);
    } else {
      createRequirement(dataPayload);
    }
    setIsSubmitting(false);
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business *</label>
                    <input type="text" placeholder="Enter Business identifier" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
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
                      {mockUsers.filter(u => u.role === 'Recruiter' || u.role === 'Recruitment Manager').map(u => (
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
          <button 
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {!isSuccess && (
            <button 
              type="submit"
              form="sharedCreateReqForm"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {requirementIdToEdit ? 'Save Changes' : 'Create Requirement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
