import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  required = false,
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      setHighlightedIndex(filteredOptions.findIndex(o => o.value === value));
    }
  }, [isOpen]); // Only run when isOpen changes

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const el = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div
        className="w-full relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 text-sm">
          <span className={cn("truncate block", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </div>
        {/* Hidden input for HTML5 required validation */}
        {required && (
          <input
            tabIndex={-1}
            className="absolute opacity-0 w-full h-full bottom-0 left-0 pointer-events-none"
            value={value}
            onChange={() => {}}
            required
            onFocus={() => {
              if (wrapperRef.current) {
                 const firstFocusable = wrapperRef.current.querySelector('div[tabindex="0"]') as HTMLElement;
                 if (firstFocusable) firstFocusable.focus();
              }
            }}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              className="w-full text-sm outline-none bg-transparent"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <ul ref={listboxRef} className="overflow-y-auto p-1 py-1 text-sm max-h-48">
            {filteredOptions.length === 0 ? (
              <li className="py-2 px-3 text-slate-500 text-center">No options found.</li>
            ) : (
              filteredOptions.map((opt, idx) => (
                <li
                  key={opt.value}
                  className={cn(
                    "py-2 px-3 cursor-pointer rounded-md flex justify-between items-center transition-colors",
                    highlightedIndex === idx ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
