import React, { useState, useRef } from 'react';
import { MapPin, Briefcase, Clock, FileText, UploadCloud, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Job } from '../types';
import { useApp } from '../context/AppContext';

export default function CareersPage() {
  const { jobs, submitApplication } = useApp();
  const publishedJobs = jobs.filter(j => j.status === 'Published' && j.visibility === 'Public');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number } | null>(null);

  // Application form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentLocation: '',
    totalExperience: '',
    currentRole: '',
    skills: '',
    noticePeriod: '',
    expectedSalary: '',
    consent: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerMockUpload(file);
    }
  };

  const triggerMockUpload = (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsUploading(false);
      setAttachedFile({ name: file.name, size: file.size });
    }, 1000); // 1 second simulated upload loader
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      triggerMockUpload(file);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const consent = formData.consent;

    if (!name) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (!email && !phone) {
      setErrorMsg('Please provide either an email address or a phone number.');
      return;
    }

    if (!consent) {
      setErrorMsg('You must consent to data storage to submit your application.');
      return;
    }

    if (!attachedFile) {
      setErrorMsg('Please upload your resume to complete your application.');
      return;
    }

    if (!selectedJob) return;

    // Trigger state ingestion
    const candidateData = {
      fullName: name,
      email,
      phone,
      currentLocation: formData.currentLocation,
      totalExperience: formData.totalExperience || 'Fresher',
      currentCompany: 'None',
      currentRole: formData.currentRole,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      education: 'Graduate',
      currentSalary: '0',
      expectedSalary: formData.expectedSalary || '0',
      noticePeriod: formData.noticePeriod || 'Immediate',
      resumeUrl: `mock_resumes/${attachedFile.name}`,
    };

    setIsUploading(true);
    setTimeout(() => {
      const res = submitApplication(candidateData, selectedJob.id);
      setIsUploading(false);
      if (res.success) {
        setIsSuccess(true);
        setIsApplying(false);
      } else {
        setErrorMsg(res.error || 'Submission failed.');
      }
    }, 1000); // simulated submission loader delay
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 mb-8 text-sm">
            Thank you for applying to SPC. Our recruitment team will review your application and get back to you shortly.
          </p>
          <button 
            onClick={() => { 
              setIsSuccess(false); 
              setSelectedJob(null); 
              setAttachedFile(null);
              setFormData({ 
                fullName: '', email: '', phone: '', currentLocation: '', 
                totalExperience: '', currentRole: '', skills: '', 
                noticePeriod: '', expectedSalary: '', consent: false 
              }); 
            }}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Careers
          </button>
        </div>
      </div>
    );
  }

  if (isApplying && selectedJob) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 sm:px-8">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => { setIsApplying(false); setErrorMsg(null); setAttachedFile(null); }} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Apply for {selectedJob.title}</h1>
              <p className="text-sm text-slate-500">{selectedJob.location} • {selectedJob.employmentType}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <form onSubmit={handleApply} className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                  <input type="text" value={formData.currentLocation} onChange={e => setFormData({...formData, currentLocation: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Please provide either an email address or a phone number.</p>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-2">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Experience</label>
                  <select value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                    <option value="">Select...</option>
                    <option value="Fresher">Fresher</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Role</label>
                  <input type="text" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Key Skills (Comma separated)</label>
                  <input type="text" placeholder="e.g. Data Entry, Excel" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                  <select value={formData.noticePeriod} onChange={e => setFormData({...formData, noticePeriod: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                    <option value="">Select...</option>
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary (LPA)</label>
                  <input type="text" placeholder="e.g. 4.5" value={formData.expectedSalary} onChange={e => setFormData({...formData, expectedSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-2">Resume *</h3>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.docx" 
                className="hidden" 
              />
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-700">Simulating File Analysis...</p>
                  </div>
                ) : attachedFile ? (
                  <div>
                    <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-800">{attachedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(attachedFile.size / 1024).toFixed(1)} KB • Click to replace</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">Click or Drag & Drop to upload your resume</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOCX up to 5MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
              <input type="checkbox" required id="consent" checked={formData.consent} onChange={e => setFormData({...formData, consent: e.target.checked})} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <label htmlFor="consent" className="text-sm text-slate-600 leading-relaxed">
                I consent to SPC Workforce storing my personal data for recruitment purposes and contacting me regarding this and future job opportunities. *
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-400 transition-colors shadow-sm"
              >
                {isUploading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>

          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 py-6 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <Briefcase className="w-8 h-8" />
            <span className="font-bold text-2xl leading-tight">
              SPC<br/><span className="text-sm font-medium text-slate-500">Careers</span>
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500">Public Portal</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Join Our Team</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover opportunities to work with top clients across North India. Find a role that matches your skills and ambitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedJobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{job.title}</h3>
                
                <div className="space-y-2 mb-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {job.employmentType}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {job.experienceRange}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {job.requiredSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                      +{job.requiredSkills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => { setSelectedJob(job); setIsApplying(true); }}
                  className="w-full py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                >
                  View & Apply
                </button>
              </div>
            </div>
          ))}

          {publishedJobs.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No Open Positions</h3>
              <p className="text-slate-500">We currently don't have any open positions. Please check back later.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
