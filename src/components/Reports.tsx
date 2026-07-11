import { BarChart, LineChart, PieChart, TrendingUp, AlertCircle, Sparkles, Download, Calendar, Filter } from 'lucide-react';
import AIInsightCard from './AIInsightCard';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & AI Insights</h1>
          <p className="text-slate-600 mt-1">Analytics, operational intelligence, and AI-driven recommendations.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <AIInsightCard 
        title="High Offer Rejection Rate in IT Services"
        severity="critical"
        explanation="Over the last 30 days, 45% of offers in the IT Services sector have been declined due to salary expectations."
        evidence={[
          "Average expected CTC for IT roles: 8.5 LPA",
          "Average offered CTC: 7.2 LPA",
          "7 recent candidate feedbacks cite 'better competitive offer'."
        ]}
        actionLabel="Review Salary Benchmarks"
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Time to Fill (Avg)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-800">18 Days</h3>
            <span className="text-sm font-medium text-green-600 mb-1">-2 days</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <BarChart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Offer Acceptance Rate</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-800">72%</h3>
            <span className="text-sm font-medium text-red-600 mb-1">-5%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Active Deployments</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-800">145</h3>
            <span className="text-sm font-medium text-green-600 mb-1">+12</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <LineChart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Billing Realization</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-800">94%</h3>
            <span className="text-sm font-medium text-green-600 mb-1">+1%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Top Client Requirements</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-800">TechFlow India</p>
                <p className="text-sm text-slate-500">IT Services</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">12</p>
                <p className="text-xs text-slate-500">Open Roles</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-800">Global Retail Solutions</p>
                <p className="text-sm text-slate-500">Retail</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">8</p>
                <p className="text-xs text-slate-500">Open Roles</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-800">Nexus Logistics</p>
                <p className="text-sm text-slate-500">Logistics</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">5</p>
                <p className="text-xs text-slate-500">Open Roles</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-slate-800">AI Operational Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-1">Recruitment Bottleneck</h4>
              <p className="text-sm text-slate-600">Screening times have increased by 2 days on average for logistics roles. Consider standardizing the initial screening questionnaire.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-1">Billing Risk</h4>
              <p className="text-sm text-slate-600">3 deployments at Nexus Logistics are missing approved timesheets for this month, which will delay the upcoming invoice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
