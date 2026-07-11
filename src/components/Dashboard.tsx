import { ClientRequirement, Job, Candidate, Application } from '../types';
import { mockRequirements, mockJobs, mockCandidates, mockApplications, mockClients } from '../data/mockData';
import { cn } from '../lib/utils';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Clock, 
  AlertCircle,
  FileText,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';

function KpiCard({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className="text-xs font-medium text-slate-500 mt-3">
          {trend}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const openReqs = mockRequirements.filter(r => r.status !== 'Closed' && r.status !== 'Fulfilled').length;
  const totalOpenPos = mockRequirements.reduce((acc, r) => acc + (r.positionsRequired - r.positionsFilled), 0);
  const totalFilled = mockRequirements.reduce((acc, r) => acc + r.positionsFilled, 0);
  const newApps = mockApplications.filter(a => a.currentStage === 'Applied' || a.currentStage === 'Under Review').length;

  return (
    <div className="space-y-6">
      {/* Header section is in layout, we just add the page specific subtitle and CTA here */}
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Track client requirements, hiring progress, and operational blockers.</p>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Create Client Requirement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Open Requirements" value={openReqs} icon={Building2} trend="Across 4 Active Clients" />
        <KpiCard title="Open Positions" value={totalOpenPos} icon={Briefcase} trend="Needs Sourcing" />
        <KpiCard title="Positions Filled" value={totalFilled} icon={Users} trend="This Month" />
        <KpiCard title="New Applications" value={newApps} icon={Clock} trend="Awaiting Screening" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Priority Work Queue & AI Insights */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Priority Work Queue</h2>
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">3 Requirements at Risk</h3>
                  <p className="text-xs text-slate-500 mt-1">Target joining dates within 7 days with &lt;50% fulfillment.</p>
                </div>
              </div>
              
              <div className="p-4 border-b border-slate-100 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">8 Candidates Waiting</h3>
                  <p className="text-xs text-slate-500 mt-1">Pending interview feedback for more than 48 hours.</p>
                </div>
              </div>
              
              <div className="p-4 border-b border-slate-100 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">5 Onboarding Blockers</h3>
                  <p className="text-xs text-slate-500 mt-1">Missing mandatory compliance documents.</p>
                </div>
              </div>
              
              <div className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">₹4.8L Billing Ready</h3>
                  <p className="text-xs text-slate-500 mt-1">Timesheets approved, waiting for invoice generation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Advisory */}
          <AIInsightCard 
            title="Requirement Risk Detected"
            severity="critical"
            explanation="The Data Entry Operator requirement for NorthStar Healthcare needs 25 hires by 15 July, but only 6 candidates are in the active pipeline."
            evidence={[
              "21 positions remain open",
              "Target joining date is in 5 days",
              "Sourcing velocity has dropped 40% this week"
            ]}
            actionLabel="Review Requirement"
            onAction={() => console.log("Review requirement clicked")}
          />
        </div>

        {/* Right: Hiring Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Hiring Progress (Top Requirements)</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              {mockRequirements.map((req, idx) => {
                const client = mockClients.find(c => c.id === req.clientId);
                const progress = (req.positionsFilled / req.positionsRequired) * 100;
                
                return (
                  <div key={req.id} className={cn("p-4", idx !== mockRequirements.length - 1 && "border-b border-slate-100")}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link to={`/requirements/${req.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {req.roleTitle} — {client?.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">Target: {new Date(req.targetJoiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-800">{req.positionsFilled}</span>
                        <span className="text-sm text-slate-500"> / {req.positionsRequired} filled</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-1 overflow-hidden">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
                        )} 
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Operational Activity</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="relative border-l border-slate-200 ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  <p className="text-sm font-medium text-slate-800">Priya Sharma accepted offer</p>
                  <p className="text-xs text-slate-500 mt-0.5">2 hours ago • Data Entry Operator, NorthStar Healthcare</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  <p className="text-sm font-medium text-slate-800">Billing generated for TechFlow India</p>
                  <p className="text-xs text-slate-500 mt-0.5">5 hours ago • ₹2.4L for 12 deployments</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                  <p className="text-sm font-medium text-slate-800">Timesheets approved by Client</p>
                  <p className="text-xs text-slate-500 mt-0.5">Yesterday • Global Retail Solutions (4 employees)</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
