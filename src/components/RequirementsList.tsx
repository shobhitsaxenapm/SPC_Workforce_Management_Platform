import React, { useState } from 'react';
import { mockUsers } from '../data/mockData';
import { Plus, Search, X, Trash2, AlertTriangle, MoreVertical, Edit2, Ban, PauseCircle, PlayCircle, Eye } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import ClientRequirementFormModal from './ClientRequirementFormModal';
import { ClientRequirement } from '../types';

export default function RequirementsList() {
  const { requirements, clients, applications, deleteRequirement, updateRequirementLifecycle } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState<string | undefined>(undefined);
  const [requirementToDelete, setRequirementToDelete] = useState<ClientRequirement | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ clientId: '', status: '', priority: '' });
  
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const statusOptions = ['Draft', 'Open', 'On Hold', 'Closed', 'Cancelled'].map(s => ({ value: s, label: s }));
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }));

  const filterFields: FilterField[] = [
    { key: 'clientId', label: 'Client', options: clientOptions },
    { key: 'status', label: 'Status', options: statusOptions },
    { key: 'priority', label: 'Priority', options: priorityOptions },
  ];

  const calculateFilled = (reqId: string) => {
    return applications.filter(a => a.requirementId === reqId && a.currentStage === 'Joined').length;
  };

  const getFulfilmentStatus = (filled: number, required: number) => {
    if (filled === 0) return 'Unfilled';
    if (filled >= required) return 'Fulfilled';
    return 'Partially Filled';
  };

  const filteredReqs = requirements.filter(req => {
    const client = clients.find(c => c.id === req.clientId);
    const matchSearch = !searchTerm || 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClient = !filters.clientId || req.clientId === filters.clientId;
    const matchStatus = !filters.status || req.lifecycleStatus === filters.status;
    const matchPriority = !filters.priority || req.priority === filters.priority;
    const matchDate = isDateInPreset(req.createdAt, datePreset, customStart, customEnd);
    return matchSearch && matchClient && matchStatus && matchPriority && matchDate;
  });

  return (
    <div className="space-y-6" onClick={() => setOpenActionMenuId(null)}>
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track client deployment requests before they become jobs and candidate pipelines.</p>
        <button onClick={() => { setRequirementToEdit(undefined); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Client Requirement
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by business unit, role, client, or requirement code..." 
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

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Role & Code</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-3/12">Client</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Fulfillment Progress</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Deadline & Priority</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Status & Recruiter</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReqs.map(req => {
                const client = clients.find(c => c.id === req.clientId);
                const recruiter = mockUsers.find(u => u.id === req.assignedRecruiterId);
                const filled = calculateFilled(req.id);
                const progress = (filled / req.positionsRequired) * 100;
                const fulfilmentStatus = getFulfilmentStatus(filled, req.positionsRequired);
                const isMenuOpen = openActionMenuId === req.id;
                const isReadonly = req.lifecycleStatus === 'Closed' || req.lifecycleStatus === 'Cancelled';
                
                return (
                  <tr key={req.id} onClick={() => navigate(`/requirements/${req.id}`)} className="hover:bg-gray-50 transition-colors group cursor-pointer border-b border-gray-100 last:border-0 relative">
                    <td className="px-4 py-3">
                      <div className="block overflow-hidden">
                        <div className="text-sm font-semibold text-gray-900 truncate">{req.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{req.code}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 truncate block" onClick={e => e.stopPropagation()}>
                        <Link to={`/clients/${client?.id}`} className="hover:text-blue-600">{client?.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 w-full pr-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-700">{filled} / {req.positionsRequired} Filled</span>
                          <span className={cn(
                            "font-medium",
                            fulfilmentStatus === 'Fulfilled' ? "text-green-600" :
                            fulfilmentStatus === 'Partially Filled' ? "text-amber-600" :
                            "text-gray-500"
                          )}>{fulfilmentStatus}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              fulfilmentStatus === 'Fulfilled' ? "bg-green-500" :
                              fulfilmentStatus === 'Partially Filled' ? "bg-amber-500" :
                              "bg-gray-500"
                            )}
                            style={{ width: `${Math.max(progress, 2)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="text-sm text-gray-700">{formatDate(req.targetJoiningDate)}</span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          req.priority === 'Critical' ? "text-rose-700 bg-rose-50" :
                          req.priority === 'High' ? "text-amber-700 bg-amber-50" :
                          req.priority === 'Medium' ? "text-blue-700 bg-blue-50" :
                          "text-gray-700 bg-gray-100"
                        )}>
                          {req.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex items-center gap-1.5 truncate w-full">
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600 shrink-0">
                            {recruiter?.name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{recruiter?.name.split(' ')[0]}</span>
                        </div>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          req.lifecycleStatus === 'Open' ? "bg-blue-50 text-blue-700" :
                          req.lifecycleStatus === 'Draft' ? "bg-slate-100 text-slate-700" :
                          req.lifecycleStatus === 'On Hold' ? "bg-amber-50 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {req.lifecycleStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenActionMenuId(isMenuOpen ? null : req.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {isMenuOpen && (
                        <div 
                          className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 text-left"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setOpenActionMenuId(null); navigate(`/requirements/${req.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                          
                          {!isReadonly && (
                            <button
                              onClick={() => { setOpenActionMenuId(null); setRequirementToEdit(req.id); setIsModalOpen(true); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit Requirement
                            </button>
                          )}
                          
                          {req.lifecycleStatus === 'Open' && (
                            <button
                              onClick={() => { setOpenActionMenuId(null); updateRequirementLifecycle(req.id, 'On Hold'); }}
                              className="w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                            >
                              <PauseCircle className="w-4 h-4" /> Put on Hold
                            </button>
                          )}
                          
                          {req.lifecycleStatus === 'On Hold' && (
                            <button
                              onClick={() => { setOpenActionMenuId(null); updateRequirementLifecycle(req.id, 'Open'); }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" /> Resume Requirement
                            </button>
                          )}
                          
                          {req.lifecycleStatus !== 'Cancelled' && req.lifecycleStatus !== 'Closed' && (
                            <button
                              onClick={() => { setOpenActionMenuId(null); updateRequirementLifecycle(req.id, 'Cancelled'); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" /> Cancel Requirement
                            </button>
                          )}
                          
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button
                            onClick={() => { setOpenActionMenuId(null); setRequirementToDelete(req); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredReqs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No requirements match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientRequirementFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setRequirementToEdit(undefined); }} 
        requirementIdToEdit={requirementToEdit}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {requirementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Client Requirement</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete requirement <strong>{requirementToDelete.title} ({requirementToDelete.code})</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setRequirementToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  deleteRequirement(requirementToDelete.id);
                  setRequirementToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
