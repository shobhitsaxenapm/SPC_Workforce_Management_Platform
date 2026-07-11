import { mockJobs, mockRequirements, mockClients, mockUsers } from '../data/mockData';
import { Plus, Search, Filter, MapPin, Briefcase } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function JobsList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage client-facing job openings linked to approved client requirements.</p>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create from Requirement
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search jobs..." 
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
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Recruiter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockJobs.map(job => {
                const client = mockClients.find(c => c.id === job.clientId);
                const recruiter = mockUsers.find(u => u.id === job.assignedRecruiterId);
                const progress = (job.filled / job.openings) * 100;
                
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/jobs/${job.id}`} className="block">
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{job.code}</span>
                          <span>•</span>
                          <span>{job.employmentType}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/clients/${client?.id}`} className="text-slate-700 hover:text-blue-600">
                        {client?.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">{job.filled} / {job.openings}</span>
                        <span className="text-slate-500">{job.openings - job.filled} rem</span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full",
                            progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(job.targetJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        job.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" :
                        job.status === 'Draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                        job.status === 'Paused' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {recruiter?.name.charAt(0)}
                        </div>
                        <span className="text-slate-700">{recruiter?.name}</span>
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
