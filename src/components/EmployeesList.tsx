import React, { useState } from 'react';
import { mockEmployees } from '../data/mockData';
import { Search, Filter, UserCircle, Briefcase, Mail, Phone } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function EmployeesList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage all hired employees deployed to clients or benched.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search employees by name, emp code..." 
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
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role & Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {emp.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{emp.fullName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{emp.employeeCode}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-medium">{emp.roleTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">{emp.baseLocation}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 text-sm">{emp.employmentType}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(emp.joiningDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border",
                      emp.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" :
                      emp.status === 'Benched' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      emp.status === 'Notice Period' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {mockEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No employees found. Complete an onboarding to add employees.
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
