import React, { useState } from 'react';
import { Plus, Search, MapPin, Briefcase, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Job, JobVisibility, JobStatus } from '../types';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';

export default function JobsList() {
  const { jobs, requirements, clients, createJob } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilters, setJobFilters] = useState<Record<string, string>>({ status: '', clientId: '', employmentType: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Form State
  const [selectedReqId, setSelectedReqId] = useState('none');
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    projectName: '',
    location: '',
    openings: 1,
    employmentType: 'Contract',
    experienceRange: '0-2 Years',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    targetJoiningDate: '',
    applicationDeadline: '',
    visibility: 'Public' as JobVisibility,
  });

  const handleReqChange = (reqId: string) => {
    setSelectedReqId(reqId);
    setValidationError(null);

    if (reqId === 'none') {
      setFormData(prev => ({
        ...prev,
        title: '',
        clientId: '',
        projectName: '',
        location: '',
        openings: 1,
        employmentType: 'Contract',
      }));
    } else {
      const req = requirements.find(r => r.id === reqId);
      if (req) {
        setFormData(prev => ({
          ...prev,
          title: req.roleTitle,
          clientId: req.clientId,
          projectName: req.projectName,
          location: req.locations[0] || 'Delhi',
          openings: Math.max(req.positionsRequired - req.positionsFilled, 1),
          employmentType: req.employmentType,
        }));
      }
    }
  };

  const handleCreateJob = (e: React.FormEvent, status: JobStatus) => {
    e.preventDefault();
    setValidationError(null);

    const title = formData.title.trim();
    const location = formData.location.trim();
    const openings = formData.openings;
    const requiredSkills = formData.requiredSkills.trim();
    const summary = formData.summary.trim();
    const targetJoiningDate = formData.targetJoiningDate;
    const applicationDeadline = formData.applicationDeadline;

    if (!title || !location || openings < 1 || !requiredSkills || !summary || !targetJoiningDate || !applicationDeadline) {
      setValidationError('Please fill in all mandatory fields (*).');
      return;
    }

    // Validation against selected requirement slots
    if (selectedReqId !== 'none') {
      const req = requirements.find(r => r.id === selectedReqId);
      if (req) {
        const maxRemaining = req.positionsRequired - req.positionsFilled;
        if (openings > maxRemaining) {
          setValidationError(`Openings count cannot exceed remaining requirement positions (Max allowed: ${maxRemaining}).`);
          return;
        }
      }
    }

    // Convert comma-separated string to arrays
    const reqSkillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const prefSkillsArray = formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean);

    // Call Mutator
    createJob({
      ...formData,
      requiredSkills: reqSkillsArray,
      preferredSkills: prefSkillsArray,
      responsibilities: ['Support digitisation objectives', 'Validate source entries'],
      qualifications: ['Any Graduate'],
      assignedRecruiterId: 'u3', // Recruit Manager Priya Desai defaults
      status,
    }, selectedReqId);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      // Reset form
      setSelectedReqId('none');
      setFormData({
        title: '',
        clientId: '',
        projectName: '',
        location: '',
        openings: 1,
        employmentType: 'Contract',
        experienceRange: '0-2 Years',
        requiredSkills: '',
        preferredSkills: '',
        summary: '',
        targetJoiningDate: '',
        applicationDeadline: '',
        visibility: 'Public',
      });
    }, 1500);
  };

  const clientOptions = ([...new Set(jobs.map(j => j.clientId))] as string[]).map(cid => {
    const c = clients.find(cl => cl.id === cid);
    return { value: cid, label: (c?.name || cid) as string };
  });
  const jobFilterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Draft', 'Published', 'Paused', 'Filled', 'Closed'].map(s => ({ value: s, label: s })) },
    { key: 'clientId', label: 'Client', options: clientOptions },
    { key: 'employmentType', label: 'Employment Type', options: ['Contract', 'Full-time', 'Part-time'].map(s => ({ value: s, label: s })) },
  ];

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(searchLower);
    const codeMatch = job.code.toLowerCase().includes(searchLower);
    const client = clients.find(c => c.id === job.clientId);
    const clientMatch = client?.name.toLowerCase().includes(searchLower);
    const matchSearch = !searchTerm || titleMatch || codeMatch || clientMatch;
    const matchStatus = !jobFilters.status || job.status === jobFilters.status;
    const matchClient = !jobFilters.clientId || job.clientId === jobFilters.clientId;
    const matchType = !jobFilters.employmentType || job.employmentType === jobFilters.employmentType;
    const matchDate = isDateInPreset(job.publishedAt || job.targetJoiningDate, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchClient && matchType && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage client-facing job openings linked to approved client requirements.</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search jobs by title, client, or code..." 
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
            fields={jobFilterFields}
            values={jobFilters}
            onChange={(k, v) => setJobFilters({ ...jobFilters, [k]: v })}
            onClear={() => {
              setJobFilters({ status: '', clientId: '', employmentType: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Published Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map(job => {
                const client = clients.find(c => c.id === job.clientId);
                const progress = (job.filled / job.openings) * 100;
                
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/job-desk/${job.id}`} className="block">
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{job.code}</span>
                          <span>•</span>
                          <span>{job.employmentType}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {client?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">{job.filled} / {job.openings}</span>
                        <span className="text-slate-500">{job.openings - job.filled} rem</span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full",
                            progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(job.targetJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" :
                        job.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                        job.status === 'Paused' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No matching jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Job Opening</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Job Created</h3>
                  <p className="text-slate-500 text-sm">The job opening has been successfully saved.</p>
                </div>
              ) : (
                <form className="space-y-6">
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                      {validationError}
                    </div>
                  )}

                  {/* Link Requirement (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Link Client Requirement (Optional)
                    </label>
                    <select
                      value={selectedReqId}
                      onChange={e => handleReqChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="none">-- None (Independent Job Posting) --</option>
                      {requirements.map(r => {
                        const client = clients.find(c => c.id === r.clientId);
                        return (
                          <option key={r.id} value={r.id}>
                            {r.code} - {r.title} ({client?.name})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Job details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.title} 
                          onChange={e => setFormData({...formData, title: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                        <select 
                          required 
                          value={formData.location} 
                          onChange={e => setFormData({...formData, location: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">Select location...</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Noida">Noida</option>
                          <option value="Gurugram">Gurugram</option>
                        </select>
                      </div>

                      {selectedReqId === 'none' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                            <select 
                              required 
                              value={formData.clientId} 
                              onChange={e => setFormData({...formData, clientId: e.target.value})} 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            >
                              <option value="">Select Client...</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                            <input 
                              type="text" 
                              required 
                              value={formData.projectName} 
                              onChange={e => setFormData({...formData, projectName: e.target.value})} 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                            />
                          </div>
                        </>
                      ) : null}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
                        <input 
                          type="number" 
                          min="1" 
                          required 
                          value={formData.openings} 
                          onChange={e => setFormData({...formData, openings: parseInt(e.target.value) || 0})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                        <select 
                          value={formData.employmentType} 
                          onChange={e => setFormData({...formData, employmentType: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="Contract">Contract</option>
                          <option value="Full-time">Full-time</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Requirements & Skills
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0-2 Years" 
                          value={formData.experienceRange} 
                          onChange={e => setFormData({...formData, experienceRange: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills * (Comma separated)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Excel, Data entry" 
                          value={formData.requiredSkills} 
                          onChange={e => setFormData({...formData, requiredSkills: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Skills (Comma separated)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Typing speed, healthcare" 
                          value={formData.preferredSkills} 
                          onChange={e => setFormData({...formData, preferredSkills: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Description
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary *</label>
                      <textarea 
                        required 
                        rows={3} 
                        value={formData.summary} 
                        onChange={e => setFormData({...formData, summary: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      Joining details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Joining Date *</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.targetJoiningDate} 
                          onChange={e => setFormData({...formData, targetJoiningDate: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline *</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.applicationDeadline} 
                          onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between sticky bottom-0 z-10">
              {!isSuccess ? (
                <>
                  <button 
                    type="button"
                    onClick={(e) => handleCreateJob(e, 'Draft')}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Save as Draft
                  </button>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleCreateJob(e, 'Published')}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Publish Job
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex justify-end">
                   <button 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Close
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
