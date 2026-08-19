import React, { useState } from 'react';
import { Candidate, EmploymentEntry, EducationEntry } from '../types';
import { X, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<Candidate>;
  isEditMode?: boolean;
}

export default function CandidateFormModal({ isOpen, onClose, initialData, isEditMode = false }: CandidateFormModalProps) {
  const { createCandidate, updateCandidate, candidates } = useApp();
  
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    currentLocation: initialData.currentLocation || '',
    linkedInUrl: initialData.linkedInUrl || '',
    currentRole: initialData.currentRole || '',
    currentCompany: initialData.currentCompany || '',
    totalExperience: initialData.totalExperience || '',
    professionalSummary: initialData.professionalSummary || '',
    skills: initialData.skills?.join(', ') || '',
    languages: initialData.languages?.join(', ') || '',
    employmentHistory: initialData.employmentHistory || [],
    educationEntries: initialData.educationEntries || [],
    currentSalary: initialData.currentSalary || '',
    expectedSalary: initialData.expectedSalary || '',
    noticePeriod: initialData.noticePeriod || '',
    customNoticePeriod: '',
    preferredLocation: initialData.preferredLocation || '',
    willingToRelocate: initialData.willingToRelocate || '',
    availableFrom: initialData.availableFrom || '',
    recruiterNotes: initialData.recruiterNotes || '',
    resumeUrl: initialData.resumeUrl || (initialData as any)?.sourceMetadata?.originalFilename || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateCandidateId, setDuplicateCandidateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() && !formData.phone.trim()) newErrors.contact = 'Email or Phone is required';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Invalid email format';
    if (formData.currentLocation.trim() === '') newErrors.currentLocation = 'Current Location is required';
    if (formData.currentRole.trim() === '') newErrors.currentRole = 'Current Role is required';
    if (!formData.noticePeriod) newErrors.noticePeriod = 'Notice Period is required';
    if (formData.noticePeriod === 'Custom' && !formData.customNoticePeriod) newErrors.customNoticePeriod = 'Custom Notice Period in Days is required';
    
    // Numeric checks for salaries (if provided)
    if (formData.currentSalary && isNaN(Number(formData.currentSalary))) newErrors.currentSalary = 'Must be a number';
    if (formData.expectedSalary && isNaN(Number(formData.expectedSalary))) newErrors.expectedSalary = 'Must be a number';
    if (formData.expectedSalary && Number(formData.expectedSalary) < 0) newErrors.expectedSalary = 'Cannot be negative';
    if (formData.currentSalary && Number(formData.currentSalary) < 0) newErrors.currentSalary = 'Cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = () => {
    if (isEditMode) return false;
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

  const performSave = () => {
    const parsedSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const parsedLanguages = formData.languages.split(',').map(s => s.trim()).filter(Boolean);
    const finalNoticePeriod = formData.noticePeriod === 'Custom' ? `${formData.customNoticePeriod} Days` : formData.noticePeriod;
    
    if (isEditMode && initialData.id) {
      updateCandidate(initialData.id, {
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
      });
    } else {
      createCandidate({
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
        createdMethod: 'Resume Upload',
      });
    }
    onClose();
  };

  const handleSave = () => {
    if (!validate()) return;
    if (!showDuplicateWarning && checkForDuplicates()) return;
    performSave();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{isEditMode ? 'Edit Candidate Profile' : 'Review Extracted Candidate Details'}</h2>
            {!isEditMode && <p className="text-sm text-slate-500">Verify extracted data and add recruitment details before saving.</p>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-8">
          
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Please resolve validation errors before saving.</p>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {showDuplicateWarning && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="w-full">
                <p className="font-semibold text-sm">A candidate with this email address or phone number already exists.</p>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => window.open(`/job-desk/candidates/${duplicateCandidateId}`, '_blank')} className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
                    View Existing Candidate
                  </button>
                  <button onClick={performSave} className="text-sm font-medium text-amber-700 hover:text-amber-900 underline ml-auto">
                    Continue Anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Personal Details */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Personal Details</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Extracted</span>}
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <input type="url" value={formData.linkedInUrl} onChange={e => setFormData({...formData, linkedInUrl: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
              </div>
            </div>
            {errors.contact && <p className="text-red-500 text-xs mt-2">{errors.contact}</p>}
          </section>

          {/* Professional Summary */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Professional Summary</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Extracted</span>}
            </div>
            <textarea 
              rows={3} 
              value={formData.professionalSummary} 
              onChange={e => setFormData({...formData, professionalSummary: e.target.value})} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" 
            />
          </section>

          {/* Current Role & Employment History */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Employment</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Extracted</span>}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
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

            <h5 className="font-medium text-slate-700 mb-3 text-sm">Employment History</h5>
            <div className="space-y-4">
              {formData.employmentHistory.map((entry, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg relative bg-slate-50">
                  <button type="button" onClick={() => {
                    const newHist = [...formData.employmentHistory];
                    newHist.splice(index, 1);
                    setFormData({...formData, employmentHistory: newHist});
                  }} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 pr-8">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Company</label><input type="text" value={entry.company} onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].company = e.target.value; setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Role</label><input type="text" value={entry.role} onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].role = e.target.value; setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Location</label><input type="text" value={entry.location} onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].location = e.target.value; setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Duration</label>
                      <div className="flex items-center gap-2">
                        <input type="text" value={entry.startDate} placeholder="Start" onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].startDate = e.target.value; setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                        <span className="text-slate-400">-</span>
                        <input type="text" value={entry.endDate} placeholder="End" onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].endDate = e.target.value; setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Responsibilities (One per line)</label>
                    <textarea rows={3} value={entry.responsibilities?.join('\n')} onChange={(e) => { const newHist = [...formData.employmentHistory]; newHist[index].responsibilities = e.target.value.split('\n'); setFormData({...formData, employmentHistory: newHist}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setFormData({...formData, employmentHistory: [...formData.employmentHistory, {company:'', role:''}]})} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Employment Entry
              </button>
            </div>
          </section>

          {/* Education */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Education</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Extracted</span>}
            </div>
            <div className="space-y-4">
              {formData.educationEntries.map((entry, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Qualification</label><input type="text" value={entry.qualification} onChange={(e) => { const newEd = [...formData.educationEntries]; newEd[index].qualification = e.target.value; setFormData({...formData, educationEntries: newEd}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Institution</label><input type="text" value={entry.institution} onChange={(e) => { const newEd = [...formData.educationEntries]; newEd[index].institution = e.target.value; setFormData({...formData, educationEntries: newEd}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Year</label><input type="text" value={entry.completionYear} onChange={(e) => { const newEd = [...formData.educationEntries]; newEd[index].completionYear = e.target.value; setFormData({...formData, educationEntries: newEd}); }} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" /></div>
                  </div>
                  <button type="button" onClick={() => {
                    const newEd = [...formData.educationEntries];
                    newEd.splice(index, 1);
                    setFormData({...formData, educationEntries: newEd});
                  }} className="text-slate-400 hover:text-red-500 mt-5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setFormData({...formData, educationEntries: [...formData.educationEntries, {qualification:'', institution:''}]})} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Education Entry
              </button>
            </div>
          </section>

          {/* Skills & Languages */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Skills and Languages</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Extracted</span>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                <textarea rows={3} value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Languages (comma separated)</label>
                <textarea rows={3} value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
              </div>
            </div>
          </section>

          {/* Recruitment Details */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-1 bg-amber-400"></div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-semibold text-slate-800">Recruitment Details</h4>
              {!isEditMode && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Add Manually</span>}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Salary <span className="text-xs text-slate-500 font-normal">(Annual CTC / LPA)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input type="text" placeholder="3.20" value={formData.currentSalary} onChange={e => setFormData({...formData, currentSalary: e.target.value})} className={cn("w-full pl-7 pr-3 py-2 border rounded-lg text-sm outline-none", errors.currentSalary ? "border-red-300" : "border-slate-300")} />
                </div>
                {errors.currentSalary && <p className="text-red-500 text-xs mt-1">{errors.currentSalary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary <span className="text-xs text-slate-500 font-normal">(Annual CTC / LPA)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input type="text" placeholder="3.80" value={formData.expectedSalary} onChange={e => setFormData({...formData, expectedSalary: e.target.value})} className={cn("w-full pl-7 pr-3 py-2 border rounded-lg text-sm outline-none", errors.expectedSalary ? "border-red-300" : "border-slate-300")} />
                </div>
                {errors.expectedSalary && <p className="text-red-500 text-xs mt-1">{errors.expectedSalary}</p>}
                {(formData.expectedSalary && formData.currentSalary && Number(formData.expectedSalary) < Number(formData.currentSalary)) && (
                   <p className="text-amber-500 text-[10px] mt-1 font-medium">Warning: Expected is lower than Current.</p>
                )}
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

            {formData.noticePeriod === 'Custom' && (
              <div className="mb-4 w-1/3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period in Days *</label>
                <input type="number" value={formData.customNoticePeriod} onChange={e => setFormData({...formData, customNoticePeriod: e.target.value})} className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none", errors.customNoticePeriod ? "border-red-300" : "border-slate-300")} />
                {errors.customNoticePeriod && <p className="text-red-500 text-xs mt-1">{errors.customNoticePeriod}</p>}
              </div>
            )}

            {formData.noticePeriod === 'Serving Notice' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Working Date</label><input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Available From</label><input type="date" value={formData.availableFrom} onChange={e => setFormData({...formData, availableFrom: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Location</label>
                  <input type="text" value={formData.preferredLocation} onChange={e => setFormData({...formData, preferredLocation: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Willing to Relocate</label>
                  <select value={formData.willingToRelocate} onChange={e => setFormData({...formData, willingToRelocate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                    <option value="">Select...</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recruiter Notes</label>
              <textarea rows={2} value={formData.recruiterNotes} onChange={e => setFormData({...formData, recruiterNotes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium text-slate-500">Source</label>
                <div className="font-medium text-sm text-slate-800 bg-slate-100 px-3 py-1.5 rounded inline-block mt-1">Manual Entry</div>
              </div>
              <div className="text-right">
                <label className="block text-xs font-medium text-slate-500">Attached Resume</label>
                <div className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{formData.resumeUrl || 'None'}</div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
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
            className="px-6 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isEditMode ? 'Save Changes' : 'Save Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
