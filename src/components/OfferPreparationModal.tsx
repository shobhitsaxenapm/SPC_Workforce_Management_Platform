import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OfferPreparationModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferPreparationModal({ applicationId, isOpen, onClose }: OfferPreparationModalProps) {
  const { applications, candidates, jobs, clients, offers, createOffer, updateOffer, submitOfferForApproval, issueOffer } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // State
  const [draftId, setDraftId] = useState<string | null>(null);

  // Form State
  const [employingEntity, setEmployingEntity] = useState<'SPC' | 'Client'>('SPC');
  const [employingEntityName, setEmployingEntityName] = useState('SPC Workforce Solutions');
  const [registeredOfficeAddress, setRegisteredOfficeAddress] = useState('123 SPC Tower, Tech Park, Mumbai');
  const [offerDate, setOfferDate] = useState(new Date().toISOString().split('T')[0]);
  const [offerReference, setOfferReference] = useState(`SPC-OFF-${Math.floor(Math.random() * 10000)}`);
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full Time');
  const [reportingManager, setReportingManager] = useState('');
  const [annualCTC, setAnnualCTC] = useState('');
  const [fixedCompensation, setFixedCompensation] = useState('');
  const [variableCompensation, setVariableCompensation] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [probationPeriod, setProbationPeriod] = useState('6 Months');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');
  const [joiningDate, setJoiningDate] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM to 6:00 PM');
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState('Aditi Sharma');
  const [authorizedSignatoryDesignation, setAuthorizedSignatoryDesignation] = useState('HR Director');
  const [offerValidUntil, setOfferValidUntil] = useState('');

  const application = applications.find(a => a.id === applicationId);
  const candidate = candidates.find(c => c.id === application?.candidateId);
  const job = jobs.find(j => j.id === application?.jobId);
  const client = clients.find(c => c.id === job?.clientId);

  useEffect(() => {
    if (!isOpen) return;

    // Load existing draft if exists
    const existingOffer = offers.find(o => o.applicationId === applicationId && (o.status === 'Draft' || o.status === 'Approval Pending'));
    if (existingOffer) {
      setDraftId(existingOffer.id);
      setEmployingEntity(existingOffer.employingEntity || 'SPC');
      setEmployingEntityName(existingOffer.employingEntityName || 'SPC Workforce Solutions');
      setRegisteredOfficeAddress(existingOffer.registeredOfficeAddress || '123 SPC Tower, Tech Park, Mumbai');
      if (existingOffer.offerDate) setOfferDate(existingOffer.offerDate);
      if (existingOffer.offerReference) setOfferReference(existingOffer.offerReference);
      setDepartment(existingOffer.department || '');
      setWorkLocation(existingOffer.workLocation || '');
      setEmploymentType(existingOffer.employmentType || 'Full Time');
      setReportingManager(existingOffer.reportingManager || '');
      setAnnualCTC(existingOffer.annualCTC || existingOffer.offeredCompensation || '');
      setFixedCompensation(existingOffer.fixedCompensation || '');
      setVariableCompensation(existingOffer.variableCompensation || '');
      setOtherAllowances(existingOffer.otherAllowances || '');
      setProbationPeriod(existingOffer.probationPeriod || '6 Months');
      setNoticePeriod(existingOffer.noticePeriod || '30 Days');
      if (existingOffer.proposedJoiningDate) setJoiningDate(existingOffer.proposedJoiningDate.split('T')[0]);
      setWorkingHours(existingOffer.workingHours || '9:00 AM to 6:00 PM');
      setAuthorizedSignatoryName(existingOffer.authorizedSignatoryName || 'Aditi Sharma');
      setAuthorizedSignatoryDesignation(existingOffer.authorizedSignatoryDesignation || 'HR Director');
      if (existingOffer.expiryDate) setOfferValidUntil(existingOffer.expiryDate.split('T')[0]);
    } else {
      setDraftId(null);
      // Pre-fill
      if (job) {
        setWorkLocation(job.location);
        setEmploymentType(job.type);
      }
    }
  }, [isOpen, applicationId, offers, job]);

  if (!isOpen || !application || !candidate || !job || !client) return null;

  const handleSaveDraft = () => {
    const offerData = {
      applicationId: application.id,
      candidateId: candidate.id,
      jobId: job.id,
      clientId: client.id,
      offeredRole: job.title,
      offeredCompensation: annualCTC,
      proposedJoiningDate: joiningDate,
      contractDuration: employmentType,
      approvalRequired: true, // configurable later
      employingEntity,
      employingEntityName,
      registeredOfficeAddress,
      offerDate,
      offerReference,
      department,
      workLocation,
      employmentType,
      reportingManager,
      annualCTC,
      fixedCompensation,
      variableCompensation,
      otherAllowances,
      probationPeriod,
      noticePeriod,
      workingHours,
      authorizedSignatoryName,
      authorizedSignatoryDesignation,
      expiryDate: offerValidUntil
    };

    if (draftId) {
      updateOffer(draftId, offerData);
    } else {
      const newId = createOffer(offerData);
      setDraftId(newId);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!annualCTC || !joiningDate || !offerValidUntil) {
        alert('Please fill in Annual CTC, Joining Date, and Offer Valid Until Date.');
        return;
      }
      handleSaveDraft();
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => setStep((prev) => (prev - 1) as any);

  const handleSubmitForApproval = () => {
    if (draftId) {
      submitOfferForApproval(draftId);
      onClose();
    }
  };

  const handleIssueOffer = () => {
    if (draftId) {
      issueOffer(draftId);
      onClose();
    }
  };

  // Replace tokens in template
  const generatedLetter = `
**SPC WORKFORCE**
${employingEntityName}
${registeredOfficeAddress}

**Date:** ${offerDate}
**Offer Reference:** ${offerReference}

**To:**
${candidate.fullName}
${candidate.currentLocation || 'Address not available'}

**Subject: Offer of Employment for the position of ${job.title}**

Dear ${candidate.fullName},

We are pleased to offer you employment with ${employingEntityName} for the position of ${job.title}, subject to the terms and conditions stated in this letter.

### 1. Appointment details

* Designation: ${job.title}
* Department/Function: ${department || 'N/A'}
* Employment type: ${employmentType}
* Work location: ${workLocation}
${employingEntity === 'SPC' ? `* Client/Assignment: ${client.name}` : ''}
* Reporting to: ${reportingManager || 'Management'}
* Proposed joining date: ${joiningDate}

### 2. Compensation

Your annual Cost to Company will be ${annualCTC}.

The compensation structure is detailed in Annexure A and may include:
* Fixed compensation: ${fixedCompensation || 'As per Annexure A'}
${variableCompensation ? `* Variable compensation: ${variableCompensation}` : ''}
${otherAllowances ? `* Allowances: ${otherAllowances}` : ''}

All compensation is subject to applicable deductions, taxes, statutory contributions and company policies.

### 3. Probation

You will be on probation for ${probationPeriod}, subject to the applicable employment terms and policies of ${employingEntityName}.

### 4. Working conditions

Your work location, working hours (${workingHours}), shift and assignment conditions will be governed by the applicable Job, Client-assignment and company requirements communicated to you.

### 5. Verification and conditions

This offer is subject to satisfactory verification of the information and documents provided by you, including identity, education, employment history and other checks required for the role.

### 6. Confidentiality and conduct

You must maintain the confidentiality of company, Client, Candidate, operational and business information and comply with applicable company policies and lawful instructions.

### 7. Notice and separation

The applicable notice period will be ${noticePeriod}, subject to the final employment terms and policies of the employing entity.

### 8. Offer validity

This offer remains valid until ${offerValidUntil}. If it is not accepted by that date, the offer may expire unless extended in writing.

We look forward to welcoming you to ${employingEntityName}.

For ${employingEntityName}

**${authorizedSignatoryName}**
${authorizedSignatoryDesignation}

---
### Candidate acceptance

I, ${candidate.fullName}, confirm that I have read and accepted the terms of this offer.

Candidate signature: ____________________
Date: ____________________
  `;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Prepare Offer: {candidate.fullName}</h2>
            <p className="text-sm text-slate-500">For {job.title} at {client.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex gap-4 text-sm font-medium">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>1</div>
            Offer Details
          </div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>2</div>
            Template
          </div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>3</div>
            Review
          </div>
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>4</div>
            Approval & Issue
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employing Entity</label>
                  <select 
                    value={employingEntity} 
                    onChange={e => setEmployingEntity(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="SPC">SPC Workforce Solutions</option>
                    <option value="Client">{client.name}</option>
                  </select>
                </div>
                {employingEntity === 'Client' && (
                  <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Client is the employing entity. SPC standard templates will not be generated. Ensure you have authorized Client templates or track the external document manually.</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Legal Entity Name</label>
                  <input type="text" value={employingEntityName} onChange={e => setEmployingEntityName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registered Office Address</label>
                  <input type="text" value={registeredOfficeAddress} onChange={e => setRegisteredOfficeAddress(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Offer Date</label>
                  <input type="date" value={offerDate} onChange={e => setOfferDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Offer Reference</label>
                  <input type="text" value={offerReference} onChange={e => setOfferReference(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Annual CTC *</label>
                  <input type="text" placeholder="e.g. ₹6,00,000" value={annualCTC} onChange={e => setAnnualCTC(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Compensation</label>
                  <input type="text" value={fixedCompensation} onChange={e => setFixedCompensation(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Variable Compensation</label>
                  <input type="text" value={variableCompensation} onChange={e => setVariableCompensation(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proposed Joining Date *</label>
                  <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Offer Valid Until *</label>
                  <input type="date" value={offerValidUntil} onChange={e => setOfferValidUntil(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Signatory Name</label>
                  <input type="text" value={authorizedSignatoryName} onChange={e => setAuthorizedSignatoryName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Signatory Designation</label>
                  <input type="text" value={authorizedSignatoryDesignation} onChange={e => setAuthorizedSignatoryDesignation(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-800">Select Template</h3>
              {employingEntity === 'Client' ? (
                <div className="p-4 border border-slate-200 rounded-xl bg-white text-slate-500 text-center">
                  Client is employing entity. Please upload the external offer document in the next steps, or track it manually.
                </div>
              ) : (
                <div className="p-4 border-2 border-indigo-600 bg-indigo-50 rounded-xl flex justify-between items-center cursor-pointer">
                  <div className="flex gap-3 items-center">
                    <FileText className="text-indigo-600" />
                    <div>
                      <p className="font-medium text-indigo-900">SPC Standard Employment Offer</p>
                      <p className="text-xs text-indigo-700">v1.2 • Standard template for contract and full-time.</p>
                    </div>
                  </div>
                  <Check className="text-indigo-600" />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 h-full flex flex-col">
               <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Review all Candidate, compensation, employing-entity and joining details before issuing this offer.</p>
                </div>
               <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 overflow-y-auto font-serif text-sm shadow-inner whitespace-pre-wrap">
                  {employingEntity === 'Client' ? (
                    <div className="text-center text-slate-500 py-12 font-sans">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      Tracking Client external offer. (Document preview unavailable).
                    </div>
                  ) : (
                    generatedLetter
                  )}
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Issue Offer</h3>
                <p className="text-slate-500">
                  Issuing will freeze this offer version and make it the official offer shared with {candidate.fullName}.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 text-left text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Candidate:</span> <span className="font-medium">{candidate.fullName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="font-medium">{job.title}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Employing Entity:</span> <span className="font-medium">{employingEntityName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Annual CTC:</span> <span className="font-medium">{annualCTC}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Valid Until:</span> <span className="font-medium">{offerValidUntil}</span></div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
          <div className="flex gap-2">
             <button onClick={handleSaveDraft} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                Save Draft
             </button>
          </div>
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            {step < 4 ? (
              <button onClick={handleNext} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                 <button onClick={handleSubmitForApproval} className="px-5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg">
                    Submit for Approval
                 </button>
                 <button onClick={handleIssueOffer} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                    Issue Offer
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
