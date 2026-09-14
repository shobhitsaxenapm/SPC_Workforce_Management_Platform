import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import SmartCandidateUpload from './SmartCandidateUpload';
import CandidateFormModal from './CandidateFormModal';

interface AddCandidateToJobModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCandidateToJobModal({ jobId, isOpen, onClose }: AddCandidateToJobModalProps) {
  const { addMatchToPipeline } = useApp();
  
  const [showUpload, setShowUpload] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  if (!isOpen) return null;

  return (
    <>
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
              <SmartCandidateUpload 
                onExtractionSuccess={(data, meta) => {
                  setExtractedData({...data, resumeUrl: meta.originalFilename});
                  setShowUpload(false);
                  setShowReviewForm(true);
                }}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      )}

      {showReviewForm && extractedData && (
        <CandidateFormModal 
          isOpen={showReviewForm}
          onClose={onClose}
          initialData={extractedData}
          isEditMode={false}
          onSaveSuccess={(candidateId) => {
            const result = addMatchToPipeline(jobId, candidateId, 'Recruiter Added from Job Pipeline');
            if (result.success) {
              alert('Candidate added to the Sourced stage for this Job.');
            } else {
              alert(result.error);
            }
            onClose();
          }}
        />
      )}
    </>
  );
}
