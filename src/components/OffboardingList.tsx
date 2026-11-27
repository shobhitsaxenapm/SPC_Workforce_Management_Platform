import React, { useState, useEffect } from 'react';
import { mockOffboardings, mockEmployees, mockDeployments, mockClients } from '../data/mockData';
import { Search, LogOut, CheckCircle2, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import FilterPanel, { FilterField } from './FilterPanel';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import Pagination from './Pagination';

export default function OffboardingList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Initiated', 'In Progress', 'Completed', 'Cancelled'].map(s => ({ value: s, label: s })) },
    {
      key: 'datePreset',
      label: 'Last Working Day',
      options: [
        { value: 'Today', label: 'Today' },
        { value: 'Last 7 Days', label: 'Last 7 Days' },
        { value: 'Last 30 Days', label: 'Last 30 Days' },
        { value: 'This Month', label: 'This Month' },
        { value: 'Last Quarter', label: 'Last Quarter' },
      ],
    },
  ];

  const filtered = mockOffboardings.filter((off: any) => {
    const emp = mockEmployees.find((e: any) => e.id === off.employeeId);
    const matchSearch = !searchTerm || emp?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || off.status === filters.status;
    const matchDate = isDateInPreset(off.lastWorkingDay, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, datePreset, customStart, customEnd]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedOffboardings = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasAnyFilter = Boolean(searchTerm || filters.status || datePreset !== 'All Time');

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ status: '' });
    setDatePreset('All Time');
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track employees who are leaving the company or finishing client deployments.</p>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Initiate Offboarding
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[380px] md:w-[440px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search offboardings..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <FilterPanel
              fields={filterFields}
              values={{
                ...filters,
                datePreset: datePreset !== 'All Time' ? datePreset : '',
              }}
              onChange={(k, v) => {
                if (k === 'datePreset') {
                  setDatePreset((v as DatePreset) || 'All Time');
                  setCustomStart('');
                  setCustomEnd('');
                } else {
                  setFilters(prev => ({ ...prev, [k]: v }));
                }
              }}
              onClear={() => {
                setFilters({ status: '' });
                setDatePreset('All Time');
                setCustomStart('');
                setCustomEnd('');
              }}
            />
          </div>
        </div>

        {(filters.status || datePreset !== 'All Time') && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {filters.status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Status: {filters.status}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                  className="hover:text-blue-900 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {datePreset !== 'All Time' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
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
            )}
            <button
              onClick={() => {
                setFilters({ status: '' });
                setDatePreset('All Time');
                setCustomStart('');
                setCustomEnd('');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            {hasAnyFilter ? (
              <>
                Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{mockOffboardings.length}</span> offboardings
              </>
            ) : (
              <>
                Total: <span className="font-semibold text-slate-700">{mockOffboardings.length}</span>{' '}
                {mockOffboardings.length === 1 ? 'offboarding' : 'offboardings'}
              </>
            )}
          </span>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset View
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Last Deployment</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Last Working Day</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Clearance Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOffboardings.map((off: any) => {
                const emp = mockEmployees.find((e: any) => e.id === off.employeeId);
                const dep = mockDeployments.find((d: any) => d.employeeId === off.employeeId);
                const client = mockClients.find(c => c.id === dep?.clientId);
                
                return (
                  <tr key={off.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-medium text-slate-800">{emp?.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="text-slate-800 font-medium">{client?.name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-slate-700">{off.type}</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle font-medium text-rose-600">
                      {formatDate(off.lastWorkingDay)}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        off.clearanceStatus === 'Cleared' ? "text-emerald-600" :
                        off.clearanceStatus === 'In Progress' ? "text-blue-600" : "text-amber-600"
                      )}>
                        {off.clearanceStatus === 'Cleared' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {off.clearanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        off.status === 'Completed' ? "bg-slate-100 text-slate-700 border-slate-300" :
                        off.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
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
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No active offboardings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="offboardings"
        />
      </div>
    </div>
  );
}
