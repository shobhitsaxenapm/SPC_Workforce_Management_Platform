import React, { useState } from 'react';
import { mockTalentPool, mockCandidates } from '../data/mockData';
import { Search, MapPin, Tag } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import FilterPanel, { FilterField } from './FilterPanel';

export default function TalentPoolList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ consent: '' });

  const filterFields: FilterField[] = [
    { key: 'consent', label: 'Consent Status', options: ['Active', 'Expiring Soon', 'Expired', 'Not Recorded'].map(s => ({ value: s, label: s })) },
  ];

  const filtered = mockTalentPool.filter(entry => {
    const candidate = mockCandidates.find(c => c.id === entry.candidateId);
    const matchSearch = !searchTerm || candidate?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || entry.topSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchConsent = !filters.consent || entry.consentStatus === filters.consent;
    return matchSearch && matchConsent;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage candidates saved for future client requirements.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search talent pool..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <FilterPanel
          fields={filterFields}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onClear={() => setFilters({ consent: '' })}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Preferred Roles</th>
                <th className="px-6 py-4">Top Skills</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Pool Tags</th>
                <th className="px-6 py-4">Consent Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(entry => {
                const candidate = mockCandidates.find(c => c.id === entry.candidateId);
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/candidates/${candidate?.id}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors block">
                        {candidate?.fullName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {candidate?.currentLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {entry.preferredRoles.map(role => (
                          <span key={role} className="text-slate-700">{role}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {entry.topSkills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {entry.availability}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {entry.poolTags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded border border-indigo-100">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[11px] font-medium border",
                        entry.consentStatus === 'Active' ? "bg-green-50 text-green-700 border-green-200" :
                        entry.consentStatus === 'Expiring Soon' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {entry.consentStatus}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Last contacted: {formatDate(entry.lastContacted)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Match to Job</button>
                      </div>
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
