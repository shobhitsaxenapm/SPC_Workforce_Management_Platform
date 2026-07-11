import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockRequirements, mockClients, mockJobs, mockUsers } from '../data/mockData';
import { Briefcase, Building2, MapPin, Calendar, Users, AlertCircle, Plus, FileText, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { JobVisibility } from '../types';

export default function RequirementDetail() {
  const { id } = useParams();
  const req = mockRequirements.find(r => r.id === id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Job Form State (inherits some from req)
  const [formData, setFormData] = useState({
    title: req?.roleTitle || '',
    location: req?.locations[0] || '',
    openings: req ? req.positionsRequired - req.positionsFilled : 1,
    experienceRange: '',
    requiredSkills: '',
    preferredSkills: '',
    summary: '',
    applicationDeadline: '',
    visibility: 'Public' as JobVisibility
  });
  
  if (!req) return <div>Requirement not found</div>;

  const client = mockClients.find(c => c.id === req.clientId);
  const recruiter = mockUsers.find(u => u.id === req.assignedRecruiterId);
  const jobs = mockJobs.filter(j => j.requirementId === req.id);
  const progress = (req.positionsFilled / req.positionsRequired) * 100;

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || formData.openings < 1 || !formData.requiredSkills || !formData.summary) return;
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({
        title: req.roleTitle, location: req.locations[0], openings: req.positionsRequired - req.positionsFilled,
        experienceRange: '', requiredSkills: '', preferredSkills: '', summary: '', applicationDeadline: '', visibility: 'Public'
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <Link to="/clients" className="text-slate-500 hover:text-slate-800">Clients</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link to={`/clients/${client?.id}`} className="text-slate-500 hover:text-slate-800">{client?.name}</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 font-mono">{req.code}</span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Put On Hold
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Edit
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{req.title}</h1>
                <p className="text-slate-500 mt-1">{req.roleTitle} • {req.projectName}</p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium border",
                req.status === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
                req.status === 'In Progress' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                req.status === 'Partially Filled' ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
              )}>
                {req.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Target Date</p>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(req.targetJoiningDate)}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Priority</p>
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-semibold",
                  req.priority === 'Critical' ? "text-red-700" :
                  req.priority === 'High' ? "text-amber-700" :
                  req.priority === 'Medium' ? "text-blue-700" :
                  "text-slate-700"
                )}>
                  {req.priority === 'Critical' && <AlertCircle className="w-4 h-4" />}
                  {req.priority}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Employment</p>
                <p className="text-slate-800 font-medium">{req.employmentType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Duration</p>
                <p className="text-slate-800 font-medium">{req.contractDuration}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Locations</h3>
              <div className="flex gap-2">
                {req.locations.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Linked Jobs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Published Jobs</h3>
              <span className="text-sm font-medium text-slate-500">{jobs.length} Jobs</span>
            </div>
            <div className="divide-y divide-slate-100">
              {jobs.map(job => (
                <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="font-medium text-slate-800 hover:text-blue-600 block mb-1">
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{job.code}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{job.filled} / {job.openings} Filled</p>
                      <p className="text-xs text-slate-500 mt-1">{job.status}</p>
                    </div>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p>No jobs created yet. Create a job to start sourcing.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Fulfillment Progress</h3>
            <div className="flex justify-between items-end mb-2">
              <div className="text-3xl font-bold text-slate-800">{req.positionsFilled}</div>
              <div className="text-sm font-medium text-slate-500 mb-1">of {req.positionsRequired} required</div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
              <div 
                className={cn(
                  "h-2.5 rounded-full transition-all duration-500",
                  progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.max(progress, 2)}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600 text-center">{req.positionsRequired - req.positionsFilled} positions remaining</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Assignment</h3>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                {recruiter?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{recruiter?.name}</p>
                <p className="text-xs text-slate-500">{recruiter?.role}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-3">Client</h3>
              <div className="flex flex-col gap-2">
                <Link to={`/clients/${client?.id}`} className="font-medium text-blue-600 hover:underline">{client?.name}</Link>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {client?.industry}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Job from Requirement</h2>
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Job Created</h3>
                  <p className="text-slate-500">The job has been created and published successfully.</p>
                </div>
              ) : (
                <form id="createJobForm" onSubmit={handleCreateJob} className="space-y-6">
                  
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col gap-1 mb-2">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Inherited from Requirement</span>
                    <p className="text-sm text-slate-700 font-medium">{client?.name} • {req.projectName}</p>
                    <p className="text-xs text-slate-600">Target Date: {formatDate(req.targetJoiningDate)}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                        <select required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="">Select location...</option>
                          {req.locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
                        <input type="number" min="1" max={req.positionsRequired - req.positionsFilled} required value={formData.openings} onChange={e => setFormData({...formData, openings: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        <p className="text-xs text-slate-500 mt-1">Max allowed: {req.positionsRequired - req.positionsFilled}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Range</label>
                        <input type="text" placeholder="e.g. 2-4 Years" value={formData.experienceRange} onChange={e => setFormData({...formData, experienceRange: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills *</label>
                        <input type="text" required placeholder="Comma separated..." value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Description</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary *</label>
                      <textarea required rows={4} value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"></textarea>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Publishing Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                        <select value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value as JobVisibility})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="Public">Public (Careers Page)</option>
                          <option value="Private">Private (Sourcing Only)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                        <input type="date" value={formData.applicationDeadline} onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between sticky bottom-0 z-10">
              {!isSuccess ? (
                <>
                  <button 
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
                      type="submit"
                      form="createJobForm"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
