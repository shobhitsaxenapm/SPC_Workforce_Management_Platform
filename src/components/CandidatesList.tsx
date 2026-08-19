import React, { useState } from 'react';
import { Search, AlertTriangle, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';
import { FileText, UserPlus, FileCheck } from 'lucide-react';

export default function CandidatesList() {
  const { candidates, applications, jobs, createCandidate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreationMethodModal, setShowCreationMethodModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ source: '', experience: '' });

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', currentLocation: '',
    totalExperience: '', currentCompany: '', currentRole: '',
    skills: '', education: '', currentSalary: '', expectedSalary: '',
    noticePeriod: '', resumeUrl: '', source: 'Manual Entry',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    if (!formData.fullName.trim()) { setErrorMsg('Full name is required.'); return; }
    if (!formData.email.trim() && !formData.phone.trim()) { setErrorMsg('Please provide at least email or phone.'); return; }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) { setErrorMsg('Please enter a valid email address.'); return; }

    setIsSubmitting(true);
    const result = createCandidate({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      currentLocation: formData.currentLocation.trim(),
      totalExperience: formData.totalExperience || 'Fresher',
      currentCompany: formData.currentCompany.trim() || 'N/A',
      currentRole: formData.currentRole.trim(),
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      education: formData.education.trim() || 'Graduate',
      currentSalary: formData.currentSalary || '0',
      expectedSalary: formData.expectedSalary || '0',
      noticePeriod: formData.noticePeriod || 'Immediate',
      resumeUrl: formData.resumeUrl || undefined,
      source: formData.source,
    });
    setIsSubmitting(false);
    if (!result.success) { setErrorMsg(result.error || 'Failed.'); return; }
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', currentLocation: '', totalExperience: '', currentCompany: '', currentRole: '', skills: '', education: '', currentSalary: '', expectedSalary: '', noticePeriod: '', resumeUrl: '', source: 'Manual Entry' });
    }, 1500);
  };

  const sources = [...new Set(candidates.map(c => c.source).filter(Boolean))] as string[];
  const experiences = [...new Set(candidates.map(c => c.totalExperience).filter(Boolean))] as string[];

  const filterFields: FilterField[] = [
    { key: 'source', label: 'Source', options: sources.map(s => ({ value: s, label: s })) },
    { key: 'experience', label: 'Experience', options: experiences.map(e => ({ value: e, label: e })) },
  ];

  const filteredCandidates = candidates.filter(c => {
    const matchSearch = !searchTerm ||
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSource = !filters.source || c.source === filters.source;
    const matchExp = !filters.experience || c.totalExperience === filters.experience;
    const matchDate = isDateInPreset(c.createdAt || '2026-07-11T12:00:00Z', datePreset, customStart, customEnd);
    return matchSearch && matchSource && matchExp && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">View candidate profiles and their applications across client jobs.</p>
        <button onClick={() => setShowCreationMethodModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, skills, location..." 
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
            fields={filterFields}
            values={filters}
            onChange={(k, v) => setFilters({ ...filters, [k]: v })}
            onClear={() => {
              setFilters({ source: '', experience: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Created Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role & Experience</th>
                <th className="px-6 py-4">Top Skills</th>
                <th className="px-6 py-4">Current Application</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map(candidate => {
                const activeApp = applications.find(a => a.candidateId === candidate.id);
                const activeJob = activeApp ? jobs.find(j => j.id === activeApp.jobId) : null;
                
                return (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/candidates/${candidate.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{candidate.fullName}</p>
                          {candidate.resumeUrl && <FileCheck className="w-3.5 h-3.5 text-blue-500" title="Resume Attached" />}
                          {candidate.duplicateStatus !== 'None' && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" title={candidate.duplicateStatus} />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{candidate.currentLocation}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800">{candidate.currentRole || 'N/A'}</p>
                      <p className="text-xs text-slate-500 mt-1">{candidate.totalExperience} • {candidate.currentCompany || 'No Company'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {candidate.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded border border-slate-200">
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded border border-slate-200">
                            +{candidate.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activeJob ? (
                        <div>
                          <p className="font-medium text-slate-700">{activeJob.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{activeJob.code}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No active application</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeApp ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          {activeApp.currentStage}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-xs">{candidate.source}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredCandidates.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No candidates match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Add Candidate (Legacy Manual)</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Candidate Added</h3>
                  <p className="text-slate-500 text-sm">The candidate has been added to the pool.</p>
                </div>
              ) : (
                <form id="createCandidateForm" onSubmit={handleSubmit} className="space-y-6">
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errorMsg}</div>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                        <input type="text" value={formData.currentLocation} onChange={e => setFormData({...formData, currentLocation: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">At least one of email or phone is required.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Professional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Experience</label>
                        <select value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                          <option value="">Select...</option>
                          <option value="Fresher">Fresher</option>
                          <option value="1-3 Years">1-3 Years</option>
                          <option value="3-5 Years">3-5 Years</option>
                          <option value="5+ Years">5+ Years</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Company</label>
                        <input type="text" value={formData.currentCompany} onChange={e => setFormData({...formData, currentCompany: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Role</label>
                        <input type="text" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
                        <input type="text" placeholder="e.g. B.Tech, MBA" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                        <input type="text" placeholder="e.g. Excel, Data Entry, Typing" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Compensation & Availability</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Salary (LPA)</label>
                        <input type="text" placeholder="e.g. 3.5" value={formData.currentSalary} onChange={e => setFormData({...formData, currentSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary (LPA)</label>
                        <input type="text" placeholder="e.g. 4.5" value={formData.expectedSalary} onChange={e => setFormData({...formData, expectedSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                        <select value={formData.noticePeriod} onChange={e => setFormData({...formData, noticePeriod: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                          <option value="">Select...</option>
                          <option value="Immediate">Immediate</option>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Source & Resume</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                        <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                          <option value="Manual Entry">Manual Entry</option>
                          <option value="Referral">Referral</option>
                          <option value="Job Portal">Job Portal</option>
                          <option value="Careers Portal">Careers Portal</option>
                          <option value="LinkedIn">LinkedIn</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Resume Filename</label>
                        <input type="text" placeholder="e.g. resume_john.pdf" value={formData.resumeUrl} onChange={e => setFormData({...formData, resumeUrl: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              {!isSuccess && (
                <button type="submit" form="createCandidateForm" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                  Add Candidate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Creation Method Selection Modal */}
      {showCreationMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Add Candidate</h2>
              <button onClick={() => setShowCreationMethodModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex gap-4">
              <button 
                onClick={() => {
                  setShowCreationMethodModal(false);
                  setShowUpload(true);
                }}
                className="flex-1 flex flex-col items-center gap-3 p-6 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Upload Resume</h3>
                  <p className="text-xs text-slate-500 mt-1">Extract details from PDF or DOCX automatically</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowCreationMethodModal(false);
                  setIsModalOpen(true);
                  setErrorMsg(null);
                }}
                className="flex-1 flex flex-col items-center gap-3 p-6 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Add Manually</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter candidate details manually in a form</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Smart Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <button 
              onClick={() => setShowUpload(false)} 
              className="absolute top-4 right-4 z-10 p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm hover:shadow border border-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
              <SmartCandidateUpload 
                onExtractionSuccess={(data, meta) => {
                  setExtractedData({...data, resumeUrl: meta.originalFilename});
                  setShowUpload(false);
                  setShowReviewForm(true);
                }}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Review Form Modal */}
      {showReviewForm && extractedData && (
        <CandidateFormModal 
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          initialData={extractedData}
          isEditMode={false}
        />
      )}
    </div>
  );
}
