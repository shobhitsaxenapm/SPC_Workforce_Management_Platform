import React, { useState, useEffect } from 'react';
import { mockBillings, mockClients, mockDeployments } from '../data/mockData';
import { Search, FileText, Download, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import AIInsightCard from './AIInsightCard';
import FilterPanel, { FilterField } from './FilterPanel';
import { DatePreset, isDateInPreset } from '../lib/dateUtils';
import Pagination from './Pagination';

export default function BillingList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [datePreset, setDatePreset] = useState<DatePreset>('All Time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Draft', 'Pending', 'Sent', 'Paid', 'Disputed'].map(s => ({ value: s, label: s })) },
    {
      key: 'datePreset',
      label: 'Generated On',
      options: [
        { value: 'Today', label: 'Today' },
        { value: 'Last 7 Days', label: 'Last 7 Days' },
        { value: 'Last 30 Days', label: 'Last 30 Days' },
        { value: 'This Month', label: 'This Month' },
        { value: 'Last Quarter', label: 'Last Quarter' },
      ],
    },
  ];

  const filtered = mockBillings.filter((bill: any) => {
    const client = mockClients.find(c => c.id === bill.clientId);
    const matchSearch = !searchTerm || client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || bill.status === filters.status;
    const matchDate = isDateInPreset(bill.generatedDate, datePreset, customStart, customEnd);
    return matchSearch && matchStatus && matchDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, datePreset, customStart, customEnd]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedBillings = filtered.slice(
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
        <p className="text-slate-600">Manage monthly billing generation for client deployments based on approved timesheets.</p>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Generate Invoices
        </button>
      </div>

      <AIInsightCard 
        title="Billing Anomaly Detected"
        severity="warning"
        explanation="The pending invoice for TechFlow India is 18% lower than the 3-month average."
        evidence={[
          "Historical Average: ₹4.5L/month",
          "Current Draft: ₹3.7L",
          "Cause: 2 employees (Priya Sharma, Rahul Verma) are missing approved timesheets for Week 4."
        ]}
        actionLabel="Review Draft Invoice"
        onAction={() => {}}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[380px] md:w-[440px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search bills by client or ID..." 
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
                Generated On: {datePreset === 'Custom' ? `${customStart || 'Any'} to ${customEnd || 'Any'}` : datePreset}
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
                <span className="font-semibold text-slate-700">{mockBillings.length}</span> invoices
              </>
            ) : (
              <>
                Total: <span className="font-semibold text-slate-700">{mockBillings.length}</span>{' '}
                {mockBillings.length === 1 ? 'invoice' : 'invoices'}
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
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Billing Period</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Deployments Billed</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Generated On</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBillings.map((bill: any) => {
                const client = mockClients.find(c => c.id === bill.clientId);
                const billedDeploymentsCount = bill.deploymentIds.length;
                
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-medium text-slate-800">{client?.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{bill.id.substring(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-slate-700">{bill.billingMonth} {bill.billingYear}</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-slate-700 font-medium">{billedDeploymentsCount} Employees</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle font-mono font-medium text-slate-800">
                      ${bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-slate-600">
                      {formatDate(bill.generatedDate)}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        bill.status === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        bill.status === 'Sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        bill.status === 'Disputed' ? "bg-rose-50 text-rose-700 border-rose-200" :
                        bill.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No bills generated yet.
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
          itemLabel="invoices"
        />
      </div>
    </div>
  );
}
