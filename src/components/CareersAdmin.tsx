import { Globe, Settings, Eye, CheckCircle2 } from 'lucide-react';
import { mockJobs } from '../data/mockData';
import { Link } from 'react-router-dom';
import AIInsightCard from './AIInsightCard';

export default function CareersAdmin() {
  const published = mockJobs.filter(j => j.status === 'Published').length;
  const draft = mockJobs.filter(j => j.status === 'Draft').length;
  const paused = mockJobs.filter(j => j.status === 'Paused').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Manage jobs published on the SPC careers website.</p>
        <Link to="/careers" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Eye className="w-4 h-4" />
          Preview Careers Page
        </Link>
      </div>

      <AIInsightCard 
        title="Stale Draft Jobs"
        severity="info"
        explanation="You have 3 draft jobs that have been inactive for over 14 days."
        actionLabel="Review Drafts"
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <h3 className="font-medium text-slate-700">Published Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{published}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <h3 className="font-medium text-slate-700">Draft Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <h3 className="font-medium text-slate-700">Paused Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{paused}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Public Portal Status</h3>
            </div>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="p-6 bg-slate-50 flex items-center justify-center">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <div className="w-24 h-6 bg-blue-100 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              </div>
              <div className="mt-6 flex justify-between">
                <div className="h-8 bg-slate-100 rounded w-20"></div>
                <div className="h-8 bg-blue-600 rounded w-24"></div>
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-slate-200 text-center">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Customize Portal Theme
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Recent Publishing Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-4 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Amit Kumar</span> published <span className="font-medium">Data Entry Operator</span> for <span className="text-slate-800">NorthStar Healthcare</span>
              <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
            </div>
            <div className="p-4 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Amit Kumar</span> published <span className="font-medium">Warehouse Associate</span> for <span className="text-slate-800">UrbanEdge Logistics</span>
              <p className="text-xs text-slate-400 mt-1">Yesterday</p>
            </div>
            <div className="p-4 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Priya Desai</span> paused <span className="font-medium">Patient Support Executive</span>
              <p className="text-xs text-slate-400 mt-1">3 days ago</p>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All Published Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
