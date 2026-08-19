import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, Plus, MoreVertical, ChevronRight, X, CheckCircle2, Search, Trash2, AlertTriangle, Edit3 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import ClientDetailDrawer from './ClientDetailDrawer';
import ClientRequirementFormModal from './ClientRequirementFormModal';
import ClientFormModal from './ClientFormModal';
import { Client, PrimaryIndustry } from '../types';
import { INDUSTRY_OPTIONS } from '../lib/constants';
import SearchableSelect from './SearchableSelect';

export default function ClientsList() {
  const { clients, requirements, applications, currentUser, createClient, deleteClient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', industry: '' });
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createReqClientId, setCreateReqClientId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
    { key: 'industry', label: 'Industry', options: INDUSTRY_OPTIONS },
  ];

  const filteredClients = clients.filter(c => {
    const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || c.status === filters.status;
    const matchIndustry = !filters.industry || c.industry === filters.industry;
    return matchSearch && matchStatus && matchIndustry;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage client organisations, contacts, locations, and active hiring requirements.</p>
        <button 
          onClick={() => { 
            setModalMode('create'); 
            setEditingClient(undefined); 
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <FilterPanel
          fields={filterFields}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onClear={() => setFilters({ status: '', industry: '' })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClients.map(client => {
          const isSelected = selectedClientId === client.id;
          const clientReqs = requirements.filter(r => r.clientId === client.id);
          const activeReqsCount = clientReqs.filter(r => r.status !== 'Closed').length;
          const openPositionsCount = clientReqs.reduce((acc, r) => {
            const filled = applications.filter(a => a.requirementId === r.id && a.currentStage === 'Joined').length;
            return acc + Math.max(r.positionsRequired - filled, 0);
          }, 0);
          
          return (
            <div 
              key={client.id} 
              onClick={() => setSelectedClientId(client.id)}
              className={cn(
                "rounded-xl border p-5 transition-all group cursor-pointer",
                isSelected 
                  ? "border-blue-500 bg-slate-50/50 shadow-md ring-1 ring-blue-500/20" 
                  : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{client.name}</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        client.status === 'Active' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {client.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {client.industry === 'OTHER' && client.industryOtherText 
                        ? client.industryOtherText 
                        : INDUSTRY_OPTIONS.find(o => o.value === client.industry)?.label || client.industry}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {client.locations.join(', ')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {activeReqsCount} Active {activeReqsCount === 1 ? 'Req' : 'Reqs'}
                      </div>
                      <div className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">
                        {openPositionsCount} Open Positions
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto md:border-l md:border-slate-100 md:pl-6">
                  <div className="text-sm">
                    {client.primaryContactName || client.primaryContactEmail || client.primaryContactPhone ? (
                      <>
                        <p className="font-medium text-slate-700">{client.primaryContactName || 'Unnamed Contact'}</p>
                        <p className="text-slate-500">{client.primaryContactEmail || client.primaryContactPhone}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-500 italic">No primary contact</p>
                        {canEdit && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalMode('edit');
                              setEditingClient(client);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1 inline-block"
                          >
                            + Add contact
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto md:ml-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(client.id);
                      }}
                      className={cn(
                        "flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                        isSelected 
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                          : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-slate-200"
                      )}
                    >
                      View Client
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    
                    {canEdit && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === client.id ? null : client.id);
                          }}
                          className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {openDropdownId === client.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  setSelectedClientId(client.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <ChevronRight className="w-4 h-4" />
                                View Client
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  setModalMode('edit');
                                  setEditingClient(client);
                                  setIsModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit Client
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  setClientToDelete(client);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Client
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className="py-12 text-center bg-white border border-slate-200 rounded-xl">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No clients match the current filters.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ClientFormModal 
          mode={modalMode} 
          initialClient={editingClient} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(undefined);
          }} 
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Client</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete <strong>{clientToDelete.name}</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  deleteClient(clientToDelete.id);
                  if (selectedClientId === clientToDelete.id) {
                    setSelectedClientId(null);
                  }
                  setClientToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER-DETAIL SLIDE-OVER DRAWER */}
      <ClientDetailDrawer 
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onCreateRequirement={(cId) => setCreateReqClientId(cId)}
      />

      {/* CREATE REQUIREMENT MODAL (TRIGGERED FROM DRAWER CTA) */}
      {createReqClientId && (
        <ClientRequirementFormModal 
          isOpen={!!createReqClientId}
          onClose={() => setCreateReqClientId(null)}
          defaultClientId={createReqClientId}
        />
      )}
    </div>
  );
}
