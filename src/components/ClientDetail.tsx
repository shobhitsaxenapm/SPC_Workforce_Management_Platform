import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../data/mockData';
import { Building2, MapPin, Mail, Phone, Plus, Calendar, Briefcase, FileText } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useState } from 'react';
import CreateRequirementModal from './CreateRequirementModal';

export default function ClientDetail() {
  const { id } = useParams();
  const { clients, requirements, applications } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const client = clients.find(c => c.id === id);
  const clientReqs = requirements.filter(r => r.clientId === id);

  if (!client) return <div>Client not found</div>;

  const calculateFilled = (reqId: string) => {
    return applications.filter(a => a.requirementId === reqId && a.currentStage === 'Joined').length;
  };

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">{client.name}</h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  client.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  {client.status}
                </span>
              </div>
              <p className="text-slate-500 mt-1">{client.industry}</p>
              
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {client.locations.join(', ')}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Last active: {formatDate(client.lastActivity)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Edit Client
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Requirement
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Primary Contact</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{client.primaryContactName}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${client.primaryContactEmail}`} className="hover:text-blue-600">{client.primaryContactEmail}</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${client.primaryContactPhone}`} className="hover:text-blue-600">{client.primaryContactPhone}</a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Active Requirements</p>
                <p className="text-xl font-semibold text-slate-800">{clientReqs.filter(r => r.status !== 'Closed').length}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Open Positions</p>
                <p className="text-xl font-semibold text-slate-800">
                  {clientReqs.reduce((acc, r) => acc + Math.max(r.positionsRequired - calculateFilled(r.id), 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Requirements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Business Profile / Client Requirements</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {clientReqs.length > 0 ? clientReqs.map(req => {
                const filled = calculateFilled(req.id);
                const progress = (filled / req.positionsRequired) * 100;
                return (
                  <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link to={`/requirements/${req.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {req.title}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="font-mono bg-slate-100 px-1.5 rounded">{req.code}</span>
                          <span>•</span>
                          <span>{req.roleTitle}</span>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border",
                        req.status === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        req.status === 'In Progress' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        req.status === 'Partially Filled' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {filled} / {req.positionsRequired} Joined
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Target: {formatDate(req.targetJoiningDate)}
                      </div>
                    </div>
                    
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p>No requirements found for this client.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CreateRequirementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultClientId={id} />
    </div>
  );
}
