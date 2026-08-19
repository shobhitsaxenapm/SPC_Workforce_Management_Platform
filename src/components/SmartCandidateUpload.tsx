import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, X, Loader2 } from 'lucide-react';
import { Candidate } from '../types';

export type ProcessingState = 'Idle' | 'Uploading' | 'Processing' | 'Failed';

interface SmartCandidateUploadProps {
  onExtractionSuccess: (
    data: Partial<Candidate>, 
    metadata: { originalFilename: string, mimeType: string, size: number }
  ) => void;
  onCancel: () => void;
}

export default function SmartCandidateUpload({ onExtractionSuccess, onCancel }: SmartCandidateUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingState>('Idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!validTypes.includes(f.type)) {
      setError('Unsupported file format. Please upload PDF or DOCX.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10MB limit.');
      return;
    }
    if (f.size === 0) {
      setError('File is empty.');
      return;
    }
    setFile(f);
  };

  const processFile = () => {
    if (!file) return;
    setStatus('Processing');
    setError(null);

    // Simulated Extraction Delay
    setTimeout(() => {
      setStatus('Idle');
      
      const mockExtractedData: Partial<Candidate> = {
        fullName: 'Shobhit Kumar',
        email: 'shobhit.kumar@example.com',
        phone: '+91 90000 00001',
        currentLocation: 'Gurugram, Haryana',
        linkedInUrl: '',
        currentRole: 'Warehouse Associate',
        currentCompany: 'RapidKart Logistics',
        totalExperience: '2.2 years',
        professionalSummary: 'Warehouse Associate with experience in inventory handling, loading and unloading, order packing and stock verification. Comfortable working in fast-paced warehouse operations.',
        skills: ['Inventory Management', 'Loading and Unloading', 'Order Packing', 'Physical Fitness', 'Basic English', 'Stock Verification'],
        employmentHistory: [
          {
            company: 'RapidKart Logistics',
            role: 'Warehouse Associate',
            location: 'Gurugram',
            startDate: 'June 2024',
            endDate: 'Present',
            responsibilities: [
              'Managed incoming and outgoing inventory',
              'Performed loading and unloading activities',
              'Packed customer orders',
              'Verified stock quantities',
              'Maintained warehouse safety standards'
            ]
          }
        ],
        educationEntries: [
          {
            qualification: '12th Pass',
            institution: 'Government Senior Secondary School, Gurugram',
            completionYear: '2023'
          }
        ],
        languages: ['Hindi', 'Basic English'],
      };

      onExtractionSuccess(mockExtractedData, {
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Add Candidate from Resume</h2>
        <p className="text-slate-500 mt-2">Upload a candidate resume to automatically extract details.</p>
      </div>

      {!file ? (
        <div 
          className="w-full max-w-xl border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Drag and drop or browse</h3>
          <p className="text-sm text-slate-500 mt-2">Upload candidate resume (PDF, DOCX) up to 10MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="w-full max-w-xl space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {status === 'Idle' || status === 'Failed' ? (
              <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove Resume">
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Processing Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {status === 'Processing' ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="font-medium text-slate-800">Reading resume...</p>
                <p className="text-sm text-slate-500">Extracting candidate details...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setFile(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Replace Resume
              </button>
              <button 
                onClick={processFile} 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Process Resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
