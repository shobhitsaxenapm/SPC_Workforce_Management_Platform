import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Save, ArrowRight, CheckSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InformationRequest } from '../types';

interface RecordResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: InformationRequest;
  onSuccess?: () => void;
}

const FIELD_MAPPING: Record<string, string> = {
  "What is your current notice period?": "noticePeriod",
  "What is your earliest available joining date?": "availableFrom",
  "What is your expected compensation?": "expectedSalary",
  "Please confirm your current location.": "currentLocation",
  "Please confirm your qualification details.": "education"
};

export default function RecordResponseModal({ isOpen, onClose, request, onSuccess }: RecordResponseModalProps) {
  const { candidates, applications, updateCandidate, recordInformationResponse, updateApplicationScreening } = useApp();
  
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [recruiterNote, setRecruiterNote] = useState('');
  const [channel, setChannel] = useState('Email');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApplyUpdates, setShowApplyUpdates] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const application = applications.find(a => a.id === request.applicationId);
  const candidate = candidates.find(c => c.id === request.candidateId);

  if (!application || !candidate) return null;

  const handleResponseChange = (question: string, value: string) => {
    setResponses(prev => ({ ...prev, [question]: value }));
  };

  const handleSaveResponse = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));

    recordInformationResponse(request.id, {
      receivedAt: new Date().toISOString(),
      channel,
      candidateResponse: responses,
      recruiterNote
    });

    setIsProcessing(false);
    
    // Check if any mapped fields have responses
    const possibleUpdates: Record<string, string> = {};
    Object.entries(responses).forEach(([q, ans]) => {
      if (ans.trim() && FIELD_MAPPING[q]) {
        possibleUpdates[FIELD_MAPPING[q]] = ans.trim();
      }
    });

    if (Object.keys(possibleUpdates).length > 0) {
      setSelectedUpdates(possibleUpdates);
      setShowApplyUpdates(true);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleApplyUpdates = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    
    const updatesToApply: any = {};
    Object.entries(selectedUpdates).forEach(([field, val]) => {
      updatesToApply[field] = val;
    });

    if (Object.keys(updatesToApply).length > 0) {
      updateCandidate(candidate.id, updatesToApply);
    }
    
    setIsProcessing(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleSkipUpdates = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  if (showApplyUpdates) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Apply Candidate Updates</h2>
            <button onClick={handleSkipUpdates} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              The following candidate profile fields can be updated based on the recorded responses. Select which ones to apply:
            </p>
            {Object.entries(selectedUpdates).map(([field, proposedValue], i) => (
              <label key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <input 
                  type="checkbox" 
                  checked={!!selectedUpdates[field]}
                  onChange={(e) => {
                    const newUpdates = { ...selectedUpdates };
                    if (e.target.checked) newUpdates[field] = proposedValue;
                    else delete newUpdates[field];
                    setSelectedUpdates(newUpdates);
                  }}
                  className="mt-1 text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500 line-through">{(candidate as any)[field] || 'Not specified'}</div>
                    <div className="text-green-700 font-medium">{proposedValue}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
            <button onClick={handleSkipUpdates} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              Skip
            </button>
            <button onClick={handleApplyUpdates} disabled={isProcessing} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Applying...</> : 'Apply Selected Updates'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Record Response</h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-700">{candidate.fullName}</span> 
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Response Channel</label>
              <select 
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Email">Email</option>
                <option value="Phone Call">Phone Call</option>
                <option value="SMS">SMS / Text Message</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
            <div>
               <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Received Date</label>
               <input 
                 type="date"
                 defaultValue={new Date().toISOString().split('T')[0]}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
               />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Candidate Answers
            </h3>
            {request.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">{i + 1}. {q}</label>
                <textarea
                  value={responses[q] || ''}
                  onChange={e => handleResponseChange(q, e.target.value)}
                  placeholder="Record answer..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Recruiter Review Note (Optional)</label>
            <textarea
              value={recruiterNote}
              onChange={e => setRecruiterNote(e.target.value)}
              placeholder="Internal review of candidate's response..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-yellow-50/30"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-sm text-slate-500">
            Request status will change to <strong>Response Received</strong>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSaveResponse} 
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
            >
              {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</> : 'Save Response'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
