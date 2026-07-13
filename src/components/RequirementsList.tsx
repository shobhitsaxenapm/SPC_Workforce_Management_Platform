import React, { useState } from 'react';
import { mockUsers } from '../data/mockData';
import { Plus, Search, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Priority } from '../types';
import AIInsightCard from './AIInsightCard';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';

export default function RequirementsList() {
  const { requirements, clients, createRequirement } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ clientId: '', status: '', priority: '' });

  const [formData, setFormData] = useState({
    clientId: '',
    roleTitle: '',
    title: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.clientId || !formData.roleTitle || formData.positionsRequired < 1 || !formData.targetJoiningDate || !formData.assignedRecruiterId) return;
    
    setIsSubmitting(true);
    createRequirement({
      clientId: formData.clientId,
      title: formData.title.trim() || `${formData.roleTitle} Requirement`,
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
    });
    setIsSubmitting(false);
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({
        clientId: '', roleTitle: '', title: '', projectName: '', locations: '', positionsRequired: 1, 
        employmentType: 'Full-time', contractDuration: '', targetJoiningDate: '', 
        priority: 'Medium', assignedRecruiterId: '', notes: ''
      });
    }, 1500);
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const statusOptions = ['Open', 'In Progress', 'Partially Filled', 'Fulfilled', 'On Hold', 'Closed'].map(s => ({ value: s, label: s }));
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }));

  const filterFields: FilterField[] = [
    { key: 'clientId', label: 'Client', options: clientOptions },
    { key: 'status', label: 'Status', options: statusOptions },
    { key: 'priority', label: 'Priority', options: priorityOptions },
  ];

  const filteredReqs = requirements.filter(req => {
    const client = clients.find(c => c.id === req.clientId);
    const matchSearch = !searchTerm || 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClient = !filters.clientId || req.clientId === filters.clientId;
    const matchStatus = !filters.status || req.status === filters.status;
    const matchPriority = !filters.priority || req.priority === filters.priority;
    return matchSearch && matchClient && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track client deployment requests before they become jobs and candidate pipelines.</p>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Requirement
        </button>
      </div>

      <AIInsightCard 
        title="Requirement Risk Detected"
        severity="warning"
        explanation="2 requirements have 'Critical' priority but are falling behind the required sourcing velocity."
        evidence={[
          "REQ-2023-004 (NorthStar): 4/25 filled, 5 days to target",
          "REQ-2023-006 (Alpha): 0/2 filled, 2 days to target"
        ]}
        actionLabel="View At-Risk Requirements"
        onAction={() => {}}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search requirements by role, client, or code..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <FilterPanel
          fields={filterFields}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onClear={() => setFilters({ clientId: '', status: '', priority: '' })}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Requirement</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Recruiter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReqs.map(req => {
                const client = clients.find(c => c.id === req.clientId);
                const recruiter = mockUsers.find(u => u.id === req.assignedRecruiterId);
                const progress = (req.positionsFilled / req.positionsRequired) * 100;
                
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/requirements/${req.id}`} className="block">
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{req.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{req.code}</span>
                          <span className="text-xs text-slate-500">{req.roleTitle}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/clients/${client?.id}`} className="text-slate-700 hover:text-blue-600">
                        {client?.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">{req.positionsFilled} / {req.positionsRequired}</span>
                        <span className="text-slate-500">{req.positionsRequired - req.positionsFilled} rem</span>
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
                      {formatDate(req.targetJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold",
                        req.priority === 'Critical' ? "text-red-700 bg-red-50 border border-red-200" :
                        req.priority === 'High' ? "text-amber-700 bg-amber-50 border border-amber-200" :
                        req.priority === 'Medium' ? "text-blue-700 bg-blue-50 border border-blue-200" :
                        "text-slate-700 bg-slate-50 border border-slate-200"
                      )}>
                        {req.priority === 'Critical' && <AlertCircle className="w-3.5 h-3.5" />}
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        req.status === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        req.status === 'In Progress' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        req.status === 'Partially Filled' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {recruiter?.name.charAt(0)}
                        </div>
                        <span className="text-slate-700">{recruiter?.name}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReqs.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">No requirements match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Client Requirement</h2>
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Requirement Created</h3>
                  <p className="text-slate-500">The client requirement has been created and is now Open.</p>
                </div>
              ) : (
                <form id="createReqForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Basic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                        <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="">Select a client...</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role Title *</label>
                        <input type="text" required value={formData.roleTitle} onChange={e => setFormData({...formData, roleTitle: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Requirement Title</label>
                        <input type="text" placeholder="Auto-generated if blank" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                        <input type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Locations</label>
                        <input type="text" placeholder="e.g. Mumbai, Delhi" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Engagement Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Positions *</label>
                        <input type="number" min="1" required value={formData.positionsRequired} onChange={e => setFormData({...formData, positionsRequired: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                        <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="Full-time">Full-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contract Duration</label>
                        <input type="text" placeholder="e.g. 6 Months" value={formData.contractDuration} onChange={e => setFormData({...formData, contractDuration: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Execution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Joining Date *</label>
                        <input type="date" required value={formData.targetJoiningDate} onChange={e => setFormData({...formData, targetJoiningDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Recruiter *</label>
                        <select required value={formData.assignedRecruiterId} onChange={e => setFormData({...formData, assignedRecruiterId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
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
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"></textarea>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              {!isSuccess && (
                <button 
                  type="submit"
                  form="createReqForm"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  Create Requirement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
