import React, { useState } from 'react';
import { mockClients } from '../data/mockData';
import { Building2, MapPin, Briefcase, Plus, MoreVertical, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function ClientsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Create client form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    locations: '',
    status: 'Active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.locations) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      // In a real app we'd save and redirect.
      // navigate(`/clients/new_id`);
      setFormData({ name: '', industry: '', primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', locations: '', status: 'Active' });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage client organisations, contacts, locations, and active hiring requirements.</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockClients.map(client => (
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
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
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
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Client
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
