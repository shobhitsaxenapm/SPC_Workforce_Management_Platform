import React from 'react';
import { getSourceDisplayConfig, normalizeSource } from '../lib/sourceUtils';
import { cn } from '../lib/utils';

interface SourceBadgeProps {
  source: string;
  compact?: boolean;
  className?: string;
  showIcon?: boolean;
}

export default function SourceBadge({
  source,
  compact = false,
  className,
  showIcon = true
}: SourceBadgeProps) {
  const config = getSourceDisplayConfig(source);
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border shadow-xs transition-colors',
          config.badgeClass,
          className
        )}
        title={`Source: ${config.label}`}
      >
        {showIcon && <Icon className="w-3 h-3 shrink-0" />}
        <span className="truncate max-w-[130px]">{config.label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors',
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
