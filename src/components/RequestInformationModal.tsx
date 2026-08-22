import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Mail, Phone, Plus, Trash2, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RequestInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess?: () => void;
}

const PREDEFINED_QUESTIONS = [
  "Are you interested in this position?",
  "Please confirm your current location.",
  "Please confirm your preferred work mode.",
  "What is your current notice period?",
  "What is your earliest available joining date?",
  "What is your expected compensation?",
  "Please confirm your qualification details.",
  "Please provide an updated resume.",
  "Please clarify your experience with the required skills."
];

export default function RequestInformationModal({ isOpen, onClose, applicationId, onSuccess }: RequestInformationModalProps) {
  const { applications, candidates, jobs, clients, currentUser, createInformationRequest, updateApplicationScreening } = useApp();
  
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [communicationMethod, setCommunicationMethod] = useState<'Email' | 'SMS' | 'Manual Follow-up'>('Manual Follow-up');
  const [internalNote, setInternalNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [candidateMessageOverride, setCandidateMessageOverride] = useState<string | null>(null);

  if (!isOpen) return null;

  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);
  const client = clients.find(c => c.id === job?.clientId);

  if (!application || !candidate || !job) return null;

  const allQuestions = [...selectedPredefined, ...customQuestions.filter(q => q.trim())];
  const hasQuestions = allQuestions.length > 0;

  const generatePreview = () => {
    if (candidateMessageOverride !== null) return candidateMessageOverride;
    
    let msg = `Hello ${candidate.fullName.split(' ')[0]},\n\n`;
    msg += `We require some additional information to continue your application for the ${job.title} position at ${client?.name || 'our company'}.\n\n`;
    
    allQuestions.forEach((q, i) => {
      msg += `${i + 1}. ${q}\n`;
    });
    
    if (dueDate) {
      msg += `\nPlease share the requested information by ${new Date(dueDate).toLocaleDateString()}.\n`;
    }
    
    msg += `\nRegards,\n${currentUser?.name || 'Recruiter'}\nSPC Workforce`;
    
    return msg;
  };

  const previewMessage = generatePreview();

  const handleCopy = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePredefined = (q: string) => {
    setSelectedPredefined(prev => 
      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
    );
  };

  const handleAddCustom = () => {
    setCustomQuestions(prev => [...prev, '']);
  };

  const handleUpdateCustom = (index: number, val: string) => {
    const updated = [...customQuestions];
    updated[index] = val;
    setCustomQuestions(updated);
  };

  const handleRemoveCustom = (index: number) => {
    const updated = [...customQuestions];
    updated.splice(index, 1);
    setCustomQuestions(updated);
  };

  const handleSave = async () => {
    if (!hasQuestions) {
      alert("Please select or add at least one question.");
      return;
    }
    
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    
    createInformationRequest({
      applicationId: application.id,
      candidateId: candidate.id,
      jobId: job.id,
      questions: allQuestions,
      candidateMessage: candidateMessageOverride !== null ? candidateMessageOverride : previewMessage,
      internalNote,
      communicationMethod,
      communicationStatus: 'Recorded manually',
      requestedBy: currentUser?.id || 'sys',
      requestedAt: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days default
    });

    updateApplicationScreening(application.id, {
      ...application.screeningData,
      status: 'Awaiting Candidate Information'
    });

    setIsProcessing(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Request Information</h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-700">{candidate.fullName}</span> 
              <span className="text-slate-300">•</span>
              <span>{job.title}</span>
              <span className="text-slate-300">•</span>
              <span>{client?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Stage</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mt-1">
                {application.currentStage}
              </span>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Questions Configuration */}
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Information Needed *
              </h3>
              
              <div className="space-y-2 mb-4">
                {PREDEFINED_QUESTIONS.map((q, i) => (
                  <label key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={selectedPredefined.includes(q)}
                      onChange={() => handleTogglePredefined(q)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 leading-snug">{q}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                {customQuestions.map((cq, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea
                      value={cq}
                      onChange={e => handleUpdateCustom(i, e.target.value)}
                      placeholder="Type custom question..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button onClick={() => handleRemoveCustom(i)} className="p-2 h-fit text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={handleAddCustom} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add custom question
                </button>
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Recruiter Internal Note</label>
                  <textarea 
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-yellow-50/30"
                    placeholder="Private note about why this info is needed..."
                  />
                  <p className="text-xs text-slate-500 mt-1">This note is never sent to the candidate.</p>
                </div>
            </section>
          </div>

          {/* Right: Message Settings & Preview */}
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Communication Method</label>
                  <select 
                    value={communicationMethod}
                    onChange={e => setCommunicationMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Manual Follow-up">Manual Follow-up (Phone / Manual Email)</option>
                    <option value="Email" disabled>Email (Integration Pending)</option>
                    <option value="SMS" disabled>SMS (Integration Pending)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Due Date</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 text-sm">Candidate-Facing Message</h3>
                <button onClick={handleCopy} className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 rounded transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Message'}
                </button>
              </div>
              
              <textarea 
                value={candidateMessageOverride !== null ? candidateMessageOverride : previewMessage}
                onChange={e => setCandidateMessageOverride(e.target.value)}
                className="w-full flex-1 min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">You can directly edit this generated message before sending or copying.</p>
            </section>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            Candidate remains in <strong>Screening</strong>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isProcessing || !hasQuestions}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:bg-blue-400"
            >
              {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</> : 'Record as Requested Manually'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
