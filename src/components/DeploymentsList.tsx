import React, { useState } from 'react';
import { mockDeployments, mockEmployees, mockClients } from '../data/mockData';
import { Search, MapPin, Calendar, Clock } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';
import FilterPanel, { FilterField } from './FilterPanel';

export default function DeploymentsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Active', 'Completed', 'Terminated'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = mockDeployments.filter((dep: any) => {
    const emp = mockEmployees.find((e: any) => e.id === dep.employeeId);
    const client = mockClients.find((c: any) => c.id === dep.clientId);
    const matchSearch = !searchTerm || 
      emp?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      dep.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || dep.status === filters.status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track active and historic employee deployments to client sites.</p>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          New Deployment
        </button>
      </div>

      <AIInsightCard 
        title="Deployment Ending Soon"
        severity="info"
        explanation="2 active deployments are scheduled to end within the next 15 days. Engage with clients for extension or begin offboarding."
        evidence={[
          "EMP-001 (Priya Sharma): Ends 20 July",
          "EMP-004 (Neha Gupta): Ends 25 July"
        ]}
        actionLabel="Review Deployments"
        onAction={() => {}}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search deployments by employee, client, or project..." 
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
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Billing Model</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((dep: any) => {
                const emp = mockEmployees.find((e: any) => e.id === dep.employeeId);
                const client = mockClients.find((c: any) => c.id === dep.clientId);
                
                return (
                  <tr key={dep.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{emp?.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{client?.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {dep.clientLocation}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {dep.projectRole}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 text-sm mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(dep.startDate)}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        Until {dep.endDate ? formatDate(dep.endDate) : 'Ongoing'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {dep.billingModel}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        dep.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" :
                        dep.status === 'Completed' ? "bg-slate-100 text-slate-700 border-slate-300" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No active deployments found.
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
