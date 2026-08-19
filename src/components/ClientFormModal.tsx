import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, PrimaryIndustry } from '../types';
import { INDUSTRY_OPTIONS } from '../lib/constants';
import SearchableSelect from './SearchableSelect';

interface ClientFormModalProps {
  mode: 'create' | 'edit';
  initialClient?: Client;
  onClose: () => void;
}

export default function ClientFormModal({ mode, initialClient, onClose }: ClientFormModalProps) {
  const { createClient, updateClient } = useApp();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const getInitialFormState = () => {
    if (mode === 'edit' && initialClient) {
      return {
        name: initialClient.name || '',
        industry: initialClient.industry as PrimaryIndustry | '',
        industryOtherText: initialClient.industryOtherText || '',
        primaryContactName: initialClient.primaryContactName || '',
        primaryContactEmail: initialClient.primaryContactEmail || '',
        primaryContactPhone: initialClient.primaryContactPhone || '',
        locations: initialClient.locations ? initialClient.locations.join(', ') : ''
      };
    }
    return {
      name: '',
      industry: '' as PrimaryIndustry | '',
      industryOtherText: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      locations: ''
    };
  };

  const [initialFormData, setInitialFormData] = useState(getInitialFormState());
  const [formData, setFormData] = useState(getInitialFormState());

  // Reset initial form data when modal opens/changes
  useEffect(() => {
    const initialState = getInitialFormState();
    setInitialFormData(initialState);
    setFormData(initialState);
  }, [mode, initialClient]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const handleClose = () => {
    if (isDirty && !isSuccess) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    
    const name = formData.name.trim();
    const locationsStr = formData.locations.trim();
    
    if (!name || !locationsStr) {
      setErrorMsg('Client name and locations are required.');
      return;
    }
    if (!formData.industry) {
      setErrorMsg('Select the client’s primary industry.');
      return;
    }
    const industryOtherText = formData.industry === 'OTHER' ? formData.industryOtherText.trim() : undefined;
    if (formData.industry === 'OTHER' && (!industryOtherText || industryOtherText.length < 2)) {
      setErrorMsg('Specify the client’s industry (at least 2 characters).');
      return;
    }
    
    // Optional contact validation (email & phone format if provided)
    const email = formData.primaryContactEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    
    const phone = formData.primaryContactPhone.trim();
    if (phone && phone.length < 5) { // basic length check
      setErrorMsg('Please provide a valid phone number.');
      return;
    }
    
    setIsSubmitting(true);
    
    const payload = {
      name,
      industry: formData.industry as PrimaryIndustry,
      industryOtherText,
      primaryContactName: formData.primaryContactName.trim(),
      primaryContactEmail: email,
      primaryContactPhone: phone,
      locations: locationsStr.split(',').map(l => l.trim()).filter(Boolean),
    };
    
    let result;
    if (mode === 'create') {
      result = createClient(payload);
    } else {
      if (!initialClient) {
         setErrorMsg('Client data missing for edit mode.');
         setIsSubmitting(false);
         return;
      }
      result = updateClient(initialClient.id, payload);
    }
    
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || `Failed to ${mode} client.`);
      return;
    }
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors aria-label='Close modal'">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {mode === 'create' ? 'Client Created' : 'Client Updated'}
              </h3>
              <p className="text-slate-500">
                {mode === 'create' ? 'The new client has been created successfully.' : 'The client details have been updated successfully.'}
              </p>
            </div>
          ) : (
            <form id="clientForm" onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg" role="alert">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Industry *</label>
                    <SearchableSelect 
                      value={formData.industry} 
                      onChange={(val) => {
                        setFormData(prev => ({
                          ...prev, 
                          industry: val as PrimaryIndustry,
                          industryOtherText: val === 'OTHER' ? prev.industryOtherText : ''
                        }));
                      }} 
                      options={INDUSTRY_OPTIONS}
                      placeholder="Select primary industry"
                      required
                    />
                  </div>
                  {formData.industry === 'OTHER' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specify Industry *</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={100}
                        placeholder="Enter the client's industry" 
                        value={formData.industryOtherText} 
                        onChange={e => setFormData({...formData, industryOtherText: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Locations *</label>
                    <input type="text" required placeholder="e.g. Mumbai, Delhi, Remote" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Primary Contact</span>
                  <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                    <input type="text" value={formData.primaryContactName} onChange={e => setFormData({...formData, primaryContactName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" value={formData.primaryContactEmail} onChange={e => setFormData({...formData, primaryContactEmail: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" value={formData.primaryContactPhone} onChange={e => setFormData({...formData, primaryContactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button 
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {!isSuccess && (
            <button 
              type="submit"
              form="clientForm"
              disabled={isSubmitting || (mode === 'edit' && !isDirty)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
