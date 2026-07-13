import React, { useState } from 'react';
import { mockOnboardings, mockCandidates, mockJobs, mockClients } from '../data/mockData';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';
import FilterPanel, { FilterField } from './FilterPanel';

export default function OnboardingList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['In Progress', 'Completed', 'Delayed', 'Pending'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = mockOnboardings.filter((onb: any) => {
    const candidate = mockCandidates.find(c => c.id === onb.candidateId);
    const matchSearch = !searchTerm || candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || onb.status === filters.status;
    return matchSearch && matchStatus;
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
        <FilterPanel
          fields={filterFields}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onClear={() => setFilters({ status: '' })}
        />
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
                const candidate = mockCandidates.find(c => c.id === onb.candidateId);
                const job = mockJobs.find(j => j.id === onb.jobId);
                const client = mockClients.find(c => c.id === job?.clientId);
                
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
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Mark Complete</button>
                      )}
                      {onb.status === 'Completed' && (
                        <span className="text-slate-400 text-sm">Converted to Employee</span>
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
    </div>
  );
}
