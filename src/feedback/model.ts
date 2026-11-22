import type { TechnicalContext } from './activity';

export const feedbackTypes = ['Report an issue', 'Suggest an improvement'] as const;
export type FeedbackType = typeof feedbackTypes[number];
export type Screenshot = { name: string; dataUrl: string };
export type FeedbackDraft = {
  type: FeedbackType; title: string; description: string;
  screenshot?: Screenshot; context: TechnicalContext;
};
export type FeedbackStatus = 'Open' | 'Closed';
export const feedbackCategories = ['Unclassified', 'Product', 'Engineering', 'AI'] as const;
export type FeedbackCategory = typeof feedbackCategories[number];
export type FeedbackReport = FeedbackDraft & { reference: string; adminId: string; createdAt: string; status: FeedbackStatus; category: FeedbackCategory };
export type FeedbackState = { reports: FeedbackReport[]; error: string | null };
export interface FeedbackStorage {
  read(): FeedbackReport[];
  write(reports: FeedbackReport[]): void;
}
export interface FeedbackService {
  subscribe(listener: () => void): () => void;
  getSnapshot(): FeedbackState;
  refresh(): void;
  submit(draft: FeedbackDraft): Promise<FeedbackReport>;
  setStatus(reference: string, status: FeedbackStatus): Promise<void>;
  setCategory(reference: string, category: FeedbackCategory): Promise<void>;
}
export interface FeedbackAuth {
  getAccount(): { name: string } | null;
  login(loginId: string, password: string): Promise<{ name: string }>;
  logout(): void;
}
