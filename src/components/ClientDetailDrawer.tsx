import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Plus, 
  Calendar, 
  Briefcase, 
  FileText, 
  X, 
  ClipboardList, 
  Users, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { Client, ClientRequirement } from '../types';
import { INDUSTRY_OPTIONS } from '../lib/constants';
import { Link } from 'react-router-dom';

interface ClientDetailDrawerProps {
  clientId: string | null;
  onClose: () => void;
  onCreateRequirement: (clientId: string) => void;
}

export default function ClientDetailDrawer({ clientId, onClose, onCreateRequirement }: ClientDetailDrawerProps) {
  const { clients, requirements, jobs, applications, setQuickViewRequirementId } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'activity'>('overview');

  if (!clientId) return null;

  const client = clients.find(c => c.id === clientId);
  if (!client) return null;

  const clientReqs = requirements.filter(r => r.clientId === client.id);

  const calculateFilled = (reqId: string) => {
    return applications.filter(a => a.requirementId === reqId && a.currentStage === 'Joined').length;
  };

  const activeReqsCount = clientReqs.filter(r => r.status !== 'Closed').length;
  const openPositionsCount = clientReqs.reduce((acc, r) => acc + Math.max(r.positionsRequired - calculateFilled(r.id), 0), 0);

  // Generate dynamic activity timeline items for this client
  const activities: { id: string; title: string; details: string; date: string; icon: any; iconBg: string }[] = [];

  clientReqs.forEach(req => {
    activities.push({
      id: `act_req_${req.id}`,
      title: `Requirement Created`,
      details: `Requirement "${req.title}" (${req.code}) created for ${req.positionsRequired} positions.`,
      date: req.createdAt,
      icon: ClipboardList,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200'
    });

    const reqApps = applications.filter(a => a.requirementId === req.id);
    reqApps.forEach(app => {
      if (app.currentStage === 'Joined') {
        activities.push({
          id: `act_app_${app.id}`,
          title: `Candidate Placed`,
          details: `Candidate successfully joined for ${req.roleTitle}.`,
          date: app.lastActivity || app.appliedDate,
          icon: CheckCircle2,
          iconBg: 'bg-green-50 text-green-600 border-green-200'
        });
      } else if (app.currentStage === 'Applied' || app.currentStage === 'Sourced') {
        activities.push({
          id: `act_app_src_${app.id}`,
          title: `Candidate Shortlisted`,
          details: `Candidate pipeline updated for ${req.title}.`,
          date: app.appliedDate,
          icon: Users,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200'
        });
      }
    });
  });

  // Sort activities newest first
  const sortedActivities = activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col animate-slide-in-right">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-lg shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{client.name}</h2>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium border",
                  client.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {client.industry === 'OTHER' && client.industryOtherText 
                  ? client.industryOtherText 
                  : INDUSTRY_OPTIONS.find(o => o.value === client.industry)?.label || client.industry}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onCreateRequirement(client.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Requirement
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Metric Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Active Requirements</p>
              <p className="text-2xl font-bold text-gray-900">{activeReqsCount}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Open Positions</p>
              <p className="text-2xl font-bold text-gray-900">{openPositionsCount}</p>
            </div>
          </div>

          {/* Contact & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Primary Contact</p>
              <p className="text-sm font-semibold text-gray-900">{client.primaryContactName}</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`mailto:${client.primaryContactEmail}`} className="hover:text-blue-600 transition-colors">
                    {client.primaryContactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`tel:${client.primaryContactPhone}`} className="hover:text-blue-600 transition-colors">
                    {client.primaryContactPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Operating Locations</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {client.locations.map(loc => (
                  <span 
                    key={loc} 
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200/60"
                  >
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content Tabs Navigation */}
          <div>
            <div className="border-b border-slate-200 flex gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "pb-2.5 text-sm transition-all capitalize font-medium border-b-2",
                  activeTab === 'overview'
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={cn(
                  "pb-2.5 text-sm transition-all capitalize font-medium border-b-2 flex items-center gap-2",
                  activeTab === 'requirements'
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Linked Requirements
                <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
                  {clientReqs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  "pb-2.5 text-sm transition-all capitalize font-medium border-b-2",
                  activeTab === 'activity'
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Activity
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="pt-4">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Industry:</span>
                      <span className="font-medium text-gray-900">
                        {client.industry === 'OTHER' && client.industryOtherText 
                          ? client.industryOtherText 
                          : INDUSTRY_OPTIONS.find(o => o.value === client.industry)?.label || client.industry}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Last Activity:</span>
                      <span className="font-medium text-gray-900">{formatDate(client.lastActivity)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Requirements Logged:</span>
                      <span className="font-medium text-gray-900">{clientReqs.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LINKED REQUIREMENTS */}
              {activeTab === 'requirements' && (
                <div className="space-y-3">
                  {clientReqs.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      {clientReqs.map(req => {
                        const filled = calculateFilled(req.id);
                        const progress = (filled / req.positionsRequired) * 100;
                        return (
                          <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setQuickViewRequirementId(req.id)}
                                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left outline-none focus-visible:underline"
                                  >
                                    {req.title}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{req.code}</span>
                                  <span>•</span>
                                  <span>{req.roleTitle}</span>
                                </div>
                              </div>

                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0",
                                req.status === 'In Progress' ? "bg-green-50 text-green-700 border-green-200/60" :
                                req.status === 'Open' ? "bg-amber-50 text-amber-700 border-amber-200/60" :
                                req.status === 'Partially Filled' ? "bg-amber-50 text-amber-700 border-amber-200/60" :
                                "bg-slate-50 text-slate-700 border-slate-200/60"
                              )}>
                                {req.status}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                {filled} / {req.positionsRequired} Joined
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                Target: {formatDate(req.targetJoiningDate)}
                              </div>
                            </div>

                            <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full" 
                                style={{ width: `${Math.max(progress, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium">No linked requirements for this client.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACTIVITY */}
              {activeTab === 'activity' && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="relative border-l border-slate-200 ml-3 space-y-6">
                    {sortedActivities.map(act => {
                      const IconComp = act.icon;
                      return (
                        <div key={act.id} className="relative pl-8">
                          <div className={cn(
                            "absolute -left-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border",
                            act.iconBg
                          )}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{act.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{act.details}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(act.date)}</p>
                        </div>
                      );
                    })}

                    {sortedActivities.length === 0 && (
                      <p className="text-xs text-slate-500 pl-4">No recent activity logged for this client.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </>
  );
}
