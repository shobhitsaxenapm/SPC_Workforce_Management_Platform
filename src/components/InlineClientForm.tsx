import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrimaryIndustry } from '../types';
import { INDUSTRY_OPTIONS } from '../lib/constants';
import SearchableSelect from './SearchableSelect';
import { AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';

interface InlineClientFormProps {
  initialClientName?: string;
  onSuccess: (clientId: string) => void;
  onCancel: () => void;
}

export default function InlineClientForm({ initialClientName = '', onSuccess, onCancel }: InlineClientFormProps) {
  const { createClient } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialClientName,
    industry: '' as PrimaryIndustry | '',
    industryOtherText: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    locations: ''
  });

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
    
    const email = formData.primaryContactEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    
    setIsSubmitting(true);
    
    const payload = {
      name,
      industry: formData.industry as PrimaryIndustry,
      industryOtherText: formData.industry === 'OTHER' ? formData.industryOtherText.trim() : undefined,
      primaryContactName: formData.primaryContactName.trim() || undefined,
      primaryContactEmail: email || undefined,
      primaryContactPhone: formData.primaryContactPhone.trim() || undefined,
      locations: locationsStr.split(',').map(l => l.trim()).filter(Boolean)
    };
    
    const result = createClient(payload);
    
    setIsSubmitting(false);
    if (!result.success || !result.clientId) {
      setErrorMsg(result.error || `Failed to create client.`);
      return;
    }
    
    onSuccess(result.clientId);
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden mt-4 mb-6">
      <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 flex items-center gap-3">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Create New Client</h3>
      </div>
      <div className="p-5">
        <div id="inlineClientForm" className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" 
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Locations *</label>
                <input type="text" required placeholder="e.g. Mumbai, Delhi, Remote" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
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
                <input type="text" value={formData.primaryContactName} onChange={e => setFormData({...formData, primaryContactName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" value={formData.primaryContactEmail} onChange={e => setFormData({...formData, primaryContactEmail: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input type="tel" value={formData.primaryContactPhone} onChange={e => setFormData({...formData, primaryContactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
