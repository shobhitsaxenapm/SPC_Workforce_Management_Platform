import { mockUsers } from '../data/mockData';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const roles = [
  {
    name: 'Admin',
    desc: 'Can see and manage everything.',
    users: mockUsers.filter(u => u.role === 'ADMIN').length
  },
  {
    name: 'Manager',
    desc: 'Manages recruitment operations, creates requirements and jobs.',
    users: mockUsers.filter(u => u.role === 'MANAGER').length
  },
  {
    name: 'Recruiter',
    desc: 'Daily operational user. Works on assigned requirements, creates jobs.',
    users: mockUsers.filter(u => u.role === 'RECRUITER').length
  }
];

const permissions = [
  { module: 'Clients', admin: 'Full', manager: 'Full', recruiter: 'View only' },
  { module: 'Client Requirements', admin: 'Full', manager: 'Full', recruiter: 'Assigned only' },
  { module: 'Jobs', admin: 'Full', manager: 'Full', recruiter: 'Assigned only' },
  { module: 'Candidates', admin: 'Full', manager: 'Full', recruiter: 'Assigned only' },
  { module: 'Interviews', admin: 'Full', manager: 'Full', recruiter: 'Assigned only' },
  { module: 'Offers', admin: 'Full', manager: 'Full', recruiter: 'Assigned only' },
  { module: 'Administration', admin: 'Full', manager: 'No access', recruiter: 'No access' },
];

export default function UsersList() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage user access and recruitment roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {roles.map(r => (
          <div key={r.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{r.name}</h3>
            <p className="text-sm text-slate-500 mt-2 h-10">{r.desc}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">{r.users} Users</span>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View Users</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Permission Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Recruiter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{p.module}</td>
                  {[p.admin, p.manager, p.recruiter].map((perm, idx) => (
                    <td key={idx} className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border",
                        perm === 'Full' ? "bg-green-50 text-green-700 border-green-200" :
                        perm === 'Assigned only' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        perm === 'View only' ? "bg-slate-50 text-slate-700 border-slate-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {perm === 'No access' ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {perm}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
