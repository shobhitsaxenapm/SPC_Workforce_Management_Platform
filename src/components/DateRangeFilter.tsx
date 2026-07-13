import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DatePreset } from '../lib/dateUtils';

interface DateRangeFilterProps {
  preset: DatePreset;
  customStart: string;
  customEnd: string;
  onChange: (preset: DatePreset, start: string, end: string) => void;
}

export default function DateRangeFilter({ preset, customStart, customEnd, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="relative">
        <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <select
          value={preset}
          onChange={e => {
            const nextPreset = e.target.value as DatePreset;
            onChange(nextPreset, nextPreset === 'Custom' ? customStart : '', nextPreset === 'Custom' ? customEnd : '');
          }}
          className="pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all cursor-pointer text-slate-700 font-medium"
        >
          <option value="All Time">All Time</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="This Month">This Month</option>
          <option value="Last Quarter">Last Quarter</option>
          <option value="Custom">Custom Date Range</option>
        </select>
      </div>

      {preset === 'Custom' && (
        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
          <input
            type="date"
            value={customStart}
            onChange={e => onChange('Custom', e.target.value, customEnd)}
            className="text-xs text-slate-600 focus:outline-none border-0"
          />
          <span className="text-slate-400 text-xs font-semibold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => onChange('Custom', customStart, e.target.value)}
            className="text-xs text-slate-600 focus:outline-none border-0"
          />
        </div>
      )}
    </div>
  );
}
