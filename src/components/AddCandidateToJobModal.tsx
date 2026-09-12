import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, CheckCircle, AlertTriangle, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Candidate, ScreeningData } from '../types';

interface AddCandidateToJobModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCandidateToJobModal({ jobId, isOpen, onClose }: AddCandidateToJobModalProps) {
  const { candidates, applications, addMatchToPipeline, createCandidate } = useApp();
  const job = useApp().jobs.find(j => j.id === jobId);

  // Form state for Create New
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', currentLocation: '', linkedInUrl: '',
    currentRole: '', currentCompany: '', totalExperience: '', professionalSummary: '',
    skills: '', languages: '', employmentHistory: [] as any[], educationEntries: [] as any[],
    currentSalary: '', expectedSalary: '', noticePeriod: '', customNoticePeriod: '',
    preferredLocation: '', willingToRelocate: '', availableFrom: '', recruiterNotes: '',
    resumeUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Feedback state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateCandidateId, setDuplicateCandidateId] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const handleResumeUpload = () => {
    setIsUploadingResume(true);
    // Simulate resume parsing delay
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        fullName: 'Rahul Sharma',
        email: 'rahul.s@example.com',
        phone: '9876543210',
        currentLocation: 'Bangalore',
        currentRole: 'Senior React Developer',
        currentCompany: 'Tech Solutions Inc',
        totalExperience: '5',
        skills: 'React, TypeScript, Node.js, Next.js, Tailwind CSS',
        noticePeriod: '30 Days'
      }));
      setIsUploadingResume(false);
    }, 1500);
  };

  if (!isOpen || !job) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() && !formData.phone.trim()) newErrors.contact = 'Email or Phone is required';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Invalid email format';
    if (formData.currentLocation.trim() === '') newErrors.currentLocation = 'Current Location is required';
    if (formData.currentRole.trim() === '') newErrors.currentRole = 'Current Role is required';
    if (!formData.noticePeriod) newErrors.noticePeriod = 'Notice Period is required';
    if (formData.noticePeriod === 'Custom' && !formData.customNoticePeriod) newErrors.customNoticePeriod = 'Custom Notice Period in Days is required';
    
    if (formData.currentSalary && isNaN(Number(formData.currentSalary))) newErrors.currentSalary = 'Must be a number';
    if (formData.expectedSalary && isNaN(Number(formData.expectedSalary))) newErrors.expectedSalary = 'Must be a number';
    if (formData.expectedSalary && Number(formData.expectedSalary) < 0) newErrors.expectedSalary = 'Cannot be negative';
    if (formData.currentSalary && Number(formData.currentSalary) < 0) newErrors.currentSalary = 'Cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = () => {
    const normEmail = formData.email?.trim().toLowerCase();
    const normPhone = formData.phone?.replace(/[^0-9]/g, '');
    
    const dup = candidates.find(c => 
      (normEmail && c.email.trim().toLowerCase() === normEmail) ||
      (normPhone && c.phone.replace(/[^0-9]/g, '') === normPhone)
    );

    if (dup) {
      setDuplicateCandidateId(dup.id);
      setShowDuplicateWarning(true);
      return true;
    }
    return false;
  };



  const handleCreateAndAdd = async () => {
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const parsedSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const parsedLanguages = formData.languages.split(',').map(s => s.trim()).filter(Boolean);
    const finalNoticePeriod = formData.noticePeriod === 'Custom' ? `${formData.customNoticePeriod} Days` : formData.noticePeriod;
    
    const createResult = createCandidate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      currentLocation: formData.currentLocation,
      linkedInUrl: formData.linkedInUrl,
      currentRole: formData.currentRole,
      currentCompany: formData.currentCompany,
      totalExperience: formData.totalExperience,
      professionalSummary: formData.professionalSummary,
      skills: parsedSkills,
      languages: parsedLanguages,
      employmentHistory: formData.employmentHistory,
      educationEntries: formData.educationEntries,
      currentSalary: formData.currentSalary,
      expectedSalary: formData.expectedSalary,
      noticePeriod: finalNoticePeriod,
      preferredLocation: formData.preferredLocation,
      willingToRelocate: formData.willingToRelocate as any,
      availableFrom: formData.availableFrom,
      recruiterNotes: formData.recruiterNotes,
      resumeUrl: formData.resumeUrl,
      source: 'Manual Entry',
      education: formData.educationEntries[0]?.qualification || '',
      createdMethod: 'Manual Entry',
    });

    if (!createResult.success || !createResult.candidateId) {
      alert(createResult.error || 'Failed to create candidate');
      setIsProcessing(false);
      return;
    }

    const result = addMatchToPipeline(jobId, createResult.candidateId, 'Recruiter Added from Job Pipeline');
    if (!result.success) {
      alert(result.error);
      setIsProcessing(false);
      return;
    }

    alert('Candidate added to the Sourced stage for this Job.');
    setIsProcessing(false);
    onClose();
  };

  const handleSaveForm = () => {
    if (!validateForm()) return;
    if (!showDuplicateWarning && checkForDuplicates()) return;
    handleCreateAndAdd();
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add Candidate to Pipeline</h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-700">{job.title}</span>
              <span className="text-slate-300">•</span>
              <span>{job.code}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <div className="space-y-6">
              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Please resolve validation errors before saving.</p>
                  </div>
                </div>
              )}

              {showDuplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="font-semibold text-sm">A candidate with this email address or phone number already exists.</p>
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => window.open(`/job-desk/candidates/${duplicateCandidateId}`, '_blank')} className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
                        View Existing Candidate
                      </button>
                      <button onClick={handleCreateAndAdd} className="text-sm font-medium text-amber-700 hover:text-amber-900 underline ml-auto">
                        Continue Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Upload Resume</h4>
                  <p className="text-xs text-blue-700 mt-0.5">Auto-fill candidate details by uploading their resume.</p>
                </div>
                <button 
                  onClick={handleResumeUpload}
                  disabled={isUploadingResume || isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploadingResume ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</> : 'Upload PDF / DOCX'}
                </button>
              </div>

              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h4 className="font-semibold text-slate-800">Personal Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.fullName ? "border-red-300" : "border-slate-300")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.email || errors.contact ? "border-red-300" : "border-slate-300")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.contact ? "border-red-300" : "border-slate-300")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Location *</label>
                    <input type="text" value={formData.currentLocation} onChange={e => setFormData({...formData, currentLocation: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.currentLocation ? "border-red-300" : "border-slate-300")} />
                  </div>
                </div>
                {errors.contact && <p className="text-red-500 text-xs mt-2">{errors.contact}</p>}
              </section>

              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h4 className="font-semibold text-slate-800">Professional Summary & Employment</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Role *</label>
                    <input type="text" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.currentRole ? "border-red-300" : "border-slate-300")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Company</label>
                    <input type="text" value={formData.currentCompany} onChange={e => setFormData({...formData, currentCompany: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Experience (Years)</label>
                    <input type="text" value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                    <textarea rows={2} value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period *</label>
                    <select value={formData.noticePeriod} onChange={e => setFormData({...formData, noticePeriod: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white", errors.noticePeriod ? "border-red-300" : "border-slate-300")}>
                      <option value="">Select...</option>
                      <option>Immediate</option>
                      <option>7 Days</option>
                      <option>15 Days</option>
                      <option>30 Days</option>
                      <option>45 Days</option>
                      <option>60 Days</option>
                      <option>90 Days</option>
                      <option>Serving Notice</option>
                      <option>Custom</option>
                    </select>
                    {errors.noticePeriod && <p className="text-red-500 text-xs mt-1">{errors.noticePeriod}</p>}
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={onClose} 
                  disabled={isProcessing}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveForm}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Adding candidate...</> : 'Create & Add to Pipeline'}
                </button>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
}
