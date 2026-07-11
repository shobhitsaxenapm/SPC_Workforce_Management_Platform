import React, { useState } from 'react';
import { mockAttendances, mockEmployees, mockDeployments, mockClients } from '../data/mockData';
import { Search, Filter, CalendarDays, Check, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import AIInsightCard from './AIInsightCard';

export default function AttendanceList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Review and approve timesheets submitted by deployed employees.</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Export Data
          </button>
        </div>
      </div>

      <AIInsightCard 
        title="Unusual Overtime Detected"
        severity="warning"
        explanation="1 timesheet has reported >40 hours of overtime for the month, requiring secondary client approval before billing."
        evidence={[
          "EMP-003 (Amit Kumar): 45 hours OT at Global Retail Solutions"
        ]}
        actionLabel="Review Timesheet"
        onAction={() => {}}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search timesheets by employee or client..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Month: October 2023
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Client & Project</th>
                <th className="px-6 py-4">Month/Year</th>
                <th className="px-6 py-4">Days Present</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockAttendances.map(att => {
                const emp = mockEmployees.find(e => e.id === att.employeeId);
                const dep = mockDeployments.find(d => d.id === att.deploymentId);
                const client = mockClients.find(c => c.id === dep?.clientId);
                
                return (
                  <tr key={att.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{emp?.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{client?.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{dep?.projectRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        {att.month} {att.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {att.daysPresent}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {att.totalHours}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        att.status === 'Approved' ? "bg-green-50 text-green-700 border-green-200" :
                        att.status === 'Submitted' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        att.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {att.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {att.status === 'Submitted' ? (
                        <div className="flex gap-2">
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {mockAttendances.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No timesheets submitted yet.
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
