import { useSyncExternalStore } from 'react';
import { feedbackCategories, feedbackTypes } from './model';
import type { FeedbackReport, FeedbackService, FeedbackState, FeedbackStorage } from './model';
import { validScreenshot } from './screenshot';

export const FEEDBACK_STORAGE_KEY = 'spc_feedback_v2';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
function nextAdminId(reports: FeedbackReport[]) {
  const next = reports.reduce((max, report) => Math.max(max, Number(report.adminId?.slice(3)) || 0), 0) + 1;
  return `FB-${String(next).padStart(5, '0')}`;
}
function isReport(value: unknown): value is FeedbackReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as FeedbackReport;
  return typeof r.reference === 'string' && typeof r.createdAt === 'string'
    && feedbackTypes.includes(r.type) && typeof r.title === 'string' && typeof r.description === 'string'
    && !!r.context && Array.isArray(r.context.activity)
    && (r.status === undefined || r.status === 'Open' || r.status === 'Closed')
    && (r.category === undefined || feedbackCategories.includes(r.category))
    && (r.adminId === undefined || /^FB-\d{5,}$/.test(r.adminId))
    && (!r.screenshot || validScreenshot(r.screenshot));
}
export function createLocalFeedbackStorage(storage: () => StoragePort = () => window.localStorage): FeedbackStorage {
  return {
    read() {
      const saved = storage().getItem(FEEDBACK_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (parsed.version !== 2 || !Array.isArray(parsed.reports) || !parsed.reports.every(isReport)) throw new Error('Invalid feedback data');
      const reports: FeedbackReport[] = parsed.reports.map((report: FeedbackReport) => ({ ...report, status: report.status ?? 'Open', category: report.category ?? 'Unclassified' }));
      let migrated = false;
      // Assign older submissions first, preserving list order and existing UUIDs.
      for (const report of [...reports].reverse()) {
        if (!report.adminId) { report.adminId = nextAdminId(reports); migrated = true; }
      }
      if (migrated) storage().setItem(FEEDBACK_STORAGE_KEY, JSON.stringify({ version: 2, reports }));
      return reports;
    },
    write(reports) { storage().setItem(FEEDBACK_STORAGE_KEY, JSON.stringify({ version: 2, reports })); },
  };
}

/** Local-only adapter: a write failure rejects submission and leaves the draft with the caller. */
export function createMockFeedbackService(storage: FeedbackStorage = createLocalFeedbackStorage(), delay = 650): FeedbackService {
  let state: FeedbackState = { reports: [], error: null };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const refresh = () => {
    try { state = { reports: storage.read(), error: null }; }
    catch { state = { ...state, error: 'Feedback could not be loaded. Please try again.' }; }
    emit();
  };
  refresh();
  return {
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    refresh,
    async setCategory(reference, category) {
      if (!feedbackCategories.includes(category)) throw new Error('Choose a valid category.');
      await new Promise(resolve => setTimeout(resolve, delay));
      const saved = storage.read();
      if (!saved.some(report => report.reference === reference)) throw new Error('Feedback is no longer available.');
      const reports = saved.map(report => report.reference === reference ? { ...report, category } : report);
      storage.write(reports);
      state = { reports, error: null };
      emit();
    },
    async setStatus(reference, status) {
      if (status !== 'Open' && status !== 'Closed') throw new Error('Choose Open or Closed.');
      await new Promise(resolve => setTimeout(resolve, delay));
      const saved = storage.read();
      if (!saved.some(report => report.reference === reference)) throw new Error('Feedback is no longer available.');
      const reports = saved.map(report => report.reference === reference ? { ...report, status } : report);
      storage.write(reports);
      state = { reports, error: null };
      emit();
    },
    async submit(draft) {
      if (!feedbackTypes.includes(draft.type) || !draft.title.trim() || !draft.description.trim()) throw new Error('Add a title and description.');
      if (draft.title.length > 140 || draft.description.length > 5000) throw new Error('The report exceeds the field length limit.');
      if (draft.screenshot && !validScreenshot(draft.screenshot)) throw new Error('Choose a valid screenshot.');
      const captured = structuredClone(draft);
      await new Promise(resolve => setTimeout(resolve, delay));
      const saved = storage.read();
      const report: FeedbackReport = {
        ...captured, title: captured.title.trim(), description: captured.description.trim(),
        reference: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'Open',
        adminId: nextAdminId(saved), category: 'Unclassified',
      };
      // Re-read so another tab's completed submissions are retained. No network transport.
      const reports = [report, ...saved];
      storage.write(reports);
      state = { reports, error: null };
      emit();
      return report;
    },
  };
}
export const feedbackService = createMockFeedbackService();
export function useFeedbackStore(service: FeedbackService = feedbackService) {
  return useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
}
