import fs from 'fs';

const content = `import React, { useState } from 'react';
import { mockUsers } from '../data/mockData';
import { Plus, Search, X, Trash2, AlertTriangle, MoreVertical, Edit2, Ban, PauseCircle, PlayCircle, Eye, FileText } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import ProjectFormModal from './ProjectFormModal';
import { Project } from '../types';

export default function ProjectsList() {
  const { projects, clients, applications, deleteProject, updateProjectStatus, setQuickViewClientId } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectIdToEdit, setProjectIdToEdit] = useState<string | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ clientId: '', status: '', engagementType: '' });
  
  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const statusOptions = ['Draft', 'Active', 'On Hold', 'Completed', 'Cancelled'].map(s => ({ value: s, label: s }));
  const engagementTypeOptions = ['Direct Recruitment', 'Staffing – SPC Payroll'].map(p => ({ value: p, label: p }));

  const filterFields: FilterField[] = [
    { key: 'clientId', label: 'Client', options: clientOptions },
    { key: 'status', label: 'Status', options: statusOptions },
    { key: 'engagementType', label: 'Engagement Type', options: engagementTypeOptions },
  ];

  const calculateFilled = (projectId: string) => {
    return applications.filter(a => a.projectId === projectId && a.currentStage === 'Joined').length;
  };

  const getFulfilmentStatus = (filled: number, required: number) => {
    if (filled === 0) return 'Unfilled';
    if (filled >= required) return 'Fulfilled';
    return 'Partially Filled';
  };

  const filteredProjects = projects.filter(proj => {
    const client = clients.find(c => c.id === proj.clientId);
    const matchSearch = !searchTerm || 
      proj.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClient = !filters.clientId || proj.clientId === filters.clientId;
    const matchStatus = !filters.status || proj.status === filters.status;
    const matchEngagementType = !filters.engagementType || proj.engagementType === filters.engagementType;
    const matchDate = isDateInPreset(proj.createdAt, datePreset, customStart, customEnd);
    return matchSearch && matchClient && matchStatus && matchEngagementType && matchDate;
  });

  return (
    <div className="space-y-6" onClick={() => setOpenActionMenuId(null)}>
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track client project engagements before they become jobs and candidate pipelines.</p>
        <button onClick={() => { setProjectIdToEdit(undefined); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by project name, client, or code..." 
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
              setFilters({ clientId: '', status: '', engagementType: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Date: {datePreset === 'Custom' ? \`\${customStart || 'Any'} to \${customEnd || 'Any'}\` : datePreset}
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
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-3/12">Project Name & Code</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-3/12">Client & Engagement</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Fulfillment Progress</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Owner & Deadline</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-2/12">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(proj => {
                const client = clients.find(c => c.id === proj.clientId);
                const filled = calculateFilled(proj.id);
                const progress = (filled / proj.totalRequestedHeadcount) * 100;
                const isMenuOpen = openActionMenuId === proj.id;
                const isReadonly = proj.status === 'Completed' || proj.status === 'Cancelled';
                
                return (
                  <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link to={\`/projects/\${proj.id}\`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate">
                          {proj.projectName}
                        </Link>
                        <span className="text-xs text-slate-500 mt-0.5">{proj.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => setQuickViewClientId(proj.clientId)}
                          className="font-medium text-slate-700 hover:text-blue-600 text-left truncate transition-colors"
                        >
                          {client?.name}
                        </button>
                        <span className="text-xs text-slate-500 mt-0.5 truncate">{proj.engagementType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{filled} / {proj.totalRequestedHeadcount}</span>
                          <span className="text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={\`bg-blue-500 h-1.5 rounded-full \${progress >= 100 ? 'bg-green-500' : ''}\`} 
                            style={{ width: \`\${Math.min(progress, 100)}%\` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-sm">{proj.projectOwner || 'Unassigned'}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{proj.targetJoiningDate ? formatDate(proj.targetJoiningDate) : 'No Date'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                        proj.status === 'Active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        proj.status === 'Draft' && "bg-slate-50 text-slate-700 border-slate-200",
                        proj.status === 'On Hold' && "bg-amber-50 text-amber-700 border-amber-200",
                        proj.status === 'Completed' && "bg-blue-50 text-blue-700 border-blue-200",
                        proj.status === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(isMenuOpen ? null : proj.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden">
                            <div className="py-1">
                              <Link to={\`/projects/\${proj.id}\`} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left">
                                <Eye className="w-4 h-4 mr-2 text-slate-400" />
                                View Details
                              </Link>
                              
                              <button 
                                onClick={() => { setProjectIdToEdit(proj.id); setIsModalOpen(true); }}
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                              >
                                <Edit2 className="w-4 h-4 mr-2 text-slate-400" />
                                Edit Project
                              </button>
                              
                              {proj.status === 'Draft' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateProjectStatus(proj.id, 'Active'); setOpenActionMenuId(null); }}
                                  className="flex items-center px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 w-full text-left"
                                >
                                  <PlayCircle className="w-4 h-4 mr-2 text-emerald-500" />
                                  Activate
                                </button>
                              )}
                              
                              {proj.status === 'Active' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateProjectStatus(proj.id, 'On Hold'); setOpenActionMenuId(null); }}
                                  className="flex items-center px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 w-full text-left"
                                >
                                  <PauseCircle className="w-4 h-4 mr-2 text-amber-500" />
                                  Put On Hold
                                </button>
                              )}
                              
                              {proj.status === 'On Hold' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateProjectStatus(proj.id, 'Active'); setOpenActionMenuId(null); }}
                                  className="flex items-center px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 w-full text-left"
                                >
                                  <PlayCircle className="w-4 h-4 mr-2 text-emerald-500" />
                                  Resume Activity
                                </button>
                              )}

                              <div className="h-px bg-slate-200 my-1"></div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateProjectStatus(proj.id, 'Cancelled');
                                  setOpenActionMenuId(null);
                                }}
                                disabled={isReadonly}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50 disabled:hover:bg-white"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Cancel Project
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(proj);
                                  setOpenActionMenuId(null);
                                }}
                                disabled={isReadonly}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50 disabled:hover:bg-white"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-slate-300 mb-2" />
                      <p>No projects found matching your criteria.</p>
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({ clientId: '', status: '', engagementType: '' });
                          setDatePreset('All Time');
                        }}
                        className="mt-2 text-blue-600 hover:underline text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProjectFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectIdToEdit(undefined);
        }}
        projectIdToEdit={projectIdToEdit}
      />

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Project?</h2>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{projectToDelete.projectName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/ProjectsList.tsx', content);
