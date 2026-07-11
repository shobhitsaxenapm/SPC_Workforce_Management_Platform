import { mockOffers, mockCandidates, mockJobs, mockClients } from '../data/mockData';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

export default function OffersList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track offer approvals, sent offers, expiry risk, and accepted client-deployment offers.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search offers..." 
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
                <th className="px-6 py-4">Candidate & Client</th>
                <th className="px-6 py-4">Offered Role</th>
                <th className="px-6 py-4">Compensation</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockOffers.map(offer => {
                const candidate = mockCandidates.find(c => c.id === offer.candidateId);
                const job = mockJobs.find(j => j.id === offer.jobId);
                const client = mockClients.find(c => c.id === offer.clientId);
                
                return (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{candidate?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{offer.offeredRole}</div>
                      <div className="text-xs text-slate-500 mt-1">{offer.contractDuration}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {offer.offeredCompensation}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDate(offer.proposedJoiningDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                        offer.status === 'Accepted' ? "bg-green-50 text-green-700 border-green-200" :
                        offer.status === 'Sent' || offer.status === 'Viewed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        offer.status === 'Approval Pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        offer.status === 'Declined' || offer.status === 'Expired' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {offer.status}
                      </span>
                      {offer.status === 'Sent' && offer.expiryDate && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> Exp: {formatDate(offer.expiryDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {offer.status === 'Draft' && (
                        <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Edit Offer</button>
                      )}
                      {offer.status === 'Approval Pending' && (
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">Review Approval</button>
                      )}
                      {offer.status === 'Sent' && (
                        <button className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1 rounded shadow-sm">View Offer</button>
                      )}
                      {offer.status === 'Accepted' && (
                        <button className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded shadow-sm">Start Onboarding</button>
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
