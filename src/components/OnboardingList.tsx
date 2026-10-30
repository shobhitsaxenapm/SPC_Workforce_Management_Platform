import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';

export default function OnboardingList() {
  const { onboardings, candidates, jobs, clients, updateOnboarding } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [showCompleteModal, setShowCompleteModal] = useState<any | null>(null);
  const [actualJoiningDate, setActualJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Documents Requested', 'Documents Submitted', 'Verification In Progress', 'Changes Requested', 'Approved', 'Joining Scheduled', 'Completed', 'In Progress', 'Delayed', 'Pending'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = onboardings.filter((onb: any) => {
    const candidate = candidates.find(c => c.id === onb.candidateId);
    const matchSearch = !searchTerm || candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || onb.status === filters.status;
    const matchDate = isDateInPreset(onb.plannedJoiningDate, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track candidates who have accepted offers and are completing joining formalities.</p>
      </div>

      <AIInsightCard 
        title="Missing Document Summary"
        severity="critical"
        explanation="3 candidates are missing mandatory compliance documents (PAN, Aadhaar) less than 48 hours before their planned joining date."
        evidence={[
          "Rahul Sharma: Missing PAN Card",
          "Anjali Desai: Missing Cancelled Cheque",
          "Vikas Patel: Missing Aadhaar"
        ]}
        actionLabel="Send Reminders"
        onAction={() => {}}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search onboardings by candidate or role..." 
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
              setFilters({ status: '' });
              setDatePreset('All Time');
              setCustomStart('');
              setCustomEnd('');
            }}
          />
        </div>

        {datePreset !== 'All Time' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Planned Joining Date: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role & Client</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Docs Status</th>
                <th className="px-6 py-4">BGC Status</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((onb: any) => {
                const candidate = candidates.find(c => c.id === onb.candidateId);
                const job = jobs.find(j => j.id === onb.jobId);
                const client = clients.find(c => c.id === job?.clientId);
                
                return (
                  <tr key={onb.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1">{candidate?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{job?.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(onb.plannedJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        onb.documentsStatus === 'Verified' ? "text-green-600" :
                        onb.documentsStatus === 'Pending' ? "text-amber-600" : "text-slate-600"
                      )}>
                        {onb.documentsStatus === 'Verified' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {onb.documentsStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        onb.backgroundCheckStatus === 'Cleared' ? "text-green-600" :
                        onb.backgroundCheckStatus === 'In Progress' ? "text-blue-600" : "text-amber-600"
                      )}>
                        {onb.backgroundCheckStatus === 'Cleared' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {onb.backgroundCheckStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        onb.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                        onb.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        onb.status === 'Delayed' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {onb.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {onb.status !== 'Completed' && (
                        <button 
                          onClick={() => {
                            setShowCompleteModal(onb);
                            setActualJoiningDate(onb.plannedJoiningDate ? onb.plannedJoiningDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                      {onb.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Converted to Employee
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No active onboardings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETE ONBOARDING CONFIRMATION MODAL */}
      {showCompleteModal && (() => {
        const candidate = candidates.find(c => c.id === showCompleteModal.candidateId);
        const job = jobs.find(j => j.id === showCompleteModal.jobId);
        const client = clients.find(c => c.id === showCompleteModal.clientId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/70 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Complete Onboarding</h3>
                    <p className="text-xs text-slate-500">Convert to Active Employee</p>
                  </div>
                </div>
                <button onClick={() => setShowCompleteModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Confirm completion of pre-joining documentation and onboarding for <strong>{candidate?.fullName || 'Candidate'}</strong>:
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Designation / Role</span>
                    <span className="font-semibold text-slate-800">{job?.title || 'Role'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Client / Company</span>
                    <span className="font-medium text-slate-700">{client?.name || 'Company'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Planned Date</span>
                    <span className="font-medium text-slate-700">{formatDate(showCompleteModal.plannedJoiningDate)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Actual Joining Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date"
                    value={actualJoiningDate}
                    onChange={(e) => setActualJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg">
                  Completing onboarding officially verifies joining requirements and transitions this candidate to <strong>Converted to Employee</strong>.
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => setShowCompleteModal(null)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    updateOnboarding(showCompleteModal.id, {
                      status: 'Completed',
                      actualJoiningDate: actualJoiningDate || new Date().toISOString().split('T')[0]
                    });
                    const cName = candidate?.fullName || 'Candidate';
                    setShowCompleteModal(null);
                    setToast({ message: `${cName}'s onboarding marked as Complete and converted to Employee.`, type: 'success' });
                    setTimeout(() => setToast(null), 3500);
                  }} 
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Complete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
