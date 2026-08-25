import React, { useState, useMemo } from 'react';
import { X, Search, Link2, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LinkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export default function LinkProjectModal({ isOpen, onClose, clientId }: LinkProjectModalProps) {
  const { projects, clients, updateProject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Projects that belong to OTHER clients
  const availableRequirements = useMemo(() => {
    return projects.filter(r => r.clientId !== clientId);
  }, [projects, clientId]);

  const filteredRequirements = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return availableRequirements.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.code.toLowerCase().includes(q) ||
      (clients.find(c => c.id === r.clientId)?.name || '').toLowerCase().includes(q)
    );
  }, [availableRequirements, searchQuery, clients]);

  if (!isOpen) return null;

  const handleLink = async (projectId: string) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 400));
    const targetClient = clients.find(c => c.id === clientId);
    updateProject(projectId, { clientId }, `Moved requirement to client ${targetClient?.name || clientId}`);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              Link Existing Project
            </h2>
            <p className="text-sm text-slate-500 mt-1">Select a requirement from another client to move to this client.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by role title, code, or current client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
          {filteredRequirements.length > 0 ? (
            <div className="space-y-2 p-4">
              {filteredRequirements.map(req => {
                const currentClient = clients.find(c => c.id === req.clientId);
                return (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{req.code}</span>
                        <h4 className="font-semibold text-slate-800">{req.title}</h4>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        Currently linked to <span className="font-medium text-slate-700">{currentClient?.name || 'Unknown Client'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleLink(req.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-white border border-slate-300 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" /> Link
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No projects found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery ? "No requirements match your search." : "There are no requirements available to link."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
