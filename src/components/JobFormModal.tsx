import React, { useState } from 'react';
import { Job, JobStatus, JobVisibility } from '../types';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export default function JobFormModal({ isOpen, onClose, job }: JobFormModalProps) {
  const { updateJob, requirements, clients } = useApp();
  
  const [formData, setFormData] = useState({
    title: job.title,
    location: job.location,
    openings: job.openings,
    employmentType: job.employmentType,
    experienceRange: job.experienceRange,
    summary: job.summary,
    targetJoiningDate: job.targetJoiningDate ? job.targetJoiningDate.split('T')[0] : '',
    applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.summary) newErrors.summary = 'Summary is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    updateJob(job.id, {
      title: formData.title,
      location: formData.location,
      openings: Number(formData.openings) || 1,
      employmentType: formData.employmentType,
      experienceRange: formData.experienceRange,
      summary: formData.summary,
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
                    value={formData.openings} 
                    onChange={e => setFormData({...formData, openings: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Logistics</h4>
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
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                <input 
                  type="date" 
                  value={formData.applicationDeadline} 
                  onChange={e => setFormData({...formData, applicationDeadline: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Summary</h4>
            <textarea 
              rows={4}
              value={formData.summary} 
              onChange={e => setFormData({...formData, summary: e.target.value})}
              className={cn("w-full rounded-lg border p-2.5 text-sm", errors.summary ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
            />
            {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
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
