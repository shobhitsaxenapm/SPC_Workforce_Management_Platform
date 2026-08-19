import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, X, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ExtractedJobData } from '../types';

export type ProcessingState = 'Idle' | 'Uploading' | 'Processing' | 'Failed';

interface SmartJobUploadProps {
  onExtractionSuccess: (
    data: ExtractedJobData, 
    sourceText: string, 
    metadata: { originalFilename: string, mimeType: string, size: number }
  ) => void;
  onCancel: () => void;
}

export default function SmartJobUpload({ onExtractionSuccess, onCancel }: SmartJobUploadProps) {
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
      'application/msword',
      'text/plain'
    ];
    if (!validTypes.includes(f.type)) {
      setError('Unsupported file format. Please upload PDF, DOCX, or TXT.');
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

  const processFile = async () => {
    if (!file) return;
    setStatus('Uploading');
    setError(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      setStatus('Processing');
      const res = await fetch('/api/extract-job', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to process document.');
      }

      onExtractionSuccess(json.data, json.sourceText, json.metadata);
    } catch (err: any) {
      console.error(err);
      setStatus('Failed');
      setError(err.message || 'An unexpected error occurred during AI processing.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Smart Job Creation</h2>
        <p className="text-slate-500 mt-2">Upload a Job Description (JD) to automatically extract requirements and details.</p>
      </div>

      {!file ? (
        <div 
          className="w-full border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Click or drag document to upload</h3>
          <p className="text-sm text-slate-500 mt-2">Supports PDF, DOCX, TXT (Max 10MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {status === 'Idle' || status === 'Failed' ? (
              <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
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

          {status === 'Processing' || status === 'Uploading' ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="font-medium text-slate-800">{status === 'Uploading' ? 'Uploading document...' : 'AI is extracting job details...'}</p>
                <p className="text-sm text-slate-500">This may take a few moments depending on the document length.</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={onCancel}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={processFile}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                Process Document
              </button>
            </div>
          )}
        </div>
      )}

      {error && !file && (
        <div className="mt-4 w-full p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
