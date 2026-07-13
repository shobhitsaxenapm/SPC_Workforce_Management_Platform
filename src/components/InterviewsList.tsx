import React, { useState } from 'react';
import { mockInterviews, mockCandidates, mockJobs, mockClients } from '../data/mockData';
import { Search, Video, Users, Phone } from 'lucide-react';
import { cn, formatDateTime } from '../lib/utils';
import { Link } from 'react-router-dom';
import FilterPanel, { FilterField } from './FilterPanel';

export default function InterviewsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });

  const filterFields: FilterField[] = [
    { key: 'status', label: 'Status', options: ['Scheduled', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = mockInterviews.filter(iv => {
    const candidate = mockCandidates.find(c => c.id === iv.candidateId);
    const matchSearch = !searchTerm || candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || iv.interviewerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filters.status || iv.status === filters.status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Monitor scheduled, completed, overdue, and no-show interviews across client deployments.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search interviews..." 
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
                <th className="px-6 py-4">Candidate & Role</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Interviewer</th>
                <th className="px-6 py-4">Status & Feedback</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(interview => {
                const candidate = mockCandidates.find(c => c.id === interview.candidateId);
                const job = mockJobs.find(j => j.id === interview.jobId);
                const client = mockClients.find(c => c.id === interview.clientId);
                
                return (
                  <tr key={interview.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1">{job?.title}</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                        {interview.mode === 'Video' ? <Video className="w-3.5 h-3.5" /> : 
                         interview.mode === 'Phone' ? <Phone className="w-3.5 h-3.5" /> : 
                         <Users className="w-3.5 h-3.5" />}
                        {interview.interviewType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{formatDateTime(interview.scheduledAt)}</div>
                      <div className="text-xs text-slate-500 mt-1">{interview.durationMinutes} mins</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {interview.interviewerName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-medium border",
                          interview.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                          interview.status === 'Scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          interview.status === 'No Show' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {interview.status}
                        </span>
                        {interview.status === 'Completed' && (
                          <span className={cn(
                            "inline-flex w-fit px-2 py-0.5 text-[11px] font-medium rounded-full",
                            interview.feedbackStatus === 'Submitted' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                          )}>
                            Feedback {interview.feedbackStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {interview.status === 'Scheduled' && (
                        <div className="flex gap-2 justify-end">
                          <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Reschedule</button>
                          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">View</button>
                        </div>
                      )}
                      {interview.status === 'Completed' && interview.feedbackStatus === 'Pending' && (
                        <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded shadow-sm">Submit Feedback</button>
                      )}
                      {interview.status === 'Completed' && interview.feedbackStatus === 'Submitted' && (
                        <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">View Feedback</button>
                      )}
                      {interview.status === 'No Show' && (
                        <div className="flex gap-2 justify-end">
                          <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Reschedule</button>
                          <button className="text-sm font-medium text-red-600 hover:text-red-800 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Mark Withdrawn</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
