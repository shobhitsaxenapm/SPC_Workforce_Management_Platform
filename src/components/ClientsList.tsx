import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, Plus, MoreVertical, ChevronRight, X, CheckCircle2, Search, Trash2, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FilterPanel, { FilterField } from './FilterPanel';
import { Client } from '../types';

export default function ClientsList() {
  const { clients, createClient, deleteClient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', industry: '' });
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    locations: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    if (!formData.name.trim() || !formData.locations.trim()) {
      setErrorMsg('Client name and locations are required.');
      return;
    }
    setIsSubmitting(true);
    const result = createClient({
      name: formData.name.trim(),
      industry: formData.industry.trim() || 'General',
      status: formData.status,
      primaryContactName: formData.primaryContactName.trim(),
      primaryContactEmail: formData.primaryContactEmail.trim(),
      primaryContactPhone: formData.primaryContactPhone.trim(),
      locations: formData.locations.split(',').map(l => l.trim()).filter(Boolean),
      activeRequirementsCount: 0,
      openPositionsCount: 0,
      lastActivity: new Date().toISOString(),
    });
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to create client.');
      return;
    }
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({ name: '', industry: '', primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', locations: '', status: 'Active' });
    }, 1500);
  };

  const industries = [...new Set(clients.map(c => c.industry).filter(Boolean))] as string[];

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
    { key: 'industry', label: 'Industry', options: industries.map(i => ({ value: i, label: i })) },
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
          onClick={() => { setIsModalOpen(true); setErrorMsg(null); }}
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
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-colors group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-800">{client.name}</h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      client.status === 'Active' 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{client.industry}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {client.locations.join(', ')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {client.activeRequirementsCount} Active {client.activeRequirementsCount === 1 ? 'Req' : 'Reqs'}
                    </div>
                    <div className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">
                      {client.openPositionsCount} Open Positions
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto md:border-l md:border-slate-100 md:pl-6">
                <div className="text-sm">
                  <p className="font-medium text-slate-700">{client.primaryContactName}</p>
                  <p className="text-slate-500">{client.primaryContactEmail}</p>
                </div>
                <div className="flex items-center gap-2 ml-auto md:ml-4">
                  <Link 
                    to={`/clients/${client.id}`}
                    className="flex items-center justify-center px-4 py-2 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                  >
                    View Client
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                  <button
                    onClick={() => setClientToDelete(client)}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="py-12 text-center bg-white border border-slate-200 rounded-xl">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No clients match the current filters.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Add New Client</h2>
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Client Created</h3>
                  <p className="text-slate-500">The client has been added successfully.</p>
                </div>
              ) : (
                <form id="createClientForm" onSubmit={handleSubmit} className="space-y-6">
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errorMsg}</div>
                  )}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Client Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                        <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Locations *</label>
                        <input type="text" required placeholder="e.g. Mumbai, Delhi, Remote" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Primary Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                        <input type="text" value={formData.primaryContactName} onChange={e => setFormData({...formData, primaryContactName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="email" value={formData.primaryContactEmail} onChange={e => setFormData({...formData, primaryContactEmail: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input type="tel" value={formData.primaryContactPhone} onChange={e => setFormData({...formData, primaryContactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>
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
                  form="createClientForm"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  Create Client
                </button>
              )}
            </div>
          </div>
        </div>
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
    </div>
  );
}
