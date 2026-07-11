import React, { useState } from 'react';
import { mockBillings, mockClients, mockDeployments } from '../data/mockData';
import { Search, Filter, FileText, Download } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import AIInsightCard from './AIInsightCard';

export default function BillingList() {
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search bills by client or ID..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Billing Period</th>
                <th className="px-6 py-4">Deployments Billed</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Generated On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockBillings.map(bill => {
                const client = mockClients.find(c => c.id === bill.clientId);
                const billedDeploymentsCount = bill.deploymentIds.length;
                
                return (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{client?.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{bill.id.substring(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700">{bill.billingMonth} {bill.billingYear}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">{billedDeploymentsCount} Employees</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      ${bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(bill.generatedDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        bill.status === 'Paid' ? "bg-green-50 text-green-700 border-green-200" :
                        bill.status === 'Sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
              {mockBillings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No bills generated yet.
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
