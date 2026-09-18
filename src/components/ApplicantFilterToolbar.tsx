import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Filter } from 'lucide-react';
import { DatePreset } from '../lib/dateUtils';
import { cn } from '../lib/utils';

export interface ApplicantFilters {
  searchQuery: string;
  locations: string[];
  statuses: string[];
  appliedOn: DatePreset | null;
  customStartDate: string;
  customEndDate: string;
}

export const createEmptyFilters = (): ApplicantFilters => ({
  searchQuery: '',
  locations: [],
  statuses: [],
  appliedOn: null,
  customStartDate: '',
  customEndDate: ''
});

interface ApplicantFilterToolbarProps {
  filters: ApplicantFilters;
  onChange: (filters: ApplicantFilters) => void;
  availableLocations: string[];
  availableStatuses: string[];
}

function MultiSelect({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (val: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(x => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 hover:bg-slate-50 text-slate-700 whitespace-nowrap"
      >
        {label}
        {selected.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{selected.length}</span>}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 shadow-lg rounded-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 truncate" title={opt}>{opt}</span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-2 text-sm text-slate-500">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicantFilterToolbar({ filters, onChange, availableLocations, availableStatuses }: ApplicantFilterToolbarProps) {
  const activeChips = [
    ...(filters.searchQuery ? [{ type: 'search', label: `"${filters.searchQuery}"` }] : []),
    ...filters.locations.map(loc => ({ type: 'location', label: loc, val: loc })),
    ...filters.statuses.map(st => ({ type: 'status', label: st, val: st })),
    ...(filters.appliedOn && filters.appliedOn !== 'All Time' ? [{ 
      type: 'date', 
      label: filters.appliedOn === 'Custom' 
        ? `${filters.customStartDate} to ${filters.customEndDate}`
        : filters.appliedOn 
    }] : [])
  ];

  const hasFilters = activeChips.length > 0;

  const handleClearAll = () => {
    onChange(createEmptyFilters());
  };

  const removeChip = (chip: any) => {
    if (chip.type === 'search') onChange({ ...filters, searchQuery: '' });
    else if (chip.type === 'location') onChange({ ...filters, locations: filters.locations.filter(l => l !== chip.val) });
    else if (chip.type === 'status') onChange({ ...filters, statuses: filters.statuses.filter(s => s !== chip.val) });
    else if (chip.type === 'date') onChange({ ...filters, appliedOn: null, customStartDate: '', customEndDate: '' });
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates by name, email or phone..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        
        <MultiSelect 
          label="Location" 
          options={availableLocations} 
          selected={filters.locations} 
          onChange={(locs) => onChange({ ...filters, locations: locs })} 
        />
        
        <MultiSelect 
          label="Application Status" 
          options={availableStatuses} 
          selected={filters.statuses} 
          onChange={(sts) => onChange({ ...filters, statuses: sts })} 
        />

        <div className="flex items-center gap-2">
          <select
            value={filters.appliedOn || 'All Time'}
            onChange={(e) => {
              const val = e.target.value as DatePreset;
              onChange({ ...filters, appliedOn: val === 'All Time' ? null : val });
            }}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 hover:bg-slate-50 text-slate-700 outline-none"
          >
            <option value="All Time">Applied On</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Custom">Custom Date Range</option>
          </select>
          
          {filters.appliedOn === 'Custom' && (
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2 py-1">
              <input 
                type="date" 
                value={filters.customStartDate} 
                onChange={(e) => onChange({ ...filters, customStartDate: e.target.value })}
                className="text-sm outline-none bg-transparent"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input 
                type="date" 
                value={filters.customEndDate} 
                onChange={(e) => onChange({ ...filters, customEndDate: e.target.value })}
                className="text-sm outline-none bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1"><Filter className="w-3 h-3"/> Active Filters:</span>
          {activeChips.map((chip, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
              {chip.label}
              <button onClick={() => removeChip(chip)} className="text-blue-400 hover:text-blue-800 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={handleClearAll} className="text-xs font-medium text-slate-500 hover:text-slate-700 ml-2 underline underline-offset-2">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
