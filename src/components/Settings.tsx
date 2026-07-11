import { Shield, Users as UsersIcon, Database, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8">
      <p className="text-slate-600">Configure global recruitment settings, templates, and stages.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col */}
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Candidate Sources</h3>
            <div className="space-y-2">
              {['SPC Careers Website', 'Manual Entry', 'Bulk Resume Upload', 'Referral', 'Email', 'WhatsApp', 'Existing Talent Pool'].map(s => (
                <div key={s} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">
                  {s}
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
              + Add Custom Source
            </button>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Interview Types</h3>
            <div className="space-y-2">
              {['HR Screening', 'Skill Assessment', 'Client Interview', 'Final Discussion'].map(s => (
                <div key={s} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">
                  {s}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col */}
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Recruitment Pipeline</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Pipeline stages are standardised for the current version.</p>
            <div className="flex flex-wrap gap-2">
              {['Applied', 'Under Review', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Offer Sent', 'Offer Accepted', 'Ready for Onboarding'].map((s, i) => (
                <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                  {i+1}. {s}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {['On Hold', 'Rejected', 'Withdrawn', 'No Show', 'Offer Declined'].map((s) => (
                <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Data Integrity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Client-requirement links valid
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Job-requirement links valid
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Candidate records checked
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              No critical data issues found. Database is healthy.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
