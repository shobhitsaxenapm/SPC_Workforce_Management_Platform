import React, { useId } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function AiGradientSparkles({ className = 'w-3.5 h-3.5 shrink-0' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `ai-sparkle-grad-${uid}`;

  return (
    <>
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles
        className={className}
        style={{ fill: `url(#${gradId})`, stroke: `url(#${gradId})` }}
      />
    </>
  );
}

export default function AiSparkleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "ml-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 shadow-xs border border-pink-200/70 group-hover:scale-105 transition-transform",
        className
      )}
    >
      <AiGradientSparkles className="w-3 h-3 shrink-0" />
      <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent text-[10px] font-extrabold tracking-wider uppercase">
        AI
      </span>
    </span>
  );
}
