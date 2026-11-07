import React, { useState } from 'react';
import { Job, JobStatus, JobVisibility, HiringModel } from '../types';
import { X, CheckCircle, Lock, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { getFulfilledPositionsForJob } from '../lib/headcount';
import { isJobHiringModelLocked } from '../lib/hiringModelUtils';
import { AlertTriangle, Users } from 'lucide-react';
import { mockUsers } from '../data/mockData';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export default function JobFormModal({ isOpen, onClose, job }: JobFormModalProps) {
  const { updateJob, jobs, applications, currentUser, updateJobHiringModel } = useApp();

  const fulfilledPositions = getFulfilledPositionsForJob(job.id, applications);
  const isLocked = isJobHiringModelLocked(job.id, applications);
  const isAdmin = currentUser?.role === 'ADMIN' || (currentUser as any)?.role === 'company_admin';

  const [formData, setFormData] = useState({
    title: job.title,
    location: job.location,
    openings: job.openings,
    employmentType: job.employmentType,
    hiringModel: (job.hiringModel === 'Client Hire' || job.hiringModel === 'SPC Hire') ? job.hiringModel : ('Client Hire' as HiringModel),
    experienceRange: job.experienceRange,
    summary: job.summary,
    assignedRecruiterId: job.assignedRecruiterId || '',
    responsibilities: job.responsibilities?.join('\n') || '',
    qualifications: job.qualifications?.join(', ') || '',
    requiredSkills: job.requiredSkills?.join(', ') || '',
    preferredSkills: job.preferredSkills?.join(', ') || '',
    targetJoiningDate: job.targetJoiningDate ? job.targetJoiningDate.split('T')[0] : '',
    applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
  });

  const [adminOverrideConfirmed, setAdminOverrideConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.summary) newErrors.summary = 'Summary is required';
    const openingValue = Number(formData.openings) || 0;
    if (openingValue < fulfilledPositions) {
      newErrors.openings = `This Job already has ${fulfilledPositions} fulfilled positions. Number of openings cannot be reduced below ${fulfilledPositions}.`;
    }

    if (isLocked && formData.hiringModel !== job.hiringModel) {
      if (!isAdmin) {
        newErrors.hiringModel = 'Hiring Model is locked because candidates have entered the pipeline. Admin override required.';
      } else if (!adminOverrideConfirmed) {
        newErrors.hiringModel = 'Please check the confirmation box to authorize this administrator override.';
      }
    }

    if (formData.targetJoiningDate && formData.applicationDeadline) {
      const joiningTime = new Date(formData.targetJoiningDate).getTime();
      const deadlineTime = new Date(formData.applicationDeadline).getTime();
      if (!isNaN(joiningTime) && !isNaN(deadlineTime) && joiningTime < deadlineTime) {
        newErrors.targetJoiningDate = 'Target Joining Date cannot be earlier than Application Deadline.';
        newErrors.applicationDeadline = 'Application Deadline cannot be later than Target Joining Date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (formData.hiringModel !== job.hiringModel) {
      const res = updateJobHiringModel(job.id, formData.hiringModel, isLocked && isAdmin);
      if (!res.success) {
        setErrors(prev => ({ ...prev, hiringModel: res.error || 'Failed to update hiring model' }));
        return;
      }
    }
    
    updateJob(job.id, {
      title: formData.title,
      location: formData.location,
      openings: Number(formData.openings) || 1,
      employmentType: formData.employmentType,
      experienceRange: formData.experienceRange,
      summary: formData.summary,
      assignedRecruiterId: formData.assignedRecruiterId,
      responsibilities: formData.responsibilities.split('\n').map(s => s.trim()).filter(Boolean),
      qualifications: formData.qualifications.split(',').map(s => s.trim()).filter(Boolean),
      requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
      targetJoiningDate: formData.targetJoiningDate ? new Date(formData.targetJoiningDate).toISOString() : job.targetJoiningDate,
      applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : job.applicationDeadline,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Job</h2>
            <p className="text-sm text-slate-500">{job.code}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Core Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className={cn("w-full rounded-lg border p-2.5 text-sm", errors.title ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className={cn("w-full rounded-lg border p-2.5 text-sm", errors.location ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Openings</label>
                  <input 
                    type="number" 
                    min={fulfilledPositions || 1}
                    value={formData.openings} 
                    onChange={e => setFormData({...formData, openings: Number(e.target.value)})}
                    className={cn("w-full rounded-lg border p-2.5 text-sm", errors.openings ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                  />
                  {errors.openings && <p className="text-red-500 text-xs mt-1 flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/> {errors.openings}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Owner (Recruiter)
                </label>
                <select
                  value={formData.assignedRecruiterId}
                  onChange={(e) => setFormData({...formData, assignedRecruiterId: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                >
                  <option value="">-- Select Owner --</option>
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Logistics & Hiring Model</h4>
            
            {/* Hiring Model Section */}
            <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Hiring Model <span className="text-red-500">*</span>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <Lock className="w-3 h-3" /> Locked (Active Pipeline)
                    </span>
                  )}
                </label>
                <span className="text-[11px] text-slate-500">
                  Separate from Employment Type
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <label
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all text-xs",
                    formData.hiringModel === 'Client Hire'
                      ? "border-purple-600 bg-purple-50/50 text-purple-900 font-medium"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    isLocked && !isAdmin && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="radio"
                    name="hiringModel"
                    value="Client Hire"
                    checked={formData.hiringModel === 'Client Hire'}
                    disabled={isLocked && !isAdmin}
                    onChange={() => setFormData({ ...formData, hiringModel: 'Client Hire' })}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold block">Client Hire</span>
                    <span className="text-[11px] text-slate-500">Direct on Client payroll; placement tracking & billing.</span>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all text-xs",
                    formData.hiringModel === 'SPC Hire'
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    isLocked && !isAdmin && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="radio"
                    name="hiringModel"
                    value="SPC Hire"
                    checked={formData.hiringModel === 'SPC Hire'}
                    disabled={isLocked && !isAdmin}
                    onChange={() => setFormData({ ...formData, hiringModel: 'SPC Hire' })}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold block">SPC Hire</span>
                    <span className="text-[11px] text-slate-500">Hired onto SPC workforce; standard Offers & Onboarding.</span>
                  </div>
                </label>
              </div>

              {isLocked && !isAdmin && (
                <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Candidates have entered the pipeline. Recruiters and Managers cannot change the hiring model.
                </p>
              )}

              {isLocked && isAdmin && formData.hiringModel !== job.hiringModel && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1 text-rose-700">
                    <ShieldAlert className="w-4 h-4" /> Administrator Override Warning
                  </div>
                  <p className="text-[11px]">
                    Candidates have already entered the pipeline. Overriding the Hiring Model alters downstream offer issuance vs. joining tracking and billing eligibility.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminOverrideConfirmed}
                      onChange={(e) => setAdminOverrideConfirmed(e.target.checked)}
                      className="w-3.5 h-3.5 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                    />
                    <span className="text-[11px]">I confirm this override and understand downstream actions will change.</span>
                  </label>
                </div>
              )}

              {errors.hiringModel && (
                <p className="text-red-500 text-xs mt-2">{errors.hiringModel}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                <select 
                  value={formData.employmentType}
                  onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                >
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Part-time</option>
                  <option>Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                <input 
                  type="text" 
                  value={formData.experienceRange} 
                  onChange={e => setFormData({...formData, experienceRange: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Joining Date</label>
                <input 
                  type="date" 
                  value={formData.targetJoiningDate} 
                  onChange={e => setFormData({...formData, targetJoiningDate: e.target.value})}
                  className={cn("w-full rounded-lg border p-2.5 text-sm", errors.targetJoiningDate ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                />
                {errors.targetJoiningDate && <p className="text-red-500 text-xs mt-1">{errors.targetJoiningDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                <input 
                  type="date" 
                  value={formData.applicationDeadline} 
                  onChange={e => setFormData({...formData, applicationDeadline: e.target.value})}
                  className={cn("w-full rounded-lg border p-2.5 text-sm", errors.applicationDeadline ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                />
                {errors.applicationDeadline && <p className="text-red-500 text-xs mt-1">{errors.applicationDeadline}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Description & Skills</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows={4}
                  value={formData.summary} 
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                  className={cn("w-full rounded-lg border p-2.5 text-sm", errors.summary ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                />
                {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Responsibilities <span className="text-slate-400 font-normal text-xs ml-1">(One per line)</span>
                </label>
                <textarea 
                  rows={6}
                  value={formData.responsibilities} 
                  onChange={e => setFormData({...formData, responsibilities: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Qualifications <span className="text-slate-400 font-normal text-xs ml-1">(Comma separated)</span>
                </label>
                <input 
                  type="text" 
                  value={formData.qualifications} 
                  onChange={e => setFormData({...formData, qualifications: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Required Skills <span className="text-slate-400 font-normal text-xs ml-1">(Comma separated)</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.requiredSkills} 
                    onChange={e => setFormData({...formData, requiredSkills: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Preferred Skills <span className="text-slate-400 font-normal text-xs ml-1">(Comma separated)</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.preferredSkills} 
                    onChange={e => setFormData({...formData, preferredSkills: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
