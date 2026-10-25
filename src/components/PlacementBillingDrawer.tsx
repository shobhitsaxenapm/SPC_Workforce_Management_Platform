import React, { useState } from 'react';
import { Placement, Candidate, Job, PlacementBillingStatus, PLACEMENT_BILLING_STATUSES } from '../types';
import { useApp } from '../context/AppContext';
import { getPlacementBillingStatusConfig } from '../lib/hiringModelUtils';
import { 
  X, CheckCircle2, FileText, Send, Clock, DollarSign, 
  AlertTriangle, XCircle, ArrowRight, ShieldCheck, Building2, Calendar, User
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PlacementBillingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement: Placement;
  candidate?: Candidate;
  job?: Job;
}

export default function PlacementBillingDrawer({
  isOpen,
  onClose,
  placement,
  candidate,
  job,
}: PlacementBillingDrawerProps) {
  const { updatePlacementBillingStatus, clients } = useApp();
  const [selectedNextStatus, setSelectedNextStatus] = useState<PlacementBillingStatus>(
    placement.billingStatus || 'Billing Eligible'
  );
  const [invoiceNumber, setInvoiceNumber] = useState(placement.invoiceNumber || '');
  const [feeAmount, setFeeAmount] = useState(placement.feeAmount ? String(placement.feeAmount) : '');
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const client = clients.find(c => c.id === placement.clientId);
  const currentConfig = getPlacementBillingStatusConfig(placement.billingStatus);
  const CurrentIcon = currentConfig.icon;

  const PIPELINE_STEPS: PlacementBillingStatus[] = [
    'Billing Eligible',
    'Invoice Draft',
    'Invoice Sent',
    'Payment Pending',
    'Paid'
  ];

  const handleStatusUpdate = (newStatus: PlacementBillingStatus) => {
    setIsUpdating(true);
    setErrorMessage(null);

    const res = updatePlacementBillingStatus(
      placement.id,
      newStatus,
      actionNotes.trim() || undefined,
      {
        invoiceNumber: invoiceNumber.trim() || undefined,
        feeAmount: feeAmount.trim() || undefined,
      }
    );

    setIsUpdating(false);
    if (res.success) {
      setActionNotes('');
    } else {
      setErrorMessage(res.error || 'Failed to update billing status');
    }
  };

  const getNextRecommendedStatus = (): PlacementBillingStatus | null => {
    switch (placement.billingStatus) {
      case 'Billing Eligible':
        return 'Invoice Draft';
      case 'Invoice Draft':
        return 'Invoice Sent';
      case 'Invoice Sent':
        return 'Payment Pending';
      case 'Payment Pending':
        return 'Paid';
      default:
        return null;
    }
  };

  const nextStatus = getNextRecommendedStatus();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                Client Hire Placement
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {placement.id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Placement &amp; Billing Desk
            </h2>
            <p className="text-xs text-slate-500">
              {candidate?.fullName || 'Candidate'} • {job?.title || 'Job'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Placement Details Card */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Placement Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Candidate</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {candidate?.fullName || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Client</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {client?.name || 'Direct Client'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Actual Joining Date</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  {placement.actualJoiningDate || 'Pending confirmation'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Placement Model</span>
                <span className="font-semibold text-purple-700">
                  Client Direct Hire
                </span>
              </div>
            </div>
          </div>

          {/* Current Status & Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Billing Lifecycle
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                currentConfig.badgeClass
              )}>
                <CurrentIcon className="w-3.5 h-3.5" />
                {currentConfig.label}
              </span>
            </div>

            {/* Linear Progress Stepper */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-3 right-3 top-3.5 h-0.5 bg-slate-200 -z-0" />
                {PIPELINE_STEPS.map((step, idx) => {
                  const stepConfig = getPlacementBillingStatusConfig(step);
                  const isCurrent = placement.billingStatus === step;
                  const isPast = (currentConfig.step > 0 && currentConfig.step > idx + 1);
                  const isCompleted = isPast || (placement.billingStatus === 'Paid' && idx === 4);

                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs",
                          isCurrent && "bg-blue-600 text-white ring-4 ring-blue-100",
                          isCompleted && !isCurrent && "bg-emerald-600 text-white",
                          !isCurrent && !isCompleted && "bg-white border-2 border-slate-300 text-slate-400"
                        )}
                      >
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-1.5 font-medium text-center whitespace-nowrap",
                        isCurrent ? "font-bold text-blue-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                      )}>
                        {step.replace('Billing ', '').replace('Payment ', '')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {(placement.billingStatus === 'Disputed' || placement.billingStatus === 'Cancelled') && (
                <div className="mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Placement billing is currently <strong>{placement.billingStatus}</strong>.</span>
                </div>
              )}
            </div>
          </div>

          {/* Action & Transition Form */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" />
              Manage Placement Invoice &amp; Payment
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-081"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Placement Fee
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹2,50,000 / $8,500"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Action / Transition Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Invoice approved by Client Accounts Payable; reference wire #..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quick advance button if applicable */}
            {nextStatus && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate(nextStatus)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span>Advance to <strong>{nextStatus}</strong></span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Manual Status Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-500 mb-2">
                Or jump to specific status:
              </label>
              <div className="flex flex-wrap gap-2">
                {PLACEMENT_BILLING_STATUSES.map((st) => {
                  const isCurrent = placement.billingStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating || isCurrent}
                      onClick={() => handleStatusUpdate(st)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs rounded-lg font-medium border transition-colors",
                        isCurrent
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                      )}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Independent Lifecycle Notice:</strong> Billing status belongs directly to this individual candidate placement.
              Payment completion does not automatically close the Job ({job?.title || 'Job'}), which remains managed via Job status.
            </div>
          </div>

          {/* Audit Trail / Billing History */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Placement Billing Activity History
            </span>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 max-h-56 overflow-y-auto">
              {!placement.billingHistory || placement.billingHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No previous billing activity recorded.</p>
              ) : (
                placement.billingHistory.map((item) => (
                  <div key={item.id} className="text-xs border-b border-slate-200/60 pb-2.5 last:border-none last:pb-0">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(item.changedAt).toLocaleString()}
                      </span>
                    </div>
                    {item.notes && <p className="text-slate-600 mt-0.5">{item.notes}</p>}
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>By: {item.changedBy}</span>
                      {item.invoiceNumber && <span>• Inv: {item.invoiceNumber}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
