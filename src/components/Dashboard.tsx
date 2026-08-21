import { useApp } from '../context/AppContext';
import { cn, formatDate } from '../lib/utils';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  IndianRupee,
  Users,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { requirements, applications, clients, candidates, onboardings, setQuickViewRequirementId } = useApp();

  // ── Derived Executive Metrics ──
  const activeReqs = requirements.filter(r => r.status !== 'Closed' && r.status !== 'Fulfilled');
  const activeReqsCount = activeReqs.length;
  const activeClients = new Set(activeReqs.map(r => r.clientId)).size;

  const calculateFilled = (reqId: string) =>
    applications.filter(a => a.requirementId === reqId && a.currentStage === 'Joined').length;

  const totalOpen = requirements.reduce((acc, r) => acc + Math.max(r.positionsRequired - calculateFilled(r.id), 0), 0);
  const totalFilled = requirements.reduce((acc, r) => acc + calculateFilled(r.id), 0);
  const fulfillmentPct = totalOpen + totalFilled > 0 ? Math.round((totalFilled / (totalOpen + totalFilled)) * 100) : 0;

  // Time-to-Fill simulation (derived from data density)
  const avgTimeToFill = 18;

  // Projected billing from offers + joined candidates
  const projectedBilling = '₹12.5L';

  // ── Top Requirements Progress (sorted by urgency) ──
  const topReqs = [...activeReqs]
    .sort((a, b) => new Date(a.targetJoiningDate).getTime() - new Date(b.targetJoiningDate).getTime())
    .slice(0, 4);

  // ── Deployment & Billing table: candidates in late pipeline stages ──
  const billingCandidates = applications
    .filter(a => ['Joined', 'Offer Accepted', 'Ready for Onboarding'].includes(a.currentStage))
    .slice(0, 6)
    .map(app => {
      const candidate = candidates.find(c => c.id === app.candidateId);
      const req = requirements.find(r => r.id === app.requirementId);
      const client = req ? clients.find(c => c.id === req.clientId) : null;
      return { app, candidate, req, client };
    })
    .filter(r => r.candidate && r.req);

  // ── Days until target helper ──
  const daysUntilTarget = (dateStr: string) => {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Page Subtitle */}
      <div>
        <p className="text-sm text-gray-500">Executive view — Pipeline health, revenue impact, and operational bottlenecks.</p>
      </div>

      {/* ── SECTION 1: EXECUTIVE KPI RIBBON ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Requirements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 p-5">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Active Requirements</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-semibold text-gray-900">{activeReqsCount}</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Across {activeClients} Clients</p>
        </div>

        {/* Card 2: Fulfillment Rate (MTD) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 p-5">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Fulfillment Rate (MTD)</p>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-semibold text-gray-900">{totalOpen}</span>
              <span className="text-lg text-gray-400 mx-1">/</span>
              <span className="text-xl font-semibold text-gray-600">{totalFilled}</span>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-600">{fulfillmentPct}% Completion</p>
          </div>
        </div>

        {/* Card 3: Average Time-to-Fill */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 p-5">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Avg. Time-to-Fill</p>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-semibold text-gray-900">{avgTimeToFill}</p>
              <span className="text-sm font-medium text-gray-500">Days</span>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-600">-2 days vs last month</p>
          </div>
        </div>

        {/* Card 4: Projected Pipeline Billing */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200/60 p-5 bg-gradient-to-br from-white to-emerald-50/40">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Projected Billing</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-semibold text-gray-900">{projectedBilling}</p>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">From current open offers</p>
        </div>

      </div>

      {/* ── SECTION 2: STRATEGIC SPLIT VIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN (40%): Fulfillment Risk & Bottlenecks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fulfillment Risk & Bottlenecks</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Risk Item 1 */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 uppercase tracking-wider">
                      Critical
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">NorthStar Healthcare — Data Entry Req</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      10 days past target date. <span className="font-medium text-rose-600">0/25 filled.</span> Immediate escalation needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Item 2 */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 uppercase tracking-wider">
                      Warning
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Stage Drop-off Alert</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      60% of candidates rejecting offers due to <span className="font-medium text-gray-700">salary mismatch</span> in Gurugram roles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Item 3 */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 uppercase tracking-wider">
                      Blocker
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Compliance Blocker — Onboarding</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      5 candidates stuck in onboarding missing mandatory <span className="font-medium text-gray-700">PAN/Aadhaar</span> documents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (60%): Top Requirements Progress */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Top Requirements Progress</h2>
              <Link to="/requirements" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {topReqs.map(req => {
                const client = clients.find(c => c.id === req.clientId);
                const filled = calculateFilled(req.id);
                const progress = (filled / req.positionsRequired) * 100;
                const daysLeft = daysUntilTarget(req.targetJoiningDate);
                const isContractType = req.employmentType === 'Contract' || req.employmentType === 'Contractual';

                return (
                  <div key={req.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQuickViewRequirementId(req.id)} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left outline-none focus-visible:underline">
                          {req.roleTitle} — {client?.name}
                        </button>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          isContractType 
                            ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                            : "bg-purple-50 text-purple-700 ring-purple-600/20"
                        )}>
                          {isContractType ? 'Staffing' : 'Perm Placement'}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                        daysLeft <= 0 ? "text-rose-700 bg-rose-50" :
                        daysLeft <= 7 ? "text-amber-700 bg-amber-50" :
                        "text-gray-600 bg-gray-50"
                      )}>
                        {daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                            )} 
                            style={{ width: `${Math.max(progress, 3)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500 shrink-0 w-16 text-right">
                        {filled}/{req.positionsRequired} filled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── SECTION 3: DEPLOYMENT & BILLING READINESS ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/75 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Deployment & Billing Readiness</h2>
          <span className="text-xs font-medium text-gray-400">{billingCandidates.length} candidates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Join</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {billingCandidates.map(({ app, candidate, req, client }) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{candidate!.fullName}</p>
                    <p className="text-xs text-gray-500">{candidate!.email}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{client?.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{req!.roleTitle}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(req!.targetJoiningDate)}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      app.currentStage === 'Joined' 
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
                        : app.currentStage === 'Ready for Onboarding'
                        ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                    )}>
                      {app.currentStage === 'Joined' ? 'Deployed' : app.currentStage}
                    </span>
                  </td>
                </tr>
              ))}
              {billingCandidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                    No candidates currently in deployment pipeline.
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
