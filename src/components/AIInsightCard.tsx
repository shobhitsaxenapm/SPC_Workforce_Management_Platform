import { Sparkles, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type AISeverity = 'critical' | 'warning' | 'info' | 'success';

interface AIInsightCardProps {
  title: string;
  severity?: AISeverity;
  explanation: string;
  evidence?: string[];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function AIInsightCard({
  title,
  severity = 'info',
  explanation,
  evidence = [],
  actionLabel,
  onAction,
  className
}: AIInsightCardProps) {
  
  const styles = {
    critical: "from-rose-50 to-red-50 border-rose-100 text-rose-700",
    warning: "from-amber-50 to-orange-50 border-amber-100 text-amber-700",
    info: "from-indigo-50 to-blue-50 border-indigo-100 text-indigo-700",
    success: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700"
  };
  
  const iconColors = {
    critical: "text-rose-600",
    warning: "text-amber-600",
    info: "text-indigo-600",
    success: "text-emerald-600"
  };

  return (
    <div className={cn("bg-gradient-to-br rounded-xl border p-5 relative overflow-hidden", styles[severity], className)}>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Sparkles className={cn("w-24 h-24", iconColors[severity])} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className={cn("w-4 h-4", iconColors[severity])} />
          <span className={cn("text-xs font-semibold uppercase tracking-wide", iconColors[severity])}>
            AI Suggestion · Review Required
          </span>
        </div>
        <h3 className="font-semibold text-slate-800 mt-2">{title}</h3>
        <p className="text-sm text-slate-700 mt-2 leading-relaxed">
          {explanation}
        </p>
        
        {evidence.length > 0 && (
          <ul className="text-xs text-slate-600 mt-3 space-y-1">
            {evidence.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        )}
        
        {actionLabel && onAction && (
          <button 
            onClick={onAction}
            className={cn(
              "mt-4 text-sm font-medium px-4 py-2 rounded-lg border bg-white shadow-sm transition-colors",
              iconColors[severity],
              severity === 'critical' ? "border-rose-200 hover:bg-rose-50" :
              severity === 'warning' ? "border-amber-200 hover:bg-amber-50" :
              severity === 'info' ? "border-indigo-200 hover:bg-indigo-50" :
              "border-emerald-200 hover:bg-emerald-50"
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
