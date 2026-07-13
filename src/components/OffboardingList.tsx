import React, { useState } from 'react';
import { mockOffboardings, mockEmployees, mockDeployments, mockClients } from '../data/mockData';
import { Search, LogOut, CheckCircle2, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import FilterPanel, { FilterField } from './FilterPanel';
import DateRangeFilter from './DateRangeFilter';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';

export default function OffboardingList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Initiated', 'In Progress', 'Completed', 'Cancelled'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = mockOffboardings.filter((off: any) => {
    const emp = mockEmployees.find((e: any) => e.id === off.employeeId);
    const matchSearch = !searchTerm || emp?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || off.status === filters.status;
    const matchDate = isDateInPreset(off.lastWorkingDay, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track employees who are leaving the company or finishing client deployments.</p>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Initiate Offboarding
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search offboardings..." 
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
              LWD: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Last Deployment</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Last Working Day</th>
                <th className="px-6 py-4">Clearance Status</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((off: any) => {
                const emp = mockEmployees.find((e: any) => e.id === off.employeeId);
                const dep = mockDeployments.find((d: any) => d.employeeId === off.employeeId); // simplified
                const client = mockClients.find(c => c.id === dep?.clientId);
                
                return (
                  <tr key={off.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{emp?.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{client?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700">{off.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium text-red-600">
                      {formatDate(off.lastWorkingDay)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        off.clearanceStatus === 'Cleared' ? "text-green-600" :
                        off.clearanceStatus === 'In Progress' ? "text-blue-600" : "text-amber-600"
                      )}>
                        {off.clearanceStatus === 'Cleared' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {off.clearanceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        off.status === 'Completed' ? "bg-slate-100 text-slate-700 border-slate-300" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {off.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No active offboardings found.
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
