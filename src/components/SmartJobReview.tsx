import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExtractedJobData, JobStatus, JobVisibility, JobSourceMetadata } from '../types';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartJobReviewProps {
  extractedData: ExtractedJobData;
  sourceText: string;
  metadata: JobSourceMetadata;
  onSaveAsDraft: () => void;
  onDiscard: () => void;
}

export default function SmartJobReview({ extractedData, sourceText, metadata, onSaveAsDraft, onDiscard }: SmartJobReviewProps) {
  const { requirements, clients, currentUser, createJob } = useApp();

  const [formData, setFormData] = useState({
    title: extractedData.title || '',
    requirementId: extractedData.linkedClientRequirement || '',
    clientId: '',
    projectName: '',
    location: extractedData.location || '',
    openings: extractedData.openings || 1,
    employmentType: extractedData.employmentType || 'Full-time',
    experienceRange: extractedData.experienceRange || '1-3 Years',
    requiredSkills: extractedData.requiredSkills?.join(', ') || '',
    preferredSkills: extractedData.preferredSkills?.join(', ') || '',
    summary: extractedData.summary || '',
    responsibilities: extractedData.responsibilities?.join('\n') || '',
    qualifications: extractedData.qualifications?.join(', ') || '',
    targetJoiningDate: extractedData.targetJoiningDate || '',
    applicationDeadline: extractedData.applicationDeadline || '',
    visibility: 'Public' as JobVisibility,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Attempt to auto-map client requirement if provided by AI
    if (formData.requirementId) {
      const match = requirements.find(r => 
        r.id === formData.requirementId || 
        r.code.toLowerCase() === formData.requirementId.toLowerCase() || 
        r.title.toLowerCase().includes(formData.requirementId.toLowerCase())
      );
      if (match) {
        setFormData(prev => ({ 
          ...prev, 
          requirementId: match.id,
          clientId: match.clientId,
          projectName: match.projectName
        }));
      } else {
        setFormData(prev => ({ ...prev, requirementId: '' }));
      }
    }
  }, []);

  const handleRequirementChange = (reqId: string) => {
    const req = requirements.find(r => r.id === reqId);
    if (req) {
      setFormData(prev => ({
        ...prev,
        requirementId: reqId,
        clientId: req.clientId,
        projectName: req.projectName
      }));
    } else {
      setFormData(prev => ({ ...prev, requirementId: '', clientId: '', projectName: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.requirementId) newErrors.requirementId = 'Linked Requirement is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.summary) newErrors.summary = 'Summary is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (status: JobStatus = 'Draft') => {
    if (!validate()) return;
    
    createJob({
      title: formData.title,
      requirementId: formData.requirementId,
      clientId: formData.clientId,
      projectName: formData.projectName,
      location: formData.location,
      openings: Number(formData.openings) || 1,
      employmentType: formData.employmentType,
      experienceRange: formData.experienceRange,
      requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
      summary: formData.summary,
      responsibilities: formData.responsibilities.split('\n').map(s => s.trim()).filter(Boolean),
      qualifications: formData.qualifications.split(',').map(s => s.trim()).filter(Boolean),
      targetJoiningDate: formData.targetJoiningDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      applicationDeadline: formData.applicationDeadline || new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
      assignedRecruiterId: currentUser?.id || '',
      visibility: formData.visibility,
      status: status,
      publishedAt: status === 'Published' ? new Date().toISOString() : undefined,
      sourceMetadata: metadata,
    }, formData.requirementId);

    onSaveAsDraft();
  };

  return (
    <div className="flex h-[800px] w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      
      {/* Source Text Pane */}
      <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-800">Source Document</h3>
          <p className="text-xs text-slate-500 truncate">{metadata.originalFilename}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
            {sourceText}
          </pre>
        </div>
      </div>

      {/* Editable Form Pane */}
      <div className="w-2/3 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Review Job Details
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">AI Extracted</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Please review the extracted details and link a client requirement.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onDiscard} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Discard
            </button>
            <button onClick={() => handleSave('Draft')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
              Save as Draft
            </button>
            <button onClick={() => handleSave('Published')} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Save & Publish
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Please resolve validation errors before saving.</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Core Mapping</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Linked Requirement <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.requirementId}
                    onChange={(e) => handleRequirementChange(e.target.value)}
                    className={cn("w-full rounded-lg border p-2.5 text-sm", errors.requirementId ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                  >
                    <option value="">-- Select Client Requirement --</option>
                    {requirements.map(r => {
                      const client = clients.find(c => c.id === r.clientId);
                      return (
                        <option key={r.id} value={r.id}>
                          {client?.name} - {r.title} ({r.code})
                        </option>
                      );
                    })}
                  </select>
                  {errors.requirementId && <p className="text-red-500 text-xs mt-1">{errors.requirementId}</p>}
                </div>

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
              <h4 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Description & Skills</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.summary} 
                    onChange={e => setFormData({...formData, summary: e.target.value})}
                    className={cn("w-full rounded-lg border p-2.5 text-sm", errors.summary ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    Responsibilities 
                    <span className="text-xs text-slate-500 font-normal">(One per line)</span>
                  </label>
                  <textarea 
                    rows={4}
                    value={formData.responsibilities} 
                    onChange={e => setFormData({...formData, responsibilities: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    value={formData.requiredSkills} 
                    onChange={e => setFormData({...formData, requiredSkills: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications (Comma separated)</label>
                  <input 
                    type="text" 
                    value={formData.qualifications} 
                    onChange={e => setFormData({...formData, qualifications: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm"
                  />
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
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
