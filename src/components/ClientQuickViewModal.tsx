import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, Building2, MapPin, Mail, Phone, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function ClientQuickViewModal() {
  const { quickViewClientId, setQuickViewClientId, clients, requirements } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewClientId(null);
    };
    if (quickViewClientId) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickViewClientId, setQuickViewClientId]);

  if (!quickViewClientId) return null;

  const client = clients.find(c => c.id === quickViewClientId);
  
  if (!client) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Client Not Found</h2>
          <p className="text-slate-500 mt-2 text-center">The requested client does not exist or has been deleted.</p>
          <button 
            onClick={() => setQuickViewClientId(null)}
            className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const clientReqs = requirements.filter(r => r.clientId === client.id);
  const activeReqs = clientReqs.filter(r => r.lifecycleStatus !== 'Closed');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto flex flex-col max-h-[90vh] overflow-hidden outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Status</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                client.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
              )}>
                {client.status}
              </span>
            </div>
            <h2 id="client-modal-title" className="text-xl font-bold text-slate-900">{client.name}</h2>
          </div>
          <button 
            onClick={() => setQuickViewClientId(null)}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          <div className={cn(
            "p-4 rounded-lg border mb-6 flex items-start gap-3",
            client.status === 'Active' ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
          )}>
            <AlertCircle className={cn("w-5 h-5 shrink-0 mt-0.5", client.status === 'Active' ? "text-green-600" : "text-amber-600")} />
            <div>
              <p className={cn("font-semibold text-sm", client.status === 'Active' ? "text-green-900" : "text-amber-900")}>
                {client.status === 'Active' ? 'Active Client' : 'Inactive Client'}
              </p>
              <p className={cn("text-sm mt-1", client.status === 'Active' ? "text-green-700" : "text-amber-700")}>
                {client.status === 'Active' 
                  ? 'This Client is active and can be used for ongoing recruitment activity.' 
                  : 'This Client is inactive. New recruitment activity may be restricted.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Business Profile</h3>
                <dl className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Industry:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{client.industry}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {client.locations && client.locations.length > 0 ? client.locations.map(loc => (
                    <span key={loc} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">{loc}</span>
                  )) : <span className="text-sm text-slate-500 italic">Not provided</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Primary Contact</h3>
                <dl className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Name:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{client.primaryContactName}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Email:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{client.primaryContactEmail}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">Phone:</dt>
                    <dd className="col-span-2 font-medium text-slate-800">{client.primaryContactPhone}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Requirements Summary</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600 mb-1">{activeReqs.length}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Reqs</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-indigo-600 mb-1">{client.openPositionsCount || 0}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Roles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button 
            onClick={() => setQuickViewClientId(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            Close
          </button>
          <Link
            to={`/clients/${client.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setQuickViewClientId(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
          >
            Open Full Client Profile <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
