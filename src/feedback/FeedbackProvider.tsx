import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { captureContext, setActivityUser, trackAction } from './activity';
import type { TechnicalContext } from './activity';
import FeedbackPanel from './FeedbackPanel';

const FeedbackContext = createContext<{ open: () => void } | null>(null);
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const location = useLocation();
  const [snapshot, setSnapshot] = useState<TechnicalContext | null>(null);
  const lastLocation = useRef('');
  useEffect(() => {
    setActivityUser(currentUser?.id ?? null);
    const key = `${currentUser?.id}:${location.key}`;
    if (currentUser && lastLocation.current !== key) {
      trackAction('navigate', 'Success', location.pathname);
      lastLocation.current = key;
    }
  }, [currentUser?.id, location.key, location.pathname]);
  const open = () => {
    if (currentUser) setSnapshot(captureContext(currentUser, location.pathname));
  };
  return <FeedbackContext.Provider value={{ open }}>
    {children}
    {snapshot && <FeedbackPanel context={snapshot} onClose={() => setSnapshot(null)} />}
  </FeedbackContext.Provider>;
}
export function FeedbackButton() {
  const feedback = useContext(FeedbackContext)!;
  return <button type="button" onClick={feedback.open} className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-3" aria-haspopup="dialog"><MessageSquare className="hidden h-4 w-4 sm:block" aria-hidden="true" />Feedback</button>;
}
