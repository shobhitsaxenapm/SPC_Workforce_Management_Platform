import React, { useState } from 'react';
import { Search, AlertTriangle, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';
import { FileText, UserPlus, FileCheck } from 'lucide-react';

export default function CandidatesList() {
  const { candidates, applications, jobs, clients, createCandidate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreationMethodModal, setShowCreationMethodModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ 
    source: '', 
    stage: '', 
    location: '', 
    availability: '', 
    recruiter: '' 
  });

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', currentLocation: '',
    totalExperience: '', currentCompany: '', currentRole: '',
    skills: '', education: '', currentSalary: '', expectedSalary: '',
    noticePeriod: '',
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
      resumeUrl: undefined,
      source: 'Manual Entry',
    });
    setIsSubmitting(false);
    if (!result.success) { setErrorMsg(result.error || 'Failed.'); return; }
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', currentLocation: '', totalExperience: '', currentCompany: '', currentRole: '', skills: '', education: '', currentSalary: '', expectedSalary: '', noticePeriod: '' });
    }, 1500);
  };

  const sources = [...new Set(candidates.map(c => c.source).filter(Boolean))] as string[];
  const locations = [...new Set(candidates.map(c => c.currentLocation).filter(Boolean))] as string[];
  const availabilities = [...new Set(candidates.map(c => c.noticePeriod).filter(Boolean))] as string[];
  
  const canonicalStages = ['Sourced', 'Interviewing', 'Selected', 'Offered', 'Hired', 'Joined', 'Rejected', 'Withdrawn'];
  
  // Get all unique recruiter IDs assigned to active jobs
  const activeJobs = jobs.filter(j => j.status !== 'Closed' && j.status !== 'Cancelled');
  const recruiterIds = [...new Set(activeJobs.map(j => j.assignedRecruiterId).filter(Boolean))] as string[];
  const recruiters = recruiterIds.map(id => {
    const user = mockUsers.find(u => u.id === id);
    return { value: id, label: user?.name || id };
  });

  const filterFields: FilterField[] = [
    { key: 'stage', label: 'Stage', options: canonicalStages.map(s => ({ value: s, label: s })) },
    { key: 'source', label: 'Source', options: sources.map(s => ({ value: s, label: s })) },
    { key: 'location', label: 'Location', options: locations.map(l => ({ value: l, label: l })) },
    { key: 'availability', label: 'Availability', options: availabilities.map(a => ({ value: a, label: a })) },
    { key: 'recruiter', label: 'Recruiter', options: recruiters },
  ];

  const filteredCandidates = candidates.filter(c => {
    const candidateApps = applications.filter(a => a.candidateId === c.id);
    const activeCandidateApps = candidateApps.filter(a => !['Rejected', 'Withdrawn'].includes(a.currentStage));
    const assignedRecruiterIds = activeCandidateApps.map(a => {
      const job = jobs.find(j => j.id === a.jobId);
      return job?.assignedRecruiterId;
    }).filter(Boolean);

    const matchSearch = !searchTerm ||
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchSource = !filters.source || c.source === filters.source;
    const matchLocation = !filters.location || c.currentLocation === filters.location;
    const matchAvailability = !filters.availability || c.noticePeriod === filters.availability;
    const matchStage = !filters.stage || candidateApps.some(a => a.currentStage === filters.stage);
    const matchRecruiter = !filters.recruiter || assignedRecruiterIds.includes(filters.recruiter);
    
    const matchDate = isDateInPreset(c.createdAt || '2026-07-11T12:00:00Z', datePreset, customStart, customEnd);
    
    return matchSearch && matchSource && matchLocation && matchAvailability && matchStage && matchRecruiter && matchDate;
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
              setFilters({ source: '', stage: '', location: '', availability: '', recruiter: '' });
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
                <th className="px-6 py-4">Active Jobs & Stages</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map(candidate => {
                const candidateApps = applications.filter(a => a.candidateId === candidate.id);
                const activeCandidateApps = candidateApps.filter(a => !['Rejected', 'Withdrawn'].includes(a.currentStage));
                
                // Sort to find latest active app, fallback to latest overall
                const sortedApps = (activeCandidateApps.length > 0 ? activeCandidateApps : candidateApps).sort((a, b) => 
                  new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
                );
                
                const latestApp = sortedApps[0];
                const latestJob = latestApp ? jobs.find(j => j.id === latestApp.jobId) : null;
                const additionalActiveCount = activeCandidateApps.length > 1 ? activeCandidateApps.length - 1 : 0;
                
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
                      {latestJob ? (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <Link to={`/candidates/${candidate.id}?tab=Jobs`} className="font-medium text-slate-700 hover:text-blue-600 truncate max-w-[200px]">
                              {latestJob.title}
                            </Link>
                            <span className="text-slate-400 font-mono text-xs">·</span>
                            <span className="text-xs text-slate-500 font-mono">{latestJob.code}</span>
                            <span className="text-slate-400 font-mono text-xs">·</span>
                            {latestApp && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                                {latestApp.currentStage}
                              </span>
                            )}
                          </div>
                          {additionalActiveCount > 0 && (
                            <div>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActivePopoverId(activePopoverId === candidate.id ? null : candidate.id);
                                }}
                                className="text-xs font-semibold text-blue-600 mt-1 inline-block hover:underline focus:outline-none"
                              >
                                +{additionalActiveCount} more
                              </button>
                              
                              {activePopoverId === candidate.id && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
                                    <span className="text-xs font-semibold text-slate-700">Other Active Jobs</span>
                                    <button 
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivePopoverId(null); }}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto p-2">
                                    {sortedApps.slice(1).map(app => {
                                      const j = jobs.find(jb => jb.id === app.jobId);
                                      const client = j ? clients.find(c => c.id === j.clientId) : null;
                                      if (!j) return null;
                                      
                                      return (
                                        <Link key={app.id} to={`/candidates/${candidate.id}?tab=Jobs`} className="block p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">{j.title}</p>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-slate-500 font-mono">{j.code}</span>
                                                {client && (
                                                  <>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-xs text-slate-600 truncate">{client.name}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap">
                                              {app.currentStage}
                                            </span>
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                  <Link to={`/candidates/${candidate.id}?tab=Jobs`} className="block text-center text-xs font-medium text-blue-600 bg-blue-50 py-2 hover:bg-blue-100 transition-colors border-t border-slate-100">
                                    View all hiring progress
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">No active application</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-xs">{candidate.source}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {latestApp ? formatDate(latestApp.lastActivity) : '-'}
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
