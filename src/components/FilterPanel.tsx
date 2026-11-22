import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

export interface FilterField {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  getOptions?: (currentValues: Record<string, string>) => { value: string; label: string }[];
  getLabel?: (currentValues: Record<string, string>) => string;
}

interface FilterPanelProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  onApply?: (nextValues: Record<string, string>) => void;
}

export default function FilterPanel({ fields, values, onChange, onClear, onApply }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>(values);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.values(values).filter(v => v !== '').length;
  const draftActiveCount = Object.values(draftValues).filter(v => v !== '').length;

  // Sync draft state with committed values whenever the popover opens or external values change while closed
  useEffect(() => {
    if (!isOpen) {
      setDraftValues(values);
    }
  }, [values, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setDraftValues(values);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [values]);

  const hasPendingChanges = fields.some(f => (draftValues[f.key] || '') !== (values[f.key] || ''));

  const handleDraftFieldChange = (key: string, value: string) => {
    setDraftValues(prev => {
      const next = { ...prev, [key]: value };
      // If any dependent field's dynamic options no longer contain its current draft value, clear that dependent field in draft
      fields.forEach(field => {
        if (field.key !== key && field.getOptions && next[field.key]) {
          const validOpts = field.getOptions(next);
          if (!validOpts.some(o => o.value === next[field.key])) {
            next[field.key] = '';
          }
        }
      });
      return next;
    });
  };

  const handleClearDraft = () => {
    const cleared: Record<string, string> = {};
    fields.forEach(f => {
      cleared[f.key] = '';
    });
    setDraftValues(cleared);
  };

  const handleApplyAndClose = () => {
    const allCleared = fields.every(f => !draftValues[f.key]);
    if (allCleared && activeCount > 0) {
      onClear();
      setIsOpen(false);
      return;
    }

    if (onApply) {
      onApply(draftValues);
    } else {
      fields.forEach(field => {
        const nextVal = draftValues[field.key] || '';
        const prevVal = values[field.key] || '';
        if (nextVal !== prevVal) {
          onChange(field.key, nextVal);
        }
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setDraftValues(values);
          }
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          activeCount > 0
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {(draftActiveCount > 0 || activeCount > 0) && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {fields.map(field => {
              const currentVal = draftValues[field.key] || '';
              const isSelected = Boolean(currentVal);
              const fieldOptions = field.getOptions ? field.getOptions(draftValues) : field.options;
              const fieldLabel = field.getLabel ? field.getLabel(draftValues) : field.label;

              return (
                <div key={field.key}>
                  <div className={`flex items-center justify-between text-xs font-medium uppercase tracking-wider mb-1.5 ${
                    isSelected ? 'text-blue-700 font-semibold' : 'text-slate-500'
                  }`}>
                    <label htmlFor={`filter-select-${field.key}`} className="flex items-center gap-1.5 cursor-pointer">
                      {fieldLabel}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </label>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => handleDraftFieldChange(field.key, '')}
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-800 normal-case tracking-normal"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <select
                    id={`filter-select-${field.key}`}
                    aria-label={fieldLabel}
                    value={currentVal}
                    onChange={e => handleDraftFieldChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50/40 text-blue-900 font-medium'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <option value="">All</option>
                    {fieldOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={handleApplyAndClose}
              className={`w-full text-sm font-semibold rounded-lg py-2 transition-colors ${
                hasPendingChanges
                  ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
