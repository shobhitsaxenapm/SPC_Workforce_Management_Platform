import React, { useState } from 'react';
import { mockUsers } from '../data/mockData';
import { Plus, Search, AlertCircle, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import CreateRequirementModal from './CreateRequirementModal';

export default function RequirementsList() {
  const { requirements, clients, applications } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ clientId: '', status: '', priority: '' });
  
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const statusOptions = ['Open', 'In Progress', 'Partially Filled', 'Fulfilled', 'On Hold', 'Closed'].map(s => ({ value: s, label: s }));
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }));

  const filterFields: FilterField[] = [
    { key: 'clientId', label: 'Client', options: clientOptions },
    { key: 'status', label: 'Status', options: statusOptions },
    { key: 'priority', label: 'Priority', options: priorityOptions },
  ];

  const calculateFilled = (reqId: string) => {
    return applications.filter(a => a.requirementId === reqId && a.currentStage === 'Joined').length;
  };

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
    const matchDate = isDateInPreset(req.createdAt, datePreset, customStart, customEnd);
    return matchSearch && matchClient && matchStatus && matchPriority && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track client deployment requests before they become jobs and candidate pipelines.</p>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Client Requirement
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Business identifier, role, client, or code..." 
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
              setFilters({ clientId: '', status: '', priority: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <th className="px-6 py-4">Business</th>
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
                const filled = calculateFilled(req.id);
                const progress = (filled / req.positionsRequired) * 100;
                
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
                        <span className="font-medium text-slate-700">{filled} / {req.positionsRequired}</span>
                        <span className="text-slate-500">{Math.max(req.positionsRequired - filled, 0)} rem</span>
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

      <CreateRequirementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
